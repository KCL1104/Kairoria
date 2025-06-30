import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext'
import { SolanaWalletProvider } from '@/contexts/SolanaWalletProvider'


import { Toaster } from '@/components/ui/toaster'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kairoria | Marketplace',
  description: 'Find high-quality products to rent or list your own items to earn passive income',
  icons: {
    icon: '/Kairoria_logo.svg',
    shortcut: '/Kairoria_logo.svg',
    apple: '/Kairoria_logo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <SolanaWalletProvider>
            <SupabaseAuthProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster />
            </SupabaseAuthProvider>
          </SolanaWalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}