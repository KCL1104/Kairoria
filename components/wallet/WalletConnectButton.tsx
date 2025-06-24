'use client'

import { FC, useCallback, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, ExternalLink, Wallet } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WalletConnectButtonProps {
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showAddress?: boolean
  showBalance?: boolean
  onWalletConnect?: (publicKey: string) => void
  onWalletDisconnect?: () => void
}

export const WalletConnectButton: FC<WalletConnectButtonProps> = ({
  className,
  variant = 'default',
  size = 'default',
  showAddress = false,
  showBalance = false,
  onWalletConnect,
  onWalletDisconnect,
}) => {
  const { publicKey, wallet, connect, disconnect, connecting, connected } = useWallet()
  const { toast } = useToast()

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey])
  
  const handleConnect = useCallback(async () => {
    try {
      await connect()
      if (publicKey && onWalletConnect) {
        onWalletConnect(publicKey.toBase58())
      }
      toast({
        title: "Wallet Connected",
        description: `Connected to ${wallet?.adapter.name}`,
      })
    } catch (error) {
      console.error('Wallet connection failed:', error)
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
      })
    }
  }, [connect, publicKey, onWalletConnect, wallet, toast])

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect()
      if (onWalletDisconnect) {
        onWalletDisconnect()
      }
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      })
    } catch (error) {
      console.error('Wallet disconnection failed:', error)
    }
  }, [disconnect, onWalletDisconnect, toast])

  const copyAddress = useCallback(() => {
    if (base58) {
      navigator.clipboard.writeText(base58)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }, [base58, toast])

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  if (!wallet) {
    return (
      <div className="wallet-adapter-button-trigger">
        <WalletMultiButton className={className} />
      </div>
    )
  }

  if (!connected) {
    return (
      <Button
        onClick={handleConnect}
        disabled={connecting}
        variant={variant}
        size={size}
        className={className}
      >
        <Wallet className="mr-2 h-4 w-4" />
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showAddress && base58 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            {truncateAddress(base58)}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyAddress}
            className="h-6 w-6"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      <Button
        onClick={handleDisconnect}
        variant="outline"
        size={size}
      >
        Disconnect
      </Button>
    </div>
  )
}

export default WalletConnectButton