# 💰 Profile Monetization Feature

## Overview

Profile Monetization transforms ProtoStack Profiles into revenue-generating assets, enabling creators to earn from their identity through subscriptions, tips, and premium content.

## Key Features

### 1. Paid Follows (Subscription NFTs)

- Monthly subscription model via ERC-721 NFTs
- Automatic expiration tracking
- Renewable subscriptions
- Creator-configurable pricing and benefits
- On-chain payment splitter support

### 2. Tipping System

- Direct ETH/USDC tips to creators
- Optional message with tips
- Platform fee configuration (default 2.5%)
- Revenue split support for teams
- Top supporters leaderboard

### 3. Premium Profile Themes

- NFT/Badge-gated themes
- Custom CSS styling
- Purchasable themes
- Usage tracking
- Theme marketplace

### 4. Creator Fee Configuration

- Split payments to multiple recipients
- Percentage-based distribution
- Team revenue sharing
- Automatic payment splits

---

## Smart Contracts

### ProtoStackSubscriptionNFT.sol

**Purpose:** Manage subscription NFTs for paid follows

**Key Methods:**

```solidity
// Set subscription price and accept subscribers
function setCreatorConfig(uint256 pricePerMonth, bool isAccepting)

// Subscribe to a creator (mint NFT)
function subscribe(address creator, uint256 durationMonths) payable

// Renew existing subscription
function renewSubscription(uint256 tokenId, uint256 additionalMonths) payable

// Check if subscription is active
function isSubscriptionActive(uint256 tokenId) returns (bool)

// Check if subscriber has active subscription to creator
function hasActiveSubscription(address subscriber, address creator) returns (bool)
```

**Contract Address:** Set in `NEXT_PUBLIC_SUBSCRIPTION_NFT_ADDRESS`

### ProtoStackTipping.sol

**Purpose:** Handle tips with platform fees and revenue splits

**Key Methods:**

```solidity
// Send a tip to creator
function sendTip(address to, string message) payable

// Configure revenue split for creator
function configureFeeSplit(address[] recipients, uint256[] percentages)

// Get tips received by creator
function getTipsReceived(address creator, uint256 limit) returns (TipRecord[])

// Get creator's fee split configuration
function getFeeSplitConfig(address creator) returns (address[], uint256[], bool)
```

**Contract Address:** Set in `NEXT_PUBLIC_TIPPING_CONTRACT_ADDRESS`

---

## Database Schema

### Tables

**subscriptions** - Track subscription NFT metadata

- token_id, creator_address, subscriber_address
- price_per_month, expires_at, is_active
- transaction_hash, created_at, updated_at

**subscription_configs** - Creator subscription settings

- creator_address, subscription_price
- is_accepting_subscribers, total_subscribers
- total_earned, benefits[], created_at

**tips** - All tipping transactions

- from_address, to_address, amount
- token_type, message, transaction_hash
- platform_fee, created_at

**tip_fee_splits** - Creator payment splits

- creator_address, recipients (JSONB)
- is_active, created_at, updated_at

**premium_themes** - NFT-gated profile themes

- name, description, preview_image_url
- css_code, gating_nft_address, gating_badge_id
- price, is_active, usage_count

**user_themes** - Unlocked themes per user

- user_address, theme_id, unlocked_at
- is_active, transaction_hash

**monetization_stats** - Aggregate creator earnings

- creator_address, total_tips_received
- total_subscription_revenue, total_subscribers
- total_theme_sales, updated_at

---

## API Endpoints

### GET Endpoints

#### Get Subscription Config

```bash
GET /api/monetization?action=getSubscriptionConfig&creatorAddress=<address>
```

#### Get User's Subscriptions

```bash
GET /api/monetization?action=getUserSubscriptions&userAddress=<address>
```

#### Get Creator's Subscribers

```bash
GET /api/monetization?action=getCreatorSubscribers&creatorAddress=<address>&limit=50
```

#### Check Active Subscription

```bash
GET /api/monetization?action=hasActiveSubscription&subscriberAddress=<address>&creatorAddress=<address>
```

#### Get Tips Received

