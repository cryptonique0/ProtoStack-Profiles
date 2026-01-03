# 🧾 Paymaster / Gasless Transactions

## Overview

The Paymaster feature enables gasless transactions using ERC-4337 Account Abstraction on Base. New users can edit profiles or mint badges without paying gas, improving onboarding and activation.

## Key Capabilities

- Gasless profile edits and badge mints
- ERC-4337-compatible UserOperation submission
- Paymaster sponsorship with policy controls
- Bundler integration for transaction relay
- Qualification rules to cap costs
- Full transaction tracking and analytics

---

## Flow

1. Frontend builds a UserOperation for the intended action
2. Paymaster signs and sponsors the operation if qualified
3. Bundler submits the UserOperation to the EntryPoint
4. Paymaster records the transaction and status in Supabase
5. UI shows gasless indicator and status

---

## Qualification Rules (Default)

- First profile creation: always gasless
- First 3 profile edits per user: gasless
- First 5 badge mints per user: gasless
- Otherwise: pay-your-own-gas

---

## API Endpoints

### GET

#### Check Qualification

```bash
GET /api/paymaster?action=qualifiesForGasless&userAddress=<address>&operationType=profile_edit
```

#### Get Gasless Transactions

```bash
GET /api/paymaster?action=getGaslessTransactions&userAddress=<address>&limit=50
```

#### Get Total Gas Sponsored

```bash
GET /api/paymaster?action=getTotalGasSponsored
```

#### Get Gasless Stats

```bash
GET /api/paymaster?action=getGaslessStats
```

### POST

#### Get Paymaster Data (sponsorship)

```bash
POST /api/paymaster
{
  "action": "getPaymasterData",
  "userOperation": { ... } // ERC-4337 userOp
}
```

#### Submit UserOperation

```bash
POST /api/paymaster
{
  "action": "submitUserOperation",
  "userOperation": { ... }
}
```

#### Wait for Confirmation

```bash
POST /api/paymaster
{
  "action": "waitForUserOperation",
  "userOpHash": "0x...",
  "timeoutMs": 20000
}
```

#### Record Gasless Transaction

```bash
POST /api/paymaster
{
  "action": "recordGaslessTransaction",
  "userAddress": "0x...",
  "userOperationHash": "0x...",
  "operationType": "profile_edit",
  "gasCost": "123456",
  "status": "pending"
}
```

#### Update Gasless Transaction

```bash
POST /api/paymaster
{
  "action": "updateGaslessTransaction",
  "userOperationHash": "0x...",
  "status": "confirmed",
  "transactionHash": "0x..."
}
```

#### Execute Gasless Profile Edit (helper)

```bash
POST /api/paymaster
{
  "action": "executeGaslessProfileEdit",
  "userAddress": "0x...",
  "profileData": { ... }
}
```

#### Execute Gasless Badge Mint (helper)

```bash
POST /api/paymaster
{
  "action": "executeGaslessBadgeMint",
  "userAddress": "0x...",
  "badgeId": "badge-123"
}
```

#### Estimate UserOperation Gas

```bash
POST /api/paymaster
{
  "action": "estimateUserOperationGas",
  "userOperation": { ... }
}
```

---

## React Hooks

### usePaymaster(userAddress)

Manage gasless transactions for a user.

```typescript
const {
  transactions, // User's gasless tx history
  totalGasSponsored, // Total gas sponsored platform-wide
  isLoading, // Loading state
  error, // Error message
  checkQualification, // Check if user/op is eligible
  fetchTransactions, // Refresh tx history
  executeGaslessProfileEdit,
  executeGaslessBadgeMint,
  submitUserOperation,
  waitForConfirmation,
} = usePaymaster(userAddress);
```

### useGaslessStats()

Admin/analytics stats.

```typescript
const {
  stats, // { totalSponsored, totalTransactions, byType }
  isLoading,
  error,
  fetchStats,
} = useGaslessStats();
```

---

## Service Layer

