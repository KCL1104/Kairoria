use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("31f4RcqyuAjnMz6AZZbZ6Tt7VUMjENHc5rSP8MYMc3Qt");

#[program]
pub mod kairoria_rental {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, admin: Pubkey) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;
        global_state.admin = admin;
        global_state.platform_fee_rate = 1000;
        global_state.bump = ctx.bumps.global_state;
        
        msg!("Kairoria Rental System initialized with admin: {}", admin);
        Ok(())
    }

    pub fn create_rental_transaction(
        ctx: Context<CreateRentalTransaction>,
        product_id: u64,
        owner_wallet: Pubkey,
        total_amount: u64,
        rental_start: i64,
        rental_end: i64,
        booking_id: String,
    ) -> Result<()> {
        require!(total_amount > 0, ErrorCode::InvalidAmount);
        require!(rental_end > rental_start, ErrorCode::InvalidRentalPeriod);
        require!(booking_id.len() <= 64, ErrorCode::BookingIdTooLong);

        let rental_transaction = &mut ctx.accounts.rental_transaction;
        rental_transaction.product_id = product_id;
        rental_transaction.renter = ctx.accounts.renter.key();
        rental_transaction.owner_wallet = owner_wallet;
        rental_transaction.total_amount = total_amount;
        rental_transaction.rental_start = rental_start;
        rental_transaction.rental_end = rental_end;
        rental_transaction.booking_id = booking_id;
        rental_transaction.status = TransactionStatus::Created;
        rental_transaction.created_at = Clock::get()?.unix_timestamp;
        rental_transaction.bump = ctx.bumps.rental_transaction;

        emit!(RentalTransactionCreated {
            product_id,
            renter: ctx.accounts.renter.key(),
            owner_wallet,
            total_amount,
            booking_id: rental_transaction.booking_id.clone(),
        });

        Ok(())
    }

    pub fn pay_rental(ctx: Context<PayRental>, amount: u64) -> Result<()> {
        let rental_transaction = &mut ctx.accounts.rental_transaction;
        
        require!(
            rental_transaction.status == TransactionStatus::Created,
            ErrorCode::InvalidTransactionStatus
        );
        require!(
            amount == rental_transaction.total_amount,
            ErrorCode::IncorrectPaymentAmount
        );

        let transfer_accounts = Transfer {
            from: ctx.accounts.renter_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.renter.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_accounts,
        );

        token::transfer(cpi_ctx, amount)?;

        rental_transaction.status = TransactionStatus::Paid;
        rental_transaction.paid_at = Some(Clock::get()?.unix_timestamp);
        rental_transaction.escrow_bump = ctx.bumps.escrow_token_account;

        emit!(RentalPaymentCompleted {
            booking_id: rental_transaction.booking_id.clone(),
            amount,
            renter: ctx.accounts.renter.key(),
        });

        Ok(())
    }

    pub fn complete_rental(ctx: Context<CompleteRental>) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp;
        let signer = ctx.accounts.signer.key();

        require!(
            ctx.accounts.rental_transaction.status == TransactionStatus::Paid,
            ErrorCode::InvalidTransactionStatus
        );

        require!(
            signer == ctx.accounts.rental_transaction.renter ||
            signer == ctx.accounts.rental_transaction.owner_wallet ||
            signer == ctx.accounts.global_state.admin,
            ErrorCode::UnauthorizedCompletion
        );

        let grace_period = 24 * 60 * 60;
        let completion_allowed_time = ctx.accounts.rental_transaction.rental_end + grace_period;
        
        require!(
            current_time >= completion_allowed_time || 
            signer == ctx.accounts.rental_transaction.renter,
            ErrorCode::CompletionNotAllowed
        );

        let global_state = &ctx.accounts.global_state;
        let total_amount = ctx.accounts.rental_transaction.total_amount;
        
        let platform_fee = total_amount
            .checked_mul(global_state.platform_fee_rate as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::MathOverflow)?;
        
        let owner_amount = total_amount
            .checked_sub(platform_fee)
            .ok_or(ErrorCode::MathOverflow)?;

        let seeds = &[
            b"rental_transaction",
            &ctx.accounts.rental_transaction.product_id.to_le_bytes()[..8],
            &ctx.accounts.rental_transaction.renter.to_bytes(),
            &[ctx.accounts.rental_transaction.bump],
        ];
        let pda_signer_seeds = &[&seeds[..]];

        // Transfer to owner
        let transfer_to_owner = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.owner_token_account.to_account_info(),
            authority: ctx.accounts.rental_transaction.to_account_info(),
        };

        let cpi_ctx_owner = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_to_owner,
            pda_signer_seeds,
        );

        token::transfer(cpi_ctx_owner, owner_amount)?;

        // Transfer platform fee to admin
        let transfer_to_admin = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.admin_token_account.to_account_info(),
            authority: ctx.accounts.rental_transaction.to_account_info(),
        };

        let cpi_ctx_admin = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_to_admin,
            pda_signer_seeds,
        );

        token::transfer(cpi_ctx_admin, platform_fee)?;

        let rental_transaction = &mut ctx.accounts.rental_transaction;
        rental_transaction.status = TransactionStatus::Completed;
        rental_transaction.completed_at = Some(current_time);

        emit!(RentalCompleted {
            booking_id: rental_transaction.booking_id.clone(),
            owner_amount,
            platform_fee,
            completed_by: signer,
        });

        Ok(())
    }

    pub fn admin_intervene(
        ctx: Context<AdminIntervene>,
        owner_percentage: u16,
        renter_refund_percentage: u16,
        reason: String,
    ) -> Result<()> {
        require!(
            ctx.accounts.admin.key() == ctx.accounts.global_state.admin,
            ErrorCode::UnauthorizedAdmin
        );
        let total_percentage = owner_percentage
            .checked_add(renter_refund_percentage)
            .ok_or(ErrorCode::MathOverflow)?;
        require!(
            total_percentage <= 10000,
            ErrorCode::InvalidPercentages
        );
        require!(reason.len() <= 256, ErrorCode::ReasonTooLong);

        require!(
            ctx.accounts.rental_transaction.status == TransactionStatus::Paid,
            ErrorCode::InvalidTransactionStatus
        );

        let total_amount = ctx.accounts.rental_transaction.total_amount;
        
        let owner_amount = total_amount
            .checked_mul(owner_percentage as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::MathOverflow)?;
        
        let renter_refund = total_amount
            .checked_mul(renter_refund_percentage as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::MathOverflow)?;
        
        let platform_fee = total_amount
            .checked_sub(owner_amount)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_sub(renter_refund)
            .ok_or(ErrorCode::MathOverflow)?;

        let seeds = &[
            b"rental_transaction",
            &ctx.accounts.rental_transaction.product_id.to_le_bytes()[..8],
            &ctx.accounts.rental_transaction.renter.to_bytes(),
            &[ctx.accounts.rental_transaction.bump],
        ];
        let pda_signer_seeds = &[&seeds[..]];

        if owner_amount > 0 {
            let transfer_to_owner = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.owner_token_account.to_account_info(),
                authority: ctx.accounts.rental_transaction.to_account_info(),
            };

            let cpi_ctx_owner = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_to_owner,
                pda_signer_seeds,
            );

            token::transfer(cpi_ctx_owner, owner_amount)?;
        }

        if renter_refund > 0 {
            let transfer_to_renter = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.renter_token_account.to_account_info(),
                authority: ctx.accounts.rental_transaction.to_account_info(),
            };

            let cpi_ctx_renter = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_to_renter,
                pda_signer_seeds,
            );

            token::transfer(cpi_ctx_renter, renter_refund)?;
        }

        if platform_fee > 0 {
            let transfer_to_admin = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.admin_token_account.to_account_info(),
                authority: ctx.accounts.rental_transaction.to_account_info(),
            };

            let cpi_ctx_admin = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_to_admin,
                pda_signer_seeds,
            );

            token::transfer(cpi_ctx_admin, platform_fee)?;
        }

        let rental_transaction = &mut ctx.accounts.rental_transaction;
        rental_transaction.status = TransactionStatus::Resolved;
        rental_transaction.completed_at = Some(Clock::get()?.unix_timestamp);
        rental_transaction.resolution_reason = Some(reason.clone());

        emit!(AdminIntervention {
            booking_id: rental_transaction.booking_id.clone(),
            owner_amount,
            renter_refund,
            platform_fee,
            reason,
            admin: ctx.accounts.admin.key(),
        });

        Ok(())
    }

    pub fn cancel_as_renter_created(ctx: Context<CancelAsRenterCreated>) -> Result<()> {
        let rental_transaction = &mut ctx.accounts.rental_transaction;
        let current_time = Clock::get()?.unix_timestamp;
        
        require!(
            ctx.accounts.renter.key() == rental_transaction.renter,
            ErrorCode::UnauthorizedCancellation
        );
        require!(
            rental_transaction.status == TransactionStatus::Created,
            ErrorCode::InvalidTransactionStatus
        );

        rental_transaction.status = TransactionStatus::Cancelled;
        rental_transaction.completed_at = Some(current_time);

        emit!(RentalCancelledByRenter {
            booking_id: rental_transaction.booking_id.clone(),
            renter: ctx.accounts.renter.key(),
            cancelled_at: current_time,
        });

        Ok(())
    }

    pub fn cancel_as_renter_paid(ctx: Context<CancelAsRenterPaid>) -> Result<()> {
        let rental_transaction = &mut ctx.accounts.rental_transaction;
        let current_time = Clock::get()?.unix_timestamp;
        
        require!(
            ctx.accounts.renter.key() == rental_transaction.renter,
            ErrorCode::UnauthorizedCancellation
        );
        require!(
            rental_transaction.status == TransactionStatus::Paid,
            ErrorCode::InvalidTransactionStatus
        );
        require!(
            current_time < rental_transaction.rental_start,
            ErrorCode::CancellationTooLate
        );

        // Calculate refund amount based on timing
        let time_until_rental = rental_transaction.rental_start - current_time;
        let one_day_in_seconds = 24 * 60 * 60;
        let refund_percentage = if time_until_rental >= one_day_in_seconds {
            10000u64 // 100%
        } else {
            5000u64 // 50%
        };

        let total_amount = rental_transaction.total_amount;
        let refund_amount = total_amount
            .checked_mul(refund_percentage)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::MathOverflow)?;

        let product_id = rental_transaction.product_id;
        let renter_key = rental_transaction.renter;
        let bump = rental_transaction.bump;
        
        let seeds = &[
            b"rental_transaction",
            &product_id.to_le_bytes()[..8],
            &renter_key.to_bytes(),
            &[bump],
        ];
        let pda_signer_seeds = &[&seeds[..]];

        if refund_amount > 0 {
            let transfer_refund = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.renter_token_account.to_account_info(),
                authority: rental_transaction.to_account_info(),
            };

            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_refund,
                pda_signer_seeds,
            );

            token::transfer(cpi_ctx, refund_amount)?;
        }

        let remaining_amount = total_amount
            .checked_sub(refund_amount)
            .ok_or(ErrorCode::MathOverflow)?;

        if remaining_amount > 0 {
            let transfer_fee = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.admin_token_account.to_account_info(),
                authority: rental_transaction.to_account_info(),
            };

            let cpi_ctx_fee = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_fee,
                pda_signer_seeds,
            );

            token::transfer(cpi_ctx_fee, remaining_amount)?;
        }

        rental_transaction.status = TransactionStatus::Cancelled;
        rental_transaction.completed_at = Some(current_time);

        emit!(RentalCancelledByRenterPaid {
            booking_id: rental_transaction.booking_id.clone(),
            renter: ctx.accounts.renter.key(),
            refund_amount,
            cancellation_fee: remaining_amount,
            cancelled_at: current_time,
        });

        Ok(())
    }

    pub fn cancel_as_owner(ctx: Context<CancelAsOwner>) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp;
        
        require!(
            ctx.accounts.rental_transaction.status == TransactionStatus::Paid,
            ErrorCode::InvalidTransactionStatus
        );
        require!(
            ctx.accounts.owner.key() == ctx.accounts.rental_transaction.owner_wallet,
            ErrorCode::UnauthorizedOwnerCancellation
        );
        
        let one_day_in_seconds = 24 * 60 * 60;
        let cancellation_deadline = ctx.accounts.rental_transaction.rental_start
            .checked_sub(one_day_in_seconds)
            .ok_or(ErrorCode::MathOverflow)?;
        
        require!(
            current_time <= cancellation_deadline,
            ErrorCode::OwnerCancellationTooLate
        );
        
        let seeds = &[
            b"rental_transaction",
            &ctx.accounts.rental_transaction.product_id.to_le_bytes()[..8],
            &ctx.accounts.rental_transaction.renter.to_bytes(),
            &[ctx.accounts.rental_transaction.bump],
        ];
        let pda_signer_seeds = &[&seeds[..]];

        let transfer_refund = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.renter_token_account.to_account_info(),
            authority: ctx.accounts.rental_transaction.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_refund,
            pda_signer_seeds,
        );

        let total_amount = ctx.accounts.rental_transaction.total_amount;
        token::transfer(cpi_ctx, total_amount)?;
        
        let rental_transaction = &mut ctx.accounts.rental_transaction;
        rental_transaction.status = TransactionStatus::Cancelled;
        rental_transaction.completed_at = Some(current_time);

        emit!(RentalCancelledByOwner {
            booking_id: rental_transaction.booking_id.clone(),
            owner: ctx.accounts.owner.key(),
            refund_amount: total_amount,
            cancelled_at: current_time,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 2 + 1,
        seeds = [b"global_state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(product_id: u64)]
pub struct CreateRentalTransaction<'info> {
    #[account(
        init,
        payer = renter,
        space = 8 + 8 + 32 + 32 + 8 + 8 + 8 + (4 + 64) + 1 + 8 + (1 + 8) + (1 + 8) + (1 + 4 + 256) + 1 + 1,
        seeds = [b"rental_transaction", &product_id.to_le_bytes()[..8], &renter.key().to_bytes()],
        bump
    )]
    pub rental_transaction: Account<'info, RentalTransaction>,
    
    #[account(mut)]
    pub renter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PayRental<'info> {
    #[account(
        mut,
        seeds = [b"rental_transaction", &rental_transaction.product_id.to_le_bytes()[..8], &rental_transaction.renter.to_bytes()],
        bump = rental_transaction.bump
    )]
    pub rental_transaction: Account<'info, RentalTransaction>,
    
    #[account(
        init_if_needed,
        payer = renter,
        seeds = [b"escrow", rental_transaction.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = rental_transaction
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = renter
    )]
    pub renter_token_account: Account<'info, TokenAccount>,
    
    pub usdc_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub renter: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompleteRental<'info> {
    #[account(
        mut,
        seeds = [b"rental_transaction", &rental_transaction.product_id.to_le_bytes()[..8], &rental_transaction.renter.to_bytes()],
        bump = rental_transaction.bump
    )]
    pub rental_transaction: Account<'info, RentalTransaction>,
    
    #[account(
        mut,
        seeds = [b"escrow", rental_transaction.key().as_ref()],
        bump = rental_transaction.escrow_bump,
        token::mint = usdc_mint,
        token::authority = rental_transaction
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = rental_transaction.owner_wallet
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = global_state.admin
    )]
    pub admin_token_account: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [b"global_state"],
        bump = global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,
    
    pub usdc_mint: Account<'info, Mint>,
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AdminIntervene<'info> {
    #[account(
        mut,
        seeds = [b"rental_transaction", &rental_transaction.product_id.to_le_bytes()[..8], &rental_transaction.renter.to_bytes()],
        bump = rental_transaction.bump
    )]
    pub rental_transaction: Account<'info, RentalTransaction>,
    
    #[account(
        mut,
        seeds = [b"escrow", rental_transaction.key().as_ref()],
        bump = rental_transaction.escrow_bump,
        token::mint = usdc_mint,
        token::authority = rental_transaction
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = rental_transaction.owner_wallet
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = rental_transaction.renter
    )]
    pub renter_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = global_state.admin
    )]
    pub admin_token_account: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [b"global_state"],
        bump = global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,
    
    pub usdc_mint: Account<'info, Mint>,
    pub admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelAsRenterCreated<'info> {
    #[account(
        mut,
        close = renter,
        seeds = [b"rental_transaction", &rental_transaction.product_id.to_le_bytes()[..8], &rental_transaction.renter.to_bytes()],
        bump = rental_transaction.bump
    )]
    pub rental_transaction: Account<'info, RentalTransaction>,
    
    #[account(mut)]
    pub renter: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelAsRenterPaid<'info> {
    #[account(
        mut,
        close = renter,
        seeds = [b"rental_transaction", &rental_transaction.product_id.to_le_bytes()[..8], &rental_transaction.renter.to_bytes()],
        bump = rental_transaction.bump
    )]
    pub rental_transaction: Account<'info, RentalTransaction>,
    
    #[account(
        mut,
        close = renter,
        seeds = [b"escrow", rental_transaction.key().as_ref()],
        bump = rental_transaction.escrow_bump,
        token::mint = usdc_mint,
        token::authority = rental_transaction
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = renter,
    )]
    pub renter_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = global_state.admin
    )]
    pub admin_token_account: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [b"global_state"],
        bump = global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut)]
    pub renter: Signer<'info>,
    
    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelAsOwner<'info> {
    #[account(
        mut,
        close = owner,
        seeds = [b"rental_transaction", &rental_transaction.product_id.to_le_bytes()[..8], &rental_transaction.renter.to_bytes()],
        bump = rental_transaction.bump
    )]
    pub rental_transaction: Account<'info, RentalTransaction>,
    
    #[account(
        mut,
        close = owner,
        seeds = [b"escrow", rental_transaction.key().as_ref()],
        bump = rental_transaction.escrow_bump,
        token::mint = usdc_mint,
        token::authority = rental_transaction
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = rental_transaction.renter
    )]
    pub renter_token_account: Account<'info, TokenAccount>,
    
    pub usdc_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

