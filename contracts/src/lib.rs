use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use std::mem::size_of;

declare_id!("HczADmDQ7CSAQCjLnixgXHiJWg31ToAMKnyzamaadkbY");

#[program]
pub mod kairoria_rental {
    use super::*;

    // Initialize the rental program with admin
    pub fn initialize(ctx: Context<Initialize>, admin: Pubkey) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;
        global_state.admin = admin;
        global_state.platform_fee_rate = 1000; // 10% (basis points: 10000 = 100%)
        global_state.bump = ctx.bumps.global_state;
        
        msg!("Kairoria Rental System initialized with admin: {}", admin);
        Ok(())
    }

    // Create a new rental transaction
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
        rental_transaction.created_at = ctx.accounts.clock.unix_timestamp;
        rental_transaction.bump = ctx.bumps.rental_transaction;

        msg!(
            "Rental transaction created for product {} by renter {} with amount {}",
            product_id,
            ctx.accounts.renter.key(),
            total_amount
        );

        Ok(())
    }

    // Renter pays for the rental
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

        // Transfer USDC from renter to escrow PDA
        let transfer_instruction = Transfer {
            from: ctx.accounts.renter_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.renter.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );

        token::transfer(cpi_ctx, amount)?;

        // Update transaction status
        rental_transaction.status = TransactionStatus::Paid;
        rental_transaction.paid_at = Some(ctx.accounts.clock.unix_timestamp);

        msg!(
            "Rental payment of {} USDC completed for transaction {}",
            amount,
            rental_transaction.booking_id
        );

        Ok(())
    }

    // Complete rental transaction (auto or manual)
    pub fn complete_rental(ctx: Context<CompleteRental>) -> Result<()> {
        let rental_transaction = &mut ctx.accounts.rental_transaction;
        let current_time = ctx.accounts.clock.unix_timestamp;
        let signer = ctx.accounts.signer.key();

        require!(
            rental_transaction.status == TransactionStatus::Paid,
            ErrorCode::InvalidTransactionStatus
        );

        // Enhanced permission check: only renter, owner, or admin can complete
        require!(
            signer == rental_transaction.renter ||
            signer == rental_transaction.owner_wallet ||
            signer == ctx.accounts.global_state.admin,
            ErrorCode::UnauthorizedCompletion
        );

        // Check if rental period has ended + 1 day grace period
        let grace_period = 24 * 60 * 60; // 1 day in seconds
        let completion_allowed_time = rental_transaction.rental_end + grace_period;
        
        require!(
            current_time >= completion_allowed_time || 
            signer == rental_transaction.renter,
            ErrorCode::CompletionNotAllowed
        );

        let global_state = &ctx.accounts.global_state;
        let total_amount = rental_transaction.total_amount;
        
        // Calculate amounts using u128 to prevent precision loss
        let total_amount_u128 = total_amount as u128;
        let platform_fee_u128 = (total_amount_u128 * global_state.platform_fee_rate as u128) / 10000u128;
        let owner_amount_u128 = total_amount_u128 - platform_fee_u128;
        
        // Convert back to u64 (safe since we started with u64)
        let platform_fee = platform_fee_u128 as u64;
        let owner_amount = owner_amount_u128 as u64;

        // Transfer 90% to owner
        let seeds = &[
            b"rental_transaction",
            &rental_transaction.product_id.to_le_bytes(),
            &rental_transaction.renter.to_bytes(),
            &[rental_transaction.bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_to_owner = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.owner_token_account.to_account_info(),
            authority: ctx.accounts.rental_transaction.to_account_info(),
        };

        let cpi_ctx_owner = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_to_owner,
            signer,
        );

        token::transfer(cpi_ctx_owner, owner_amount)?;

        // Transfer 10% to platform admin
        let transfer_to_admin = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.admin_token_account.to_account_info(),
            authority: ctx.accounts.rental_transaction.to_account_info(),
        };

        let cpi_ctx_admin = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_to_admin,
            signer,
        );

        token::transfer(cpi_ctx_admin, platform_fee)?;

        // Update transaction status
        rental_transaction.status = TransactionStatus::Completed;
        rental_transaction.completed_at = Some(current_time);

        msg!(
            "Rental transaction {} completed. Owner received: {}, Platform fee: {}",
            rental_transaction.booking_id,
            owner_amount,
            platform_fee
        );

        Ok(())
    }

    // Admin intervention for dispute resolution
    pub fn admin_intervene(
        ctx: Context<AdminIntervene>,
        owner_percentage: u16, // Basis points (0-10000)
        renter_refund_percentage: u16, // Basis points (0-10000)
        reason: String,
    ) -> Result<()> {
        require!(
            ctx.accounts.admin.key() == ctx.accounts.global_state.admin,
            ErrorCode::UnauthorizedAdmin
        );
        require!(
            owner_percentage + renter_refund_percentage <= 10000,
            ErrorCode::InvalidPercentages
        );
        require!(reason.len() <= 256, ErrorCode::ReasonTooLong);

        let rental_transaction = &mut ctx.accounts.rental_transaction;
        require!(
            rental_transaction.status == TransactionStatus::Paid,
            ErrorCode::InvalidTransactionStatus
        );

        // Use u128 for precise calculation to prevent precision loss
        let total_amount = rental_transaction.total_amount;
        let total_amount_u128 = total_amount as u128;
        
        let owner_amount_u128 = (total_amount_u128 * owner_percentage as u128) / 10000u128;
        let renter_refund_u128 = (total_amount_u128 * renter_refund_percentage as u128) / 10000u128;
        let platform_fee_u128 = total_amount_u128 - owner_amount_u128 - renter_refund_u128;
        
        // Convert back to u64 (safe since we started with u64)
        let owner_amount = owner_amount_u128 as u64;
        let renter_refund = renter_refund_u128 as u64;
        let platform_fee = platform_fee_u128 as u64;

        let seeds = &[
            b"rental_transaction",
            &rental_transaction.product_id.to_le_bytes(),
            &rental_transaction.renter.to_bytes(),
            &[rental_transaction.bump],
        ];
        let signer = &[&seeds[..]];

        // Transfer to owner if applicable
        if owner_amount > 0 {
            let transfer_to_owner = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.owner_token_account.to_account_info(),
                authority: ctx.accounts.rental_transaction.to_account_info(),
            };

            let cpi_ctx_owner = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_to_owner,
                signer,
            );

            token::transfer(cpi_ctx_owner, owner_amount)?;
        }

        // Refund to renter if applicable
        if renter_refund > 0 {
            let transfer_to_renter = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.renter_token_account.to_account_info(),
                authority: ctx.accounts.rental_transaction.to_account_info(),
            };

            let cpi_ctx_renter = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_to_renter,
                signer,
            );

            token::transfer(cpi_ctx_renter, renter_refund)?;
        }

        // Platform fee to admin
        if platform_fee > 0 {
            let transfer_to_admin = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.admin_token_account.to_account_info(),
                authority: ctx.accounts.rental_transaction.to_account_info(),
            };

            let cpi_ctx_admin = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_to_admin,
                signer,
            );

            token::transfer(cpi_ctx_admin, platform_fee)?;
        }

        // Update transaction status
        rental_transaction.status = TransactionStatus::Resolved;
        rental_transaction.completed_at = Some(ctx.accounts.clock.unix_timestamp);
        rental_transaction.resolution_reason = Some(reason.clone());

        msg!(
            "Admin intervention completed for transaction {}. Owner: {}, Renter: {}, Platform: {}. Reason: {}",
            rental_transaction.booking_id,
            owner_amount,
            renter_refund,
            platform_fee,
            reason
        );

        Ok(())
    }

    // Cancel rental transaction by renter (only before payment)
    pub fn cancel_as_renter(ctx: Context<CancelAsRenter>) -> Result<()> {
        let rental_transaction = &ctx.accounts.rental_transaction;
        let current_time = ctx.accounts.clock.unix_timestamp;
        
        require!(
            rental_transaction.status == TransactionStatus::Created,
            ErrorCode::CannotCancelPaidTransaction
        );
        require!(
            ctx.accounts.renter.key() == rental_transaction.renter,
            ErrorCode::UnauthorizedCancellation
        );

        msg!(
            "Rental transaction {} cancelled by renter at {}",
            rental_transaction.booking_id,
            current_time
        );

        Ok(())
    }

    // Cancel rental transaction by owner (only after payment, 1 day before rental start)
    pub fn cancel_as_owner(ctx: Context<CancelAsOwner>) -> Result<()> {
        let rental_transaction = &mut ctx.accounts.rental_transaction;
        let current_time = ctx.accounts.clock.unix_timestamp;
        
        require!(
            rental_transaction.status == TransactionStatus::Paid,
            ErrorCode::InvalidTransactionStatus
        );
        require!(
            ctx.accounts.owner.key() == rental_transaction.owner_wallet,
            ErrorCode::UnauthorizedOwnerCancellation
        );
        
        let one_day_in_seconds = 24 * 60 * 60;
        let cancellation_deadline = rental_transaction.rental_start - one_day_in_seconds;
        
        require!(
            current_time <= cancellation_deadline,
            ErrorCode::OwnerCancellationTooLate
        );
        
        // Refund the full amount to renter when owner cancels
        let seeds = &[
            b"rental_transaction",
            &rental_transaction.product_id.to_le_bytes(),
            &rental_transaction.renter.to_bytes(),
            &[rental_transaction.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_refund = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.renter_token_account.to_account_info(),
            authority: ctx.accounts.rental_transaction.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_refund,
            signer_seeds,
        );

        token::transfer(cpi_ctx, rental_transaction.total_amount)?;
        
        // Update status before closing accounts
        rental_transaction.status = TransactionStatus::Cancelled;
        rental_transaction.completed_at = Some(current_time);

        msg!(
            "Rental transaction {} cancelled by owner. Full refund of {} issued to renter at {}",
            rental_transaction.booking_id,
            rental_transaction.total_amount,
            current_time
        );

        Ok(())
    }
}