### PaymasterService

Key methods (see src/services/paymaster-service.ts):

- qualifiesForGaslessTransaction(userAddress, operationType)
- getPaymasterData(userOperation)
- submitUserOperation(userOperation)
- waitForUserOperation(userOpHash, timeoutMs)
- recordGaslessTransaction(payload)
- updateGaslessTransaction(userOpHash, status, txHash?)
- executeGaslessProfileEdit(userAddress, profileData)
- executeGaslessBadgeMint(userAddress, badgeId)
- estimateUserOperationGas(userOperation)

---

## UI Component

### GaslessIndicator

Displays whether an action is gas-free for the user.

```typescript
<GaslessIndicator
  userAddress="0x..."
  operationType="profile_edit" // or "badge_mint"
/>
```

---

## Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_BUNDLER_URL=https://...
NEXT_PUBLIC_PAYMASTER_URL=https://...
NEXT_PUBLIC_ENTRYPOINT_ADDRESS=0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
```

Optional:

```bash
PAYMASTER_API_KEY=...
BUNDLER_API_KEY=...
```

---

## Setup Steps

1. Configure Paymaster provider (e.g., Pimlico/Biconomy) and obtain API keys.
2. Set environment variables above in `.env.local`.
3. Ensure Supabase migration `004_monetization_schema.sql` is applied (includes `gasless_transactions`).
4. Wire frontend using `usePaymaster` hook and `GaslessIndicator` component.

---

## Qualification Logic Details

- Profile edit counter: first 3 edits sponsored.
- Badge mint counter: first 5 mints sponsored.
- Profile creation: always sponsored.
- Non-qualified actions: return sponsorship=false, frontend should fall back to normal gas flow.

---

## Error Handling Patterns

- qualifiesForGaslessTransaction returns `{ qualifies: boolean, reason?: string }`.
- waitForUserOperation polls until `confirmed` or timeout; surface status to UI.
- Record every sponsored attempt in `gasless_transactions` with status transitions: `pending` → `confirmed` | `failed`.

---

## Testing

- Use a Base testnet EntryPoint: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`.
- Simulate with a bundler (e.g., Pimlico sandbox) and dry-run UserOperations.
- Validate Supabase records after each sponsored operation.

---

See [PAYMASTER_EXAMPLES.tsx](./PAYMASTER_EXAMPLES.tsx) for working snippets.# 🧾 Paymaster / Gas Abstraction Feature

## Overview

Paymaster integration removes gas friction for new users through ERC-4337 Account Abstraction, sponsoring transactions to create seamless onboarding experiences.

## Key Features

### 1. Gasless Profile Edits

- First 3 profile edits are gas-free
- Update bio, avatar, social links without ETH
- Perfect for user onboarding

### 2. Gasless Badge Minting

- First 5 badge mints sponsored
- Enable users to showcase achievements immediately
- No wallet funding required

### 3. Gasless Profile Creation

- First profile creation always free
- Remove biggest onboarding barrier
- Get users started instantly

### 4. ERC-4337 Integration

- Industry-standard Account Abstraction
- Compatible with major paymasters (Pimlico, Biconomy, Base)
- UserOperation bundling for efficiency

---

## Architecture

### ERC-4337 Components

**EntryPoint Contract:** `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`

- Standardized entry point for all UserOperations
- Validates and executes bundled transactions
- Handles paymaster verification

**Bundler Service:**

- Accepts UserOperations from clients
- Bundles multiple operations for efficiency
- Submits to EntryPoint contract
- Returns UserOperation hashes

**Paymaster Service:**

- Sponsors gas for qualified users
- Signs paymaster data for verification
- Configures gas limits and pricing
- Tracks sponsored transaction costs

---

## Qualification Rules

Users qualify for gasless transactions based on operation type:

### Profile Edits

- **Limit:** First 3 edits per address
- **Operations:** Update bio, avatar, socials, metadata
- **Reset:** Never (lifetime limit)

### Badge Mints

