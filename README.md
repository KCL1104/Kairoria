# Kairoria - Decentralized Rental Marketplace

![Kairoria Logo](public/Kairoria_logo.svg)

**A blockchain-powered rental marketplace where users can rent and list physical items using cryptocurrency payments on the Solana network.**

## 🌟 Overview

Kairoria is a revolutionary decentralized marketplace that combines traditional e-commerce functionality with blockchain technology. Built on Next.js and powered by Solana smart contracts, it enables secure peer-to-peer rentals with cryptocurrency payments, automated escrow, and transparent fee distribution.

## ✨ Key Features

### 🏪 **Marketplace Platform**
- **Product Listings**: Comprehensive item listings with images, descriptions, and pricing
- **Smart Search**: Advanced filtering by location, price, dates, and 17+ categories
- **Interactive Map**: Google Maps integration for location-based discovery
- **Availability Management**: Real-time booking conflict prevention

### 💰 **Blockchain-Powered Payments**
- **Solana Integration**: Fast, low-cost transactions on Solana blockchain
- **USDC/USDT Support**: Stablecoin payments for price stability
- **Smart Contract Escrow**: Automated fund holding and distribution
- **Transparent Fees**: On-chain fee distribution with configurable rates

### 🔐 **Secure Rental System**
- **Escrow Protection**: Funds held securely until rental completion
- **Flexible Cancellation**: Time-based refund policies
- **Dispute Resolution**: Admin intervention capabilities
- **Grace Periods**: 24-hour completion windows

### 🎯 **User Experience**
- **Dual Authentication**: Supabase + Firebase integration
- **Wallet Integration**: Support for Phantom, Solflare, Ledger wallets
- **Real-time Messaging**: Built-in chat between renters and owners
- **Mobile Responsive**: Optimized for all device sizes

## 🛠 Technology Stack

### **Frontend**
- **Next.js 15+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern component library
- **Google Maps API** - Location services

### **Backend & Database**
- **Supabase** - PostgreSQL database with real-time features
- **Next.js API Routes** - Server-side functionality
- **Firebase Auth** - Phone verification
- **Row Level Security** - Database-level permissions

### **Blockchain**
- **Solana** - High-performance blockchain
- **Anchor Framework** - Rust smart contract development
- **SPL Tokens** - USDC/USDT integration
- **Wallet Adapters** - Multi-wallet support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Solana CLI (for smart contract development)
- Supabase account
- Google Maps API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/kairoria.git
   cd kairoria/web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Solana
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   NEXT_PUBLIC_SOLANA_RPC_URL=your_rpc_url
   NEXT_PUBLIC_KAIRORIA_PROGRAM_ID=your_program_id
   
   # Google Maps
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
   
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   ```

4. **Database Setup**
   ```bash
   # Apply database migrations
   npx supabase db push
   
   # Seed initial data
   npm run seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── marketplace/       # Product listing pages
│   └── profile/           # User profile pages
├── components/            # Reusable UI components
│   ├── auth/              # Authentication components
│   ├── marketplace/       # Marketplace components
│   └── ui/                # Base UI components
├── contexts/              # React context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Core utilities and configurations
│   ├── solana-booking.ts  # Solana smart contract integration
│   ├── supabase-client.ts # Database client
│   └── utils.ts           # Helper functions
├── program/               # Rust smart contract
└── supabase/              # Database schema and migrations
```

## 🔗 Smart Contract Integration

### Core Smart Contract Functions

```typescript
// Create a rental transaction
await createRentalTransactionInstruction(
  program,
  productId,
  ownerWallet,
  totalAmount,
  rentalStart,
  rentalEnd,
  bookingId
)

// Process payment to escrow
await createPaymentInstruction(
  program,
  productId,
  amount
)

// Complete rental and distribute funds
await createCompletionInstruction(
  program,
  productId,
  renterPublicKey,
  ownerPublicKey
)
```

### Wallet Integration

```typescript
import { useSolanaWallet } from '@/hooks/useSolanaWallet'

const {
  connected,
  walletAddress,
  signAndSendTransaction,
  getBalance
} = useSolanaWallet()
```

## 📊 Database Schema

Key database tables:
- **profiles** - User profile information
- **products** - Item listings
- **bookings** - Rental transactions
- **categories** - Product categories
- **messages** - User communications
- **reviews** - Rating system

## 🧪 Testing

```bash
# Run E2E tests
npm run test

# Run specific test suites
npm run test:auth
npm run test:ui
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npx vercel --prod
   ```

2. **Configure Environment Variables**
   Set all required environment variables in your Vercel dashboard

3. **Deploy Smart Contract**
   ```bash
   # Deploy to devnet
   anchor deploy --provider.cluster devnet
   
   # Deploy to mainnet
   anchor deploy --provider.cluster mainnet
   ```

### Environment-Specific Configuration

- **Development**: Uses Solana devnet with test tokens
- **Production**: Configured for Solana mainnet with real USDC/USDT

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/kairoria/issues)
- **Discord**: [Join our community](https://discord.gg/kairoria)

## 🏗 Architecture Highlights

### Blockchain Security
- **Program Derived Addresses (PDAs)** for secure account management
- **Escrow-based payments** prevent fraud
- **Time-locked operations** with cancellation windows
- **Role-based permissions** for different user types

### Scalability
- **Optimized bundle splitting** for fast loading
- **Server-side rendering** for SEO
- **Image optimization** with Next.js
- **Database connection pooling**

### User Experience
- **Instant sign-out** with comprehensive cleanup
- **Progressive enhancement** works without JavaScript
- **Accessibility** compliant with WCAG guidelines
- **Mobile-first** responsive design

---

**Built with ❤️ by the Kairoria Team**

*Empowering the sharing economy through decentralized technology*