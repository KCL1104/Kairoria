"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Menu, X, MessageSquare, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/SupabaseAuthContext"
import { InstantSignOutButton } from "@/components/auth/InstantSignOutButton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, profile, isAuthenticated } = useAuth()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
            <span>Kairoria</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <nav className="flex items-center gap-6">
            <Link 
              href="/marketplace" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/marketplace" ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Marketplace
            </Link>
            <Link 
              href="/how-it-works"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/how-it-works" ? "text-foreground" : "text-muted-foreground"
              )}
            >
              How It Works
            </Link>
            <Link 
              href="/about"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/about" ? "text-foreground" : "text-muted-foreground"
              )}
            >
              About
            </Link>
            <Link 
              href="/contact"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/contact" ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Contact
            </Link>
          </nav>

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link href="/messages">
                <Button variant="ghost" size="icon">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={profile?.avatar_url || user?.user_metadata?.avatar_url} 
                        alt={profile?.full_name || user?.user_metadata?.full_name || "User"} 
                      />
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0) || user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/profile/listings')}>
                    My Listings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/profile/listings/new')}>
                    List New Item
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <InstantSignOutButton 
                      variant="ghost" 
                      size="sm"
                      className="w-full justify-start px-2 py-1.5 h-auto font-normal"
                      confirmBeforeSignOut={true}
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="container md:hidden py-4 pb-6">
          <nav className="flex flex-col gap-4">
            <Link
              href="/marketplace"
              className="text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Marketplace
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="h-px bg-border my-2" />
            
            {isAuthenticated ? (
              <>
                <Link
                  href="/messages"
                  className="flex items-center gap-2 text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/profile/listings"
                  className="text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Listings
                </Link>
                <Link
                  href="/profile/listings/new"
                  className="text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  List New Item
                </Link>
                <InstantSignOutButton 
                  variant="outline" 
                  className="justify-start w-full"
                  confirmBeforeSignOut={true}
                />
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}