import { Connection, PublicKey, clusterApiUrl, Cluster } from '@solana/web3.js'

export interface SolanaConfig {
  rpcUrl: string
  network: 'mainnet' | 'devnet' | 'testnet'
  programId: string
  adminWallet: string
  usdcMint: string
}

export function getSolanaConfig(): SolanaConfig {
  const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'mainnet' | 'devnet' | 'testnet') || 'devnet'
  
  const config: SolanaConfig = {
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network as Cluster),
    network,
    programId: process.env.NEXT_PUBLIC_KAIRORIA_PROGRAM_ID || 'HczADmDQ7CSAQCjLnixgXHiJWg31ToAMKnyzamaadkbY',
    adminWallet: process.env.NEXT_PUBLIC_KAIRORIA_ADMIN_WALLET || '3Jcx1Ntm4DBpkg9VRuLPrecU5C2XmdoSeqCDTkg1K91D',
    usdcMint: network === 'mainnet' 
      ? process.env.NEXT_PUBLIC_USDC_MINT_MAINNET || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
      : process.env.NEXT_PUBLIC_USDC_MINT_DEVNET || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
  }

  return config
}



import { isValidSolanaAddress } from './utils';

export function validateSolanaConfig(): boolean {
  const config = getSolanaConfig();

  if (!config.rpcUrl || !config.programId || !config.adminWallet || !config.usdcMint) {
    console.error('Missing required Solana configuration values.');
    return false;
  }

  if (!isValidSolanaAddress(config.programId) || !isValidSolanaAddress(config.adminWallet) || !isValidSolanaAddress(config.usdcMint)) {
    console.error('Invalid Solana address in configuration.');
    return false;
  }

  return true;
}

// Export commonly used values - use lazy initialization to avoid module load errors
export const getSolanaConfigSingleton = (() => {
  let config: SolanaConfig | null = null
  return () => {
    if (!config) {
      config = getSolanaConfig()
    }
    return config
  }
})()

export const getSolanaConnectionSingleton = (() => {
  let connection: Connection | null = null;
  return () => {
    if (!connection) {
      const config = getSolanaConfigSingleton();
      connection = new Connection(config.rpcUrl, 'confirmed');
    }
    return connection;
  };
})();