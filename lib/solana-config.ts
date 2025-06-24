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

export function createConnection(): Connection {
  const config = getSolanaConfig()
  return new Connection(config.rpcUrl, 'confirmed')
}

export function validateSolanaConfig(): boolean {
  try {
    const config = getSolanaConfig()
    
    // Validate that all required config values are present
    if (!config.rpcUrl || !config.programId || !config.adminWallet || !config.usdcMint) {
      console.error('Missing required Solana configuration values')
      return false
    }

    // Validate that addresses are valid PublicKeys
    new PublicKey(config.programId)
    new PublicKey(config.adminWallet)
    new PublicKey(config.usdcMint)

    return true
  } catch (error) {
    console.error('Invalid Solana configuration:', error)
    return false
  }
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
  let connection: Connection | null = null
  return () => {
    if (!connection) {
      connection = createConnection()
    }
    return connection
  }
})()