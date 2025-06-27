import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { PublicKey } from '@solana/web3.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility function to convert USDC amount to lamports (6 decimal places)
 */
export function usdcToLamports(usdcAmount: number): number {
  return Math.floor(usdcAmount * 1_000_000); // USDC has 6 decimal places
}

/**
 * Utility function to convert lamports to USDC
 */
export function lamportsToUsdc(lamports: number): number {
  return lamports / 1_000_000;
}

/**
 * Check if a Solana address is valid
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