// Events for Anchor 0.31
#[event]
pub struct RentalTransactionCreated {
    pub product_id: u64,
    pub renter: Pubkey,
    pub owner_wallet: Pubkey,
    pub total_amount: u64,
    pub booking_id: String,
}

#[event]
pub struct RentalPaymentCompleted {
    pub booking_id: String,
    pub amount: u64,
    pub renter: Pubkey,
}

#[event]
pub struct RentalCompleted {
    pub booking_id: String,
    pub owner_amount: u64,
    pub platform_fee: u64,
    pub completed_by: Pubkey,
}

#[event]
pub struct AdminIntervention {
    pub booking_id: String,
    pub owner_amount: u64,
    pub renter_refund: u64,
    pub platform_fee: u64,
    pub reason: String,
    pub admin: Pubkey,
}

#[event]
pub struct RentalCancelledByRenter {
    pub booking_id: String,
    pub renter: Pubkey,
    pub cancelled_at: i64,
}

#[event]
pub struct RentalCancelledByOwner {
    pub booking_id: String,
    pub owner: Pubkey,
    pub refund_amount: u64,
    pub cancelled_at: i64,
}

#[event]
pub struct RentalCancelledByRenterPaid {
    pub booking_id: String,
    pub renter: Pubkey,
    pub refund_amount: u64,
    pub cancellation_fee: u64,
    pub cancelled_at: i64,
}