- **Limit:** First 5 mints per address
- **Operations:** Mint achievement badges
- **Reset:** Never (lifetime limit)

### Profile Creation

- **Limit:** First 1 creation per address
- **Operations:** Initialize profile NFT
- **Reset:** Never (one-time only)

---

## Smart Contract Integration

### UserOperation Structure

```typescript
interface UserOperation {
  sender: string; // User's wallet address
  nonce: string; // Anti-replay nonce
  initCode: string; // Contract creation code
  callData: string; // Transaction call data
  callGasLimit: string; // Gas for main call
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string; // Paymaster signature
  signature: string; // User signature
}
```

### Transaction Flow

1. **Client builds UserOperation**
   - Encode transaction as callData
   - Set gas limits and fees
   - Calculate nonce

2. **Request paymaster data**
   - Send UserOperation to paymaster service
   - Receive signed paymasterAndData
   - Include paymaster address + signature

3. **Submit to bundler**
   - Send complete UserOperation
   - Bundler validates and simulates
   - Returns userOpHash

4. **Wait for confirmation**
   - Poll bundler for receipt
   - Get transaction hash when mined
   - Update database record

---

## Database Schema

### gasless_transactions

Tracks all sponsored transactions.

```sql
CREATE TABLE gasless_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  user_operation_hash TEXT NOT NULL UNIQUE,
  transaction_hash TEXT,
  operation_type TEXT NOT NULL, -- 'profile_edit', 'badge_mint', 'profile_creation'
  gas_cost TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);
```

### Indexes

- user_address (for qualification checks)
- operation_type (for counting by type)
- status (for filtering pending operations)

---

## API Endpoints

### GET Endpoints

#### Check Qualification

```bash
GET /api/paymaster?action=qualifiesForGasless&userAddress=<address>&operationType=profile_edit
```

**Response:**

```json
{
  "qualifies": true,
  "remainingTransactions": 2,
  "reason": "User has used 1 of 3 gasless profile edits"
}
```

#### Get Gasless Transactions

```bash
GET /api/paymaster?action=getGaslessTransactions&userAddress=<address>&limit=50
```

#### Get Total Gas Sponsored

```bash
GET /api/paymaster?action=getTotalGasSponsored&userAddress=<address>
```

#### Get Gasless Stats (Admin)

```bash
GET /api/paymaster?action=getGaslessStats
```

### POST Endpoints

#### Get Paymaster Data

```bash
POST /api/paymaster
{
  "action": "getPaymasterData",
  "userOperation": {
    "sender": "0x...",
    "nonce": "0x0",
    "callData": "0x...",
    // ... other UserOperation fields
  }
}
```

**Response:**

```json
{
  "paymasterAndData": "0x<paymaster_address><signature>"
}
```

#### Submit UserOperation

```bash
POST /api/paymaster
{
  "action": "submitUserOperation",
  "userOperation": { /* complete UserOperation */ }
}
```

**Response:**

```json
{
  "userOpHash": "0x..."
}
```

#### Wait for Confirmation

```bash
POST /api/paymaster
{
  "action": "waitForUserOperation",
  "userOpHash": "0x...",
  "timeout": 60000
}
```

**Response:**

```json
{
  "receipt": {
    "userOpHash": "0x...",
    "transactionHash": "0x...",
    "blockNumber": 12345,
    "success": true
  }
}
```

#### Execute Gasless Profile Edit

```bash
POST /api/paymaster
{
  "action": "executeGaslessProfileEdit",
  "userAddress": "0x...",
  "profileData": {
    "bio": "New bio",
    "avatarUrl": "ipfs://..."
  }
}
```

#### Execute Gasless Badge Mint

```bash
POST /api/paymaster
{
  "action": "executeGaslessBadgeMint",
  "userAddress": "0x...",
  "badgeId": 5
}
```

---

## React Hooks

### usePaymaster(userAddress)

Main hook for gasless transactions.