```bash
GET /api/monetization?action=getTipsReceived&creatorAddress=<address>&limit=50
```

#### Get Tips Sent

```bash
GET /api/monetization?action=getTipsSent&userAddress=<address>&limit=50
```

#### Get Fee Split Config

```bash
GET /api/monetization?action=getFeeSplitConfig&creatorAddress=<address>
```

#### Get Top Supporters

```bash
GET /api/monetization?action=getTopSupporters&creatorAddress=<address>&limit=10
```

#### Get Premium Themes

```bash
GET /api/monetization?action=getPremiumThemes&limit=50
```

#### Get User's Themes

```bash
GET /api/monetization?action=getUserThemes&userAddress=<address>
```

#### Get Active Theme

```bash
GET /api/monetization?action=getActiveTheme&userAddress=<address>
```

#### Check Theme Access

```bash
GET /api/monetization?action=canAccessTheme&userAddress=<address>&themeId=<id>
```

#### Get Monetization Stats

```bash
GET /api/monetization?action=getMonetizationStats&creatorAddress=<address>
```

#### Get Top Earners (Tips)

```bash
GET /api/monetization?action=getTopEarnersByTips&limit=10
```

#### Get Top Earners (Subscribers)

```bash
GET /api/monetization?action=getTopEarnersBySubscribers&limit=10
```

### POST Endpoints

#### Set Subscription Config

```bash
POST /api/monetization
{
  "action": "setSubscriptionConfig",
  "creatorAddress": "0x...",
  "subscriptionPrice": "10000000000000000", // 0.01 ETH in wei
  "isAcceptingSubscribers": true,
  "benefits": ["Exclusive content", "Early access"]
}
```

#### Record Subscription

```bash
POST /api/monetization
{
  "action": "recordSubscription",
  "tokenId": 1,
  "creatorAddress": "0x...",
  "subscriberAddress": "0x...",
  "pricePerMonth": "10000000000000000",
  "expiresAt": "2026-02-03T...",
  "transactionHash": "0x..."
}
```

#### Record Tip

```bash
POST /api/monetization
{
  "action": "recordTip",
  "fromAddress": "0x...",
  "toAddress": "0x...",
  "amount": "10000000000000000",
  "tokenType": "ETH",
  "message": "Great content!",
  "transactionHash": "0x...",
  "platformFee": "250000000000000"
}
```

#### Set Fee Split

```bash
POST /api/monetization
{
  "action": "setFeeSplitConfig",
  "creatorAddress": "0x...",
  "recipients": [
    { "address": "0x...", "percentage": 7000 },
    { "address": "0x...", "percentage": 3000 }
  ]
}
```

#### Create Premium Theme

```bash
POST /api/monetization
{
  "action": "createPremiumTheme",
  "name": "Cyber Theme",
  "description": "Futuristic neon design",
  "cssCode": "body { ... }",
  "gatingNftAddress": "0x...",
  "price": "50000000000000000",
  "createdBy": "0x..."
}
```

#### Unlock Theme

```bash
POST /api/monetization
{
  "action": "unlockTheme",
  "userAddress": "0x...",
  "themeId": "uuid",
  "transactionHash": "0x..."
}
```

#### Set Active Theme

```bash
POST /api/monetization
{
  "action": "setActiveTheme",
  "userAddress": "0x...",
  "themeId": "uuid"
}
```

---

## React Hooks

### useSubscriptions(userAddress)

Manage creator subscriptions.

```typescript
const {
  subscriptions, // User's active subscriptions
  config, // Creator's subscription config
  isLoading, // Loading state
  error, // Error message
  fetchSubscriptions, // Refresh subscriptions
  fetchConfig, // Get creator config
  setSubscriptionConfig, // Set creator settings
  recordSubscription, // Record new subscription
  hasActiveSubscription, // Check if subscribed
} = useSubscriptions(userAddress);
```

### useTipping(userAddress)

Manage tipping functionality.