#[account]
pub struct GlobalState {
    pub admin: Pubkey,
    pub platform_fee_rate: u16,
    pub bump: u8,
}

#[account]
pub struct RentalTransaction {
    pub product_id: u64,
    pub renter: Pubkey,
    pub owner_wallet: Pubkey,
    pub total_amount: u64,
    pub rental_start: i64,
    pub rental_end: i64,
    pub booking_id: String,
    pub status: TransactionStatus,
    pub created_at: i64,
    pub paid_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub resolution_reason: Option<String>,
    pub bump: u8,
    pub escrow_bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TransactionStatus {
    Created,
    Paid,
    Completed,
    Cancelled,
    Resolved,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount specified")]
    InvalidAmount,
    #[msg("Invalid rental period")]
    InvalidRentalPeriod,
    #[msg("Booking ID too long")]
    BookingIdTooLong,
    #[msg("Invalid transaction status for this operation")]
    InvalidTransactionStatus,
    #[msg("Incorrect payment amount")]
    IncorrectPaymentAmount,
    #[msg("Completion not allowed yet")]
    CompletionNotAllowed,
    #[msg("Unauthorized admin access")]
    UnauthorizedAdmin,
    #[msg("Invalid percentage distribution")]
    InvalidPercentages,
    #[msg("Reason text too long")]
    ReasonTooLong,
    #[msg("Cannot cancel already paid transaction")]
    CannotCancelPaidTransaction,
    #[msg("Unauthorized cancellation")]
    UnauthorizedCancellation,
    #[msg("Unauthorized owner cancellation")]
    UnauthorizedOwnerCancellation,
    #[msg("Owner cancellation too late - must be at least 1 day before rental start")]
    OwnerCancellationTooLate,
    #[msg("Cannot cancel completed transaction")]
    CannotCancelCompletedTransaction,
    #[msg("Unauthorized completion - only renter, owner, or admin can complete")]
    UnauthorizedCompletion,
    #[msg("Math operation overflow")]
    MathOverflow,
    #[msg("Cancellation too late - rental period has already started")]
    CancellationTooLate,
}