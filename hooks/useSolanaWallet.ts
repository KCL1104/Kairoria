'use client'

import { useCallback, useEffect, useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { useToast } from '@/hooks/use-toast'

export interface WalletSignatureResult {
  signature: string
  publicKey: string
}

export const useSolanaWallet = () => {
  const { publicKey, signTransaction, signMessage, connected, wallet } = useWallet()
  const { connection } = useConnection()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const walletAddress = publicKey?.toBase58() || null

  // Sign a message to verify wallet ownership
  const signVerificationMessage = useCallback(async (message?: string): Promise<WalletSignatureResult | null> => {
    if (!publicKey || !signMessage) {
      toast({
        variant: "destructive",
        title: "Wallet not connected",
        description: "Please connect your wallet first",
      })
      return null
    }

    try {
      setIsLoading(true)
      
      // Create verification message
      const verificationMessage = message || `Verify wallet ownership for Kairoria at ${new Date().toISOString()}`
      const messageUint8 = new TextEncoder().encode(verificationMessage)
      
      // Sign the message
      const signature = await signMessage(messageUint8)
      
      const result: WalletSignatureResult = {
        signature: Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join(''),
        publicKey: publicKey.toBase58(),
      }
      
      toast({
        title: "Signature successful",
        description: "Wallet ownership verified",
      })
      
      return result
    } catch (error) {
      console.error('Message signing failed:', error)
      toast({
        variant: "destructive",
        title: "Signature failed",
        description: "Failed to sign verification message",
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [publicKey, signMessage, toast])

  // Sign and send a transaction
  const signAndSendTransaction = useCallback(async (transaction: Transaction) => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      
      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      // Sign transaction
      const signedTransaction = await signTransaction(transaction)
      
      // Send transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        }
      )

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(signature, 'confirmed')
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`)
      }

      toast({
        title: "Transaction successful",
        description: `Transaction confirmed: ${signature.slice(0, 8)}...`,
      })

      return {
        signature,
        confirmation,
      }
    } catch (error) {
      console.error('Transaction failed:', error)
      toast({
        variant: "destructive",
        title: "Transaction failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [publicKey, signTransaction, connection, toast])

  // Get wallet balance
  const getBalance = useCallback(async (): Promise<number | null> => {
    if (!publicKey) return null

    try {
      const balance = await connection.getBalance(publicKey)
      return balance / 1e9 // Convert lamports to SOL
    } catch (error) {
      console.error('Failed to get balance:', error)
      return null
    }
  }, [publicKey, connection])

  // Validate if an address is a valid Solana public key
  const isValidSolanaAddress = useCallback((address: string): boolean => {
    try {
      new PublicKey(address)
      return true
    } catch {
      return false
    }
  }, [])

  return {
    // Wallet state
    connected,
    walletAddress,
    publicKey,
    wallet,
    isLoading,
    
    // Wallet actions
    signVerificationMessage,
    signAndSendTransaction,
    getBalance,
    isValidSolanaAddress,
  }
}