```typescript
const {
  tipsReceived, // Tips received by creator
  tipsSent, // Tips sent by user
  feeSplitConfig, // Revenue split config
  isLoading, // Loading state
  error, // Error message
  fetchTipsReceived, // Refresh tips received
  fetchTipsSent, // Refresh tips sent
  recordTip, // Record new tip
  setFeeSplit, // Configure revenue split
  fetchFeeSplit, // Get split config
  fetchTopSupporters, // Get top supporters
} = useTipping(userAddress);
```

### usePremiumThemes(userAddress)

Manage premium themes.

```typescript
const {
  themes, // All available themes
  userThemes, // User's unlocked themes
  activeTheme, // Currently active theme
  isLoading, // Loading state
  error, // Error message
  fetchThemes, // Refresh themes
  fetchUserThemes, // Get user's themes
  fetchActiveTheme, // Get active theme
  unlockTheme, // Unlock a theme
  activateTheme, // Set active theme
  canAccessTheme, // Check theme access
} = usePremiumThemes(userAddress);
```

### useMonetizationStats(creatorAddress)

Get creator earnings stats.

```typescript
const {
  stats, // Monetization statistics
  isLoading, // Loading state
  error, // Error message
  fetchStats, // Refresh stats
} = useMonetizationStats(creatorAddress);
```

---

## UI Components

### SubscribeButton

Subscribe to a creator.

```typescript
<SubscribeButton
  creatorAddress="0x..."
  userAddress="0x..."
  onSubscribe={handleSubscribe}
/>
```

### TipButton

Send a tip with modal.

```typescript
<TipButton
  creatorAddress="0x..."
  userAddress="0x..."
/>
```

### MonetizationDashboard

Creator's earnings dashboard.

```typescript
<MonetizationDashboard
  creatorAddress="0x..."
/>
```

### ThemeSelector

Browse and activate themes.

```typescript
<ThemeSelector
  userAddress="0x..."
/>
```

### SubscriptionConfigForm

Configure subscription settings.

```typescript
<SubscriptionConfigForm
  creatorAddress="0x..."
/>
```

---

## TypeScript Types

```typescript
interface Subscription {
  id: string;
  tokenId: number;
  creatorAddress: string;
  subscriberAddress: string;
  pricePerMonth: string; // in wei
  expiresAt: string;
  isActive: boolean;
  transactionHash?: string;
}

interface Tip {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: string; // in wei
  tokenType: string;
  message?: string;
  transactionHash: string;
  platformFee: string;
}

interface PremiumTheme {
  id: string;
  name: string;
  description?: string;
  cssCode: string;
  gatingNftAddress?: string;
  gatingBadgeId?: string;
  price?: string;
  isActive: boolean;
  usageCount: number;
}

interface MonetizationStats {
  creatorAddress: string;
  totalTipsReceived: string;
  totalTipsCount: number;
  totalSubscriptionRevenue: string;
  totalSubscribers: number;
  totalThemeSales: string;
}
```

---

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_SUBSCRIPTION_NFT_ADDRESS=0x...
NEXT_PUBLIC_TIPPING_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Setup

1. **Deploy Smart Contracts**

   ```bash
   npx hardhat run scripts/deploy-monetization.js --network base
   ```

2. **Deploy Database Schema**

   ```bash
   # Paste contents of supabase/migrations/004_monetization_schema.sql
   # into Supabase SQL Editor
   ```

3. **Set Environment Variables**

   ```bash
   # Add contract addresses to .env.local
   ```

4. **Use in Components**
   ```typescript
   import { useSubscriptions, useTipping } from '@/hooks';
   import { SubscribeButton, TipButton } from '@/components/monetization';
   ```

---

## Security

- Platform fee capped at 10%
- RLS policies restrict data access
- Smart contract ownership controls
- Automatic payment splits verified on-chain
- Subscription expiration checks

---

## Revenue Model

**Platform Fee:** 2.5% on all tips (configurable)

**Creator Earnings:**

- Subscriptions: 97.5% of subscription price
- Tips: 97.5% of tip amount (after platform fee)
- Theme Sales: 100% minus platform fee

---

See [MONETIZATION_EXAMPLES.tsx](./MONETIZATION_EXAMPLES.tsx) for 8+ working examples.
