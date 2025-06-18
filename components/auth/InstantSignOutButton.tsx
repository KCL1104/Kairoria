'use client'

import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { cn } from '@/lib/utils'

// Define the props for the sign-out button
interface InstantSignOutButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  showText?: boolean
  className?: string
  children?: React.ReactNode
}

export function InstantSignOutButton({
  variant = 'outline',
  size = 'default',
  showIcon = true,
  showText = true,
  className,
  children
}: InstantSignOutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      await supabase.auth.signOut()
      
      // Redirect to home page
      router.push('/?signout=success')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const buttonContent = children || (
    <>
      {showIcon && (
        isSigningOut ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )
      )}
      {showText && (
        <span className={showIcon ? "ml-2" : ""}>
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </span>
      )}
    </>
  )

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={cn(
        'transition-all duration-200',
        isSigningOut && 'opacity-70 cursor-not-allowed',
        className
      )}
    >
      {buttonContent}
    </Button>
  )
}