// Account structures
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + size_of::<GlobalState>(),
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
        space = 461,
        seeds = [b"rental_transaction", &product_id.to_le_bytes(), &renter.key().to_bytes()],
        bump
    )]
    pub rental_transaction: Account<'info, RentalTransaction>,
    
    #[account(mut)]
    pub renter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct PayRental<'info> {
    #[account(
        mut,
        seeds = [b"rental_transaction", &rental_transaction.product_id.to_le_bytes(), &rental_transaction.renter.to_bytes()],
        bump = rental_transaction.bump
    )]
    pub rental_transaction: Account<'info, RentalTransaction>,
    
    #[account(
        init_if_needed,
        payer = renter,
        associated_token::mint = usdc_mint,
        associated_token::authority = rental_transaction
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
    pub associated_token_program: Program<'info, token::AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct CompleteRental<'info> {
    #[account(
        mut,
        seeds = [b"rental_transaction", &rental_transaction.product_id.to_le_bytes(), &rental_transaction.renter.to_bytes()],
        bump = rental_transaction.bump
    )]
    pub rental_transaction: Account<'info, RentalTransaction>,
    
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = rental_transaction
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
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct AdminIntervene<'info> {
    #[account(
        mut,
        seeds = [b"rental_transaction", &rental_transaction.product_id.to_le_bytes(), &rental_transaction.renter.to_bytes()],
        bump = rental_transaction.bump
    )]
    pub rental_transaction: Account<'info, RentalTransaction>,
    
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = rental_transaction
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
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct CancelAsRenter<'info> {
    #[account(
        mut,
        close = renter,
        seeds = [b"rental_transaction", &rental_transaction.product_id.to_le_bytes(), &rental_transaction.renter.to_bytes()],
        bump = rental_transaction.bump
    )]
    pub rental_transaction: Account<'info, RentalTransaction>,
    
    #[account(mut)]
    pub renter: Signer<'info>,
    
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct CancelAsOwner<'info> {
    #[account(
        mut,
        close = owner,
        seeds = [b"rental_transaction", &rental_transaction.product_id.to_le_bytes(), &rental_transaction.renter.to_bytes()],
        bump = rental_transaction.bump
    )]
    pub rental_transaction: Account<'info, RentalTransaction>,
    
    #[account(
        mut,
        close = owner,
        associated_token::mint = usdc_mint,
        associated_token::authority = rental_transaction
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
    pub clock: Sysvar<'info, Clock>,
}

// Data structures
#[account]
pub struct GlobalState {
    pub admin: Pubkey,
    pub platform_fee_rate: u16, // Basis points (10000 = 100%)
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
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TransactionStatus {
    Created,
    Paid,
    Completed,
    Cancelled,
    Resolved, // Admin intervention
}

// Error codes
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
}