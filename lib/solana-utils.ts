import { AnchorProvider, Program, Idl, Wallet } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { KairoriaRental } from './kairoria_rental';
import idl from './kairoria_rental.json';

export function getAnchorProvider(connection: Connection, wallet: Wallet): AnchorProvider {
  return new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
}

export function getKairoriaProgram(provider: AnchorProvider): Program<KairoriaRental> {
  const programId = new PublicKey(process.env.NEXT_PUBLIC_KAIRORIA_PROGRAM_ID || '31f4RcqyuAjnMz6AZZbZ6Tt7VUMjENHc5rSP8MYMc3Qt');
  return new Program(idl as any as KairoriaRental, programId, provider);
}