```typescript
const {
  transactions, // User's gasless transactions
  totalGasSponsored, // Total gas saved
  isLoading, // Loading state
  error, // Error message
  checkQualification, // Check if user qualifies
  fetchTransactions, // Refresh transaction history
  executeGaslessProfileEdit, // Edit profile gasless
  executeGaslessBadgeMint, // Mint badge gasless
  submitUserOperation, // Submit custom UserOp
  waitForConfirmation, // Wait for UserOp receipt
  getPaymasterData, // Get paymaster signature
  estimateGas, // Estimate UserOp gas
} = usePaymaster(userAddress);
```

### useGaslessStats()

Admin hook for platform statistics.

```typescript
const {
  stats, // Platform-wide stats
  isLoading, // Loading state
  error, // Error message
  fetchStats, // Refresh stats
} = useGaslessStats();
```

---

## UI Components

### GaslessIndicator

Show when transaction will be gas-free.

```typescript
<GaslessIndicator
  userAddress="0x..."
  operationType="profile_edit"
/>
```

**Displays:**

- ⚡ Gas-free transaction badge
- Remaining gasless transactions
- Automatic qualification check

---

## TypeScript Types

```typescript
interface GaslessTransaction {
  id: string;
  userAddress: string;
  userOperationHash: string;
  transactionHash?: string;
  operationType: 'profile_edit' | 'badge_mint' | 'profile_creation';
  gasCost?: string; // in wei
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  confirmedAt?: string;
}

interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

interface GaslessStats {
  totalTransactions: number;
  totalGasSponsored: string; // in wei
  transactionsByType: {
    profile_edit: number;
    badge_mint: number;
    profile_creation: number;
  };
  averageGasCost: string;
}

interface UserOperationReceipt {
  userOpHash: string;
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  success: boolean;
  actualGasCost: string;
  logs: any[];
}
```

---

## Environment Variables

Required in `.env.local`:

```bash
# Paymaster Configuration
NEXT_PUBLIC_BUNDLER_URL=https://api.pimlico.io/v2/base/rpc?apikey=YOUR_KEY
NEXT_PUBLIC_PAYMASTER_URL=https://api.pimlico.io/v2/base/rpc?apikey=YOUR_KEY
NEXT_PUBLIC_PAYMASTER_ADDRESS=0x...
NEXT_PUBLIC_ENTRYPOINT_ADDRESS=0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789

# Optional: Gas Sponsorship Limits
PAYMASTER_PROFILE_EDIT_LIMIT=3
PAYMASTER_BADGE_MINT_LIMIT=5
```

---

## Setup

### 1. Choose Paymaster Provider

#### Pimlico (Recommended for Base)

```bash
# Sign up at https://www.pimlico.io/
# Get API key and bundler URL
NEXT_PUBLIC_BUNDLER_URL=https://api.pimlico.io/v2/base/rpc?apikey=YOUR_KEY
NEXT_PUBLIC_PAYMASTER_URL=https://api.pimlico.io/v2/base/rpc?apikey=YOUR_KEY
```

#### Biconomy

```bash
# Sign up at https://www.biconomy.io/
# Get bundler and paymaster URLs
NEXT_PUBLIC_BUNDLER_URL=https://bundler.biconomy.io/api/v2/8453/...
NEXT_PUBLIC_PAYMASTER_URL=https://paymaster.biconomy.io/api/v1/8453/...
```

#### Base Native

```bash
# Use Base's native paymaster (if available)
NEXT_PUBLIC_BUNDLER_URL=https://base-bundler.base.org
NEXT_PUBLIC_PAYMASTER_URL=https://base-paymaster.base.org
```

### 2. Deploy Database Schema

```bash
# Execute supabase/migrations/004_monetization_schema.sql
# (includes gasless_transactions table)
```

### 3. Fund Paymaster (if self-hosted)

```bash
# Deposit ETH to paymaster contract
# Check balance regularly
```

### 4. Use in Components

