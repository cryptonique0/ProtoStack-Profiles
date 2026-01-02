# ProtoVM Profiles 🚀

A comprehensive Web3-native user profiles system built on the ProtoVM foundation. Create, manage, and showcase your decentralized identity across multiple chains.

![ProtoVM Profiles](https://via.placeholder.com/1200x600/1a1a2e/ffffff?text=ProtoVM+Profiles)

## ✨ Features

### 🔐 Authentication

- **Wallet Connection** - Connect with MetaMask, WalletConnect, Coinbase Wallet, and more via RainbowKit
- **Sign-In with Ethereum (SIWE)** - Secure wallet-based authentication
- **OAuth Support** - Traditional auth with GitHub, Google, Twitter, Discord
- **Multi-chain Support** - Ethereum, Polygon, Arbitrum, Optimism, Base + testnets

### 👤 Profile Management

- **Customizable Profiles** - Display name, bio, avatar, cover image
- **ENS Integration** - Automatic ENS name and avatar resolution
- **IPFS Storage** - Decentralized profile data storage
- **Privacy Controls** - Control what information is public

### 🏆 Gamification

- **Achievement Badges** - Earn NFT badges for activities
- **Points System** - Accumulate points from badges and activities
- **Leaderboards** - Compete for top positions
- **Activity Feed** - Track profile activities

### 🎨 NFT Integration

- **NFT Avatars** - Use NFTs as profile pictures
- **NFT Gallery** - Showcase your NFT collection
- **On-chain Verification** - Verify profile ownership on-chain

### 📊 Analytics

- **PostHog Integration** - Privacy-friendly analytics
- **Web3 Event Tracking** - Track wallet connections, transactions
- **Profile Statistics** - Views, followers, engagement metrics

## 🛠 Tech Stack

| Category      | Technology                               |
| ------------- | ---------------------------------------- |
| **Frontend**  | Next.js 14, React 18, TypeScript         |
| **Styling**   | Tailwind CSS, Framer Motion, Radix UI    |
| **Web3**      | Wagmi v2, RainbowKit v2, viem, ethers.js |
| **State**     | Zustand with persist middleware          |
| **Backend**   | Supabase (PostgreSQL), NextAuth          |
| **Storage**   | IPFS (NFT.Storage, Pinata)               |
| **Contracts** | Solidity, Hardhat, OpenZeppelin          |
| **Analytics** | PostHog                                  |
| **Testing**   | Vitest, Playwright, Storybook            |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/protovm-profiles.git
   cd protovm-profiles
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in the required environment variables (see [Environment Variables](#environment-variables))

4. **Start the development server**

   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Web3
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key

# IPFS (choose one)
NFT_STORAGE_API_KEY=your_nft_storage_key
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## 📁 Project Structure

```
protovm-profiles/
├── contracts/              # Solidity smart contracts
│   ├── ProtoVMProfileRegistry.sol
│   ├── ProtoVMProfileNFT.sol
│   └── ProtoVMBadges.sol
├── scripts/                # Deployment scripts
├── test/                   # Contract tests
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── api/           # API routes
│   │   ├── profile/       # Profile pages
│   │   ├── explore/       # Explore page
│   │   └── leaderboard/   # Leaderboard page
│   ├── components/        # React components
│   │   ├── ui/            # Base UI components
│   │   ├── layout/        # Layout components
│   │   ├── landing/       # Landing page sections
│   │   ├── profile/       # Profile components
│   │   ├── explore/       # Explore components
│   │   └── leaderboard/   # Leaderboard components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and configs
│   ├── services/          # Business logic services
│   ├── stores/            # Zustand stores
│   └── types/             # TypeScript types
├── public/                # Static assets
└── supabase/              # Database migrations
```

## 🔧 Smart Contracts

### ProtoVMProfileRegistry

Upgradeable registry for on-chain profile data. Stores IPFS hashes and verification status.

**Key Features:**

- Profile creation with unique usernames
- IPFS hash storage for profile data
- Verification system with authorized verifiers
- Fee management for profile creation/username changes

### ProtoVMProfileNFT

Soulbound ERC-721 token representing user profiles.

**Key Features:**

- One NFT per address (soulbound by default)
- Mintable profile NFTs
- Updateable token URI
- Optional transferability

### ProtoVMBadges

ERC-1155 multi-token for achievement badges.

**Key Features:**

- Multiple badge types with metadata
- Points system
- Category organization
- Batch minting
- Configurable transferability

### Deploying Contracts

1. **Compile contracts**

   ```bash
   npx hardhat compile
   ```

2. **Run tests**

   ```bash
   npx hardhat test
   ```

3. **Deploy to testnet**

   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

4. **Verify contracts**
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

## 🗄 Database Schema

### Tables

- **profiles** - User profile data
- **followers** - Follow relationships
- **badges** - Badge definitions
- **user_badges** - User-earned badges
- **activity** - Activity feed items
- **notifications** - User notifications

Run migrations:

```bash
pnpm supabase db push
```

## 📖 API Routes

| Method      | Endpoint                  | Description                 |
| ----------- | ------------------------- | --------------------------- |
| POST        | `/api/auth/[...nextauth]` | NextAuth authentication     |
| GET/POST    | `/api/auth/siwe/nonce`    | SIWE nonce generation       |
| POST        | `/api/auth/siwe/verify`   | SIWE signature verification |
| GET/POST    | `/api/profiles`           | List/create profiles        |
| GET/PUT     | `/api/profiles/[address]` | Get/update single profile   |
| GET         | `/api/profiles/search`    | Search profiles             |
| POST/DELETE | `/api/follow`             | Follow/unfollow             |
| GET         | `/api/badges`             | List all badges             |
| GET         | `/api/badges/[address]`   | User's badges               |
| GET/POST    | `/api/activity`           | Activity feed               |

## 🧪 Testing

### Unit Tests

```bash
pnpm test
```

### E2E Tests

```bash
pnpm test:e2e
```

### Contract Tests

```bash
npx hardhat test
```

### Coverage

```bash
pnpm coverage
npx hardhat coverage
```

## 🚢 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables
3. Deploy!

```bash
vercel
```

### Docker

```bash
docker build -t protovm-profiles .
docker run -p 3000:3000 protovm-profiles
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [RainbowKit](https://www.rainbowkit.com/) - Beautiful wallet connection
- [Wagmi](https://wagmi.sh/) - React Hooks for Ethereum
- [Supabase](https://supabase.com/) - Backend as a service
- [OpenZeppelin](https://openzeppelin.com/) - Smart contract libraries
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

Built by Theweb3joker (Cryptonque)
