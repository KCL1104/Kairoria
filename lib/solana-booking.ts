import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram
} from '@solana/web3.js'
import { 
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID 
} from '@solana/spl-token'
import { BN, Program, AnchorProvider, Idl } from '@coral-xyz/anchor'
import { KairoriaRental } from './kairoria_rental';
import idl from './kairoria_rental.json';

// Kairoria Rental Program ID - use lazy initialization
export const getKairoriaProgramId = () => {
  return new PublicKey(
    process.env.NEXT_PUBLIC_KAIRORIA_PROGRAM_ID || '31f4RcqyuAjnMz6AZZbZ6Tt7VUMjENHc5rSP8MYMc3Qt'
  )
}

export const getKairoriaProgram = (provider: AnchorProvider) => {
  return new Program<KairoriaRental>(idl as any as KairoriaRental, getKairoriaProgramId(), provider)
}

// USDC Mint Address (Network dependent)
export const getUSDCMint = () => {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
  if (network === 'mainnet') {
    return new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT_MAINNET || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
  }
  return new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT_DEVNET || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
}

// Use lazy initialization for USDC mint
export const getUSDCMintSingleton = (() => {
  let mint: PublicKey | null = null
  return () => {
    if (!mint) {
      mint = getUSDCMint()
    }
    return mint
  }
})()

// Platform admin address - use lazy initialization
export const getPlatformAdmin = () => {
  return new PublicKey(
    process.env.NEXT_PUBLIC_KAIRORIA_ADMIN_WALLET || '3Jcx1Ntm4DBpkg9VRuLPrecU5C2XmdoSeqCDTkg1K91D'
  )
}

// Solana RPC Connection
export const getSolanaConnection = () => {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
  return new Connection(rpcUrl, 'confirmed')
}

/**
 * Generate PDA for rental transaction
 */
export function getRentalTransactionPDA(
  productId: number,
  renterPublicKey: PublicKey,
  programId?: PublicKey
): [PublicKey, number] {
  const programIdToUse = programId || getKairoriaProgramId()
  const productIdBuffer = Buffer.alloc(8)
  productIdBuffer.writeBigUInt64LE(BigInt(productId), 0)
  
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('rental_transaction'),
      productIdBuffer,
      renterPublicKey.toBuffer(),
    ],
    programIdToUse
  )
}

/**
 * Generate PDA for global state
 */
export function getGlobalStatePDA(programId?: PublicKey): [PublicKey, number] {
  const programIdToUse = programId || getKairoriaProgramId()
  return PublicKey.findProgramAddressSync(
    [Buffer.from('global_state')],
    programIdToUse
  )
}

/**
 * Create rental transaction instruction
 */
export async function createRentalTransactionInstruction(
  program: Program<KairoriaRental>,
  productId: number,
  ownerWallet: PublicKey,
  totalAmount: number,
  rentalStart: number,
  rentalEnd: number,
  bookingId: string
) {
  const renter = program.provider.publicKey
  if (!renter) throw new Error('Renter wallet not connected.')

  const [rentalTransactionPDA] = getRentalTransactionPDA(productId, renter)

  return program.methods
    .createRentalTransaction(
      new BN(productId),
      ownerWallet,
      new BN(totalAmount),
      new BN(rentalStart),
      new BN(rentalEnd),
      bookingId
    )
    .accounts({
      rentalTransaction: rentalTransactionPDA,
      renter: renter,
      systemProgram: SystemProgram.programId,
    })
    .instruction()
}

/**
 * Create payment instruction for rental
 */