```typescript
import { usePaymaster } from '@/hooks';
import { GaslessIndicator } from '@/components/monetization';

function ProfileEditPage() {
  const { executeGaslessProfileEdit } = usePaymaster(address);

  const handleSave = async () => {
    await executeGaslessProfileEdit({
      bio: 'New bio',
      avatarUrl: 'ipfs://...'
    });
  };

  return (
    <>
      <GaslessIndicator userAddress={address} operationType="profile_edit" />
      <button onClick={handleSave}>Save Profile</button>
    </>
  );
}
```

---

## Testing

### Local Development

Use mock paymaster for testing:

```typescript
// In .env.local
NEXT_PUBLIC_MOCK_PAYMASTER = true;
```

### Testnet (Base Sepolia)

```bash
# Get testnet ETH from faucet
# Use testnet bundler/paymaster URLs
NEXT_PUBLIC_BUNDLER_URL=https://api.pimlico.io/v2/base-sepolia/rpc?apikey=YOUR_KEY
```

### Production Monitoring

```typescript
// Check paymaster balance regularly
const balance = await ethers.provider.getBalance(paymasterAddress);
if (balance.lt(ethers.utils.parseEther('0.1'))) {
  console.warn('Paymaster balance low!');
}

// Monitor transaction success rate
const { stats } = useGaslessStats();
console.log('Success rate:', stats.successRate);
```

---

## Cost Estimation

### Base Gas Prices (Optimistic)

- **Profile Edit:** ~50,000 gas = $0.01 @ 20 gwei
- **Badge Mint:** ~80,000 gas = $0.016 @ 20 gwei
- **Profile Creation:** ~150,000 gas = $0.03 @ 20 gwei

### Monthly Budget (1000 Users)

- 1000 profile creations × $0.03 = **$30**
- 3000 profile edits × $0.01 = **$30**
- 5000 badge mints × $0.016 = **$80**
- **Total: ~$140/month** for 1000 onboarded users

---

## Security

### Paymaster Protection

- Rate limiting per user address
- Maximum gas cost per transaction
- Operation type validation
- Nonce tracking to prevent replay

### Qualification Checks

- Database-backed usage tracking
- Immutable operation limits
- RLS policies on gasless_transactions table

### Bundler Security

- User signature verification
- Gas estimation before submission
- Simulation before execution
- Timeout handling for failed operations

---

## Troubleshooting

### "User does not qualify for gasless transaction"

Check remaining operations:

```typescript
const { checkQualification } = usePaymaster(address);
const result = await checkQualification('profile_edit');
console.log(result.remainingTransactions);
```

### "Paymaster signature invalid"

Verify environment variables:

```bash
# Check .env.local has correct paymaster address
echo $NEXT_PUBLIC_PAYMASTER_ADDRESS
```

### "UserOperation reverted"

Check gas limits:

```typescript
// Increase gas limits in UserOperation
callGasLimit: ethers.utils.hexlify(100000),
verificationGasLimit: ethers.utils.hexlify(50000),
```

### "Bundler timeout"

Increase timeout:

```typescript
await waitForConfirmation(userOpHash, 120000); // 2 minutes
```

---

## Paymaster Providers Comparison

| Provider        | Base Support | Pricing   | Dashboard | API Quality |
| --------------- | ------------ | --------- | --------- | ----------- |
| **Pimlico**     | ✅ Yes       | Pay-as-go | Excellent | ⭐⭐⭐⭐⭐  |
| **Biconomy**    | ✅ Yes       | Free tier | Good      | ⭐⭐⭐⭐    |
| **Base Native** | ✅ Yes       | TBD       | TBD       | ⭐⭐⭐⭐    |
| **Alchemy**     | ⚠️ Coming    | Pay-as-go | Excellent | ⭐⭐⭐⭐⭐  |

**Recommendation:** Use **Pimlico** for production (best Base support + docs)

---

See [PAYMASTER_EXAMPLES.tsx](./PAYMASTER_EXAMPLES.tsx) for 5+ working examples.