export async function createPaymentInstruction(
  program: Program<KairoriaRental>,
  productId: number,
  amount: number
) {
  const renter = program.provider.publicKey
  if (!renter) throw new Error('Renter wallet not connected.')

  const [rentalTransactionPDA] = getRentalTransactionPDA(productId, renter)
  const usdcMint = getUSDCMintSingleton()

  const renterTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    renter
  )
  const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), rentalTransactionPDA.toBuffer()],
    program.programId
  )

  return program.methods
    .payRental(new BN(amount))
    .accounts({
      rentalTransaction: rentalTransactionPDA,
      escrowTokenAccount,
      renterTokenAccount,
      usdcMint: usdcMint,
      renter: renter,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction()
}

/**
 * Create completion instruction for rental
 */
export async function createCompletionInstruction(
  program: Program<KairoriaRental>,
  productId: number,
  renterPublicKey: PublicKey,
  ownerPublicKey: PublicKey
) {
  const signer = program.provider.publicKey
  if (!signer) throw new Error('Signer wallet not connected.')

  const [rentalTransactionPDA] = getRentalTransactionPDA(productId, renterPublicKey)
  const [globalStatePDA] = getGlobalStatePDA()
  const usdcMint = getUSDCMintSingleton()
  const platformAdmin = getPlatformAdmin()

  const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), rentalTransactionPDA.toBuffer()],
    program.programId
  )

  const ownerTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    ownerPublicKey
  )
  const adminTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    platformAdmin
  )

  return program.methods
    .completeRental()
    .accounts({
      rentalTransaction: rentalTransactionPDA,
      escrowTokenAccount,
      ownerTokenAccount,
      adminTokenAccount,
      globalState: globalStatePDA,
      usdcMint: usdcMint,
      signer: signer,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction()
}

/**
 * Create admin intervention instruction
 */
export async function createCancelAsRenterCreatedInstruction(
  program: Program<KairoriaRental>,
  productId: number
) {
  const renter = program.provider.publicKey
  if (!renter) throw new Error('Renter wallet not connected.')

  const [rentalTransactionPDA] = getRentalTransactionPDA(productId, renter)

  return program.methods
    .cancelAsRenterCreated()
    .accounts({
      rentalTransaction: rentalTransactionPDA,
      renter: renter,
      systemProgram: SystemProgram.programId,
    })
    .instruction()
}

export async function createCancelAsRenterPaidInstruction(
  program: Program<KairoriaRental>,
  productId: number
) {
  const renter = program.provider.publicKey;
  if (!renter) throw new Error('Renter wallet not connected.');

  const [rentalTransactionPDA] = getRentalTransactionPDA(productId, renter);
  const [globalStatePDA] = getGlobalStatePDA();
  const usdcMint = getUSDCMintSingleton();

  const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), rentalTransactionPDA.toBuffer()],
    program.programId
  );
  const renterTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    renter
  );

  return program.methods
    .cancelAsRenterPaid()
    .accounts({
      rentalTransaction: rentalTransactionPDA,
      escrowTokenAccount,
      renterTokenAccount,
      renter: renter,
      globalState: globalStatePDA,
      usdcMint: usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function createCancelAsOwnerInstruction(
  program: Program<KairoriaRental>,
  productId: number,
  renterPublicKey: PublicKey
) {
  const owner = program.provider.publicKey
  if (!owner) throw new Error('Owner wallet not connected.')

  const [rentalTransactionPDA] = getRentalTransactionPDA(productId, renterPublicKey)
  const [globalStatePDA] = getGlobalStatePDA()
  const usdcMint = getUSDCMintSingleton()

  const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), rentalTransactionPDA.toBuffer()],
    program.programId
  )
  const renterTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    renterPublicKey
  )

  return program.methods
    .cancelAsOwner()
    .accounts({
      rentalTransaction: rentalTransactionPDA,
      escrowTokenAccount,
      renterTokenAccount,
      owner: owner,
      globalState: globalStatePDA,
      usdcMint: usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction()
}

/**
 * Create admin intervention instruction
 */
export async function createAdminInterventionInstruction(
  program: Program<KairoriaRental>,
  productId: number,
  renterPublicKey: PublicKey,
  ownerPublicKey: PublicKey,
  ownerPercentage: number,
  renterRefundPercentage: number,
  reason: string
) {
  const admin = program.provider.publicKey
  if (!admin) throw new Error('Admin wallet not connected.')

  const [rentalTransactionPDA] = getRentalTransactionPDA(productId, renterPublicKey)
  const [globalStatePDA] = getGlobalStatePDA()
  const usdcMint = getUSDCMintSingleton()

  const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), rentalTransactionPDA.toBuffer()],
    program.programId
  )

  const ownerTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    ownerPublicKey
  )
  const renterTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    renterPublicKey
  )
  const adminTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    admin
  )

  return program.methods
    .adminIntervene(ownerPercentage, renterRefundPercentage, reason)
    .accounts({
      rentalTransaction: rentalTransactionPDA,
      escrowTokenAccount,
      ownerTokenAccount,
      renterTokenAccount,
      adminTokenAccount,
      globalState: globalStatePDA,
      usdcMint: usdcMint,
      admin: admin,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction()
}

/**
 * Get rental transaction data from blockchain
 */
export async function getRentalTransactionData(
  program: Program<KairoriaRental>,
  productId: number,
  renterPublicKey: PublicKey
) {
  try {
    const [rentalTransactionPDA] = getRentalTransactionPDA(productId, renterPublicKey)
    const rentalTransaction = await program.account.rentalTransaction.fetch(rentalTransactionPDA)
    return rentalTransaction
  } catch (error) {
    console.error('Error fetching rental transaction data:', error)
    return null
  }
}

/**
 * Generate booking instructions for frontend
 */
export interface BookingInstructions {
  createTransaction: any
  payRental: any
  completeRental: any
  programId: string
  pdas: {
    rentalTransaction: string
    globalState: string
  }
}

/**
 * Utility function to convert USDC amount to lamports (6 decimal places)
 */
export function usdcToLamports(usdcAmount: number): number {
  return Math.floor(usdcAmount * 1_000_000) // USDC has 6 decimal places
}

/**
 * Utility function to convert lamports to USDC
 */
export function lamportsToUsdc(lamports: number): number {
  return lamports / 1_000_000
}