# ProtoVM SDK (Public Infra)

Make ProtoVM Profiles a platform others can build on. This SDK wraps the public read APIs so external apps can fetch identities, badges, reputation, and permissions with one dependency.

## Why this matters

- Grants: easy integration unlocks ecosystem funding
- Adoption: lowers friction for partners to consume profiles/badges
- Credibility: measurable "used by X apps" metric

## SDK surface (Phase 1, read-only)

- `getProfile(address | username)` → profile object with social links, ENS, stats
- `getBadges(address)` → earned badges with metadata and timestamps
- `hasBadge(address, badgeId)` → boolean gate for access checks
- `verifyReputation(address, opts)` → reputation score + reasons
- `checkPermissions(opts)` → allow/deny for an action in a circle/feature
- `getSybilRisk(address)` → `{ sybilRisk: 'low'|'medium'|'high', confidence: number }`
- `getBaseHighlights(address)` → Base-only badges, dapps used, leaderboard rank
- `getBuilderProfile(address)` → contracts, repos, hackathon wins, attestations
- `getProfileManagers(address)` → profile governance: owners + delegates
- `getRecovery(address)` → guardians + timelock state

## Quickstart

```bash
pnpm add @protovm/sdk
```

```typescript
import { createProtoVM } from '@protovm/sdk';

const protovm = createProtoVM({
  baseUrl: process.env.PROTOVM_API_URL ?? 'https://api.protovm.dev',
  apiKey: process.env.PROTOVM_API_KEY, // optional for elevated quota
});

const profile = await protovm.getProfile('0xabc...');
const badges = await protovm.getBadges('0xabc...');
const hasBadge = await protovm.hasBadge('0xabc...', 'DAO_MEMBER');
const reputation = await protovm.verifyReputation('0xabc...', { minScore: 60 });
const permission = await protovm.checkPermissions({
  address: '0xabc...',
  action: 'post',
  circleId: 'circle_123',
});
```

## HTTP contract (backed by existing services)

Base URL: `https://api.protovm.dev` (or your deployment)

- `GET /sdk/profile?address=0x... | username=john` → `{ profile, stats }`
- `GET /sdk/badges?address=0x...` → `{ badges: Badge[] }`
- `GET /sdk/badges/has?address=0x...&badgeId=DAO_MEMBER` → `{ hasBadge: boolean }`
- `GET /sdk/reputation?address=0x...&minScore=60` → `{ score, reasons[], meetsThreshold }`
- `GET /sdk/sybil?address=0x...` → `{ sybilRisk: 'low'|'medium'|'high', confidence: 0-1, signals: {} }`
- `GET /sdk/base/highlights?address=0x...` → `{ badges: [], dapps: [], leaderboard: { rank, score } }`
- `GET /sdk/base/leaderboard?limit=100` → `{ entries: [{ address, score, badges }], generatedAt }`
- `GET /sdk/builder/profile?address=0x...` → `{ contracts: [], repos: [], hackathons: [], attestations: [] }`
- `GET /sdk/profile/governance?address=0x...` → `{ owners: [], delegates: [], policies: { quorum, actions }, multisig?: { threshold, signers } }`
- `GET /sdk/profile/recovery?address=0x...` → `{ guardians: [], timelockHours, ensRecovery?: string, activeRequests: [] }`
- `POST /sdk/permissions/check` with body `{ address, action, circleId?, resourceId?, context? }` → `{ allowed: boolean, reasons[] }`

Notes:

- All responses include `requestId` for auditability.
- Rate limits: 60 rpm unauthenticated, 600 rpm with API key.

## Reputation model (initial)

- Identity: verified profile (+20), ENS present (+10)
- Social proof: followers (log curve up to +20), mutuals with verified (+10)
- Badges: weighted sum of badge points (scaled to +30)
- Activity: recent actions (+10)
- Trust tiers: `bronze <50`, `silver 50-69`, `gold 70-84`, `platinum 85+`

## Permission checks (read-only)

- Circle gates: badge ownership, min badge points, min followers, invite-only flag
- Profile privacy: `is_public` guard
- Feature gates: monetization/theme access can reuse `hasBadge` + `reputation.score`

## Packaging plan

- `packages/sdk/` (or publish from root) with `tsup` build → ESM + CJS
- Ship runtime-safe fetch client (no Supabase keys required)
- Provide types: `Profile`, `Badge`, `ReputationResult`, `PermissionResult`
- Add Playwright contract tests against deployed API
- Add examples in `examples/sdk-node` and `examples/sdk-next`

## Milestones

1. Wire `/sdk/*` routes that proxy existing services (profile, badge, circles gating)
2. Publish `@protovm/sdk@0.1.0` read-only
3. Add reputation scoring config + badge weight registry
4. Add write helpers (optional, guarded by API key): follow, award badge, log activity
5. Collect adoption metrics: per-domain API key usage, top integrators leaderboard

## Credibility hooks

- Public dashboard: requests/day, top SDK consumers, average reputation score queried
- Showcase section in README: list live apps using SDK
- Grants narrative: "ProtoVM powers identity + reputation across X apps/Y users"

## Embed widgets (drop-in)

Goal: let any app paste a snippet and instantly render ProtoVM identity.

### React component (tree-shakable)

```tsx
import { ProtoProfile, ReputationBadge, NftGallery } from '@protovm/sdk/react';

<ProtoProfile address="0x..." compact />
<ReputationBadge address="0x..." variant="pill" />
<NftGallery address="0x..." limit={12} chain="base" />
```

### Iframe embeds (copy-paste)

```html
<iframe
  src="https://api.protovm.dev/embed/profile?address=0x...&theme=dark"
  width="420"
  height="320"
  style="border:0;border-radius:12px;"
></iframe>

<iframe
  src="https://api.protovm.dev/embed/reputation?address=0x...&variant=pill"
  width="240"
  height="80"
  style="border:0;"
></iframe>
```

### Embed HTTP contract

- `GET /embed/profile?address=0x...&theme=light|dark&compact=true` → HTML widget
- `GET /embed/reputation?address=0x...&variant=pill|full` → reputation badge
- `GET /embed/nfts?address=0x...&chain=base&limit=12` → NFT gallery widget

Notes: server-side caches responses; signed `requestId` header for analytics; CSP-safe styles.

## AI Profile Assistant (high novelty)

Use AI on top of identity + on-chain history.

### Capabilities

- Auto-generate bio from wallet history and badges
- Suggest badges user can earn next
- Detect suspicious / Sybil signals (burner clustering, fresh wallets)

### API

- `POST /sdk/ai/bio` `{ address, style?: 'concise' | 'friendly' | 'pro' }` → `{ bio, sources[] }`
- `POST /sdk/ai/badges/suggest` `{ address, topN?: 5 }` → `{ suggestions: [{ badgeId, reason }] }`
- `POST /sdk/ai/risk` `{ address }` → `{ score: 0-100, label: 'low'|'med'|'high', signals: [] }`

### Example

"Based on your on-chain activity, you are a DeFi power user on Base."

### Implementation sketch

- Data: profile + badges + follower counts + recent activity + basic chain history
- Model: server-side LLM with guardrails; lightweight rules for risk scoring
- Output: deterministic JSON envelope with `requestId`, `sources`, `latencyMs`

## Sybil Resistance Layer (DAO-friendly)

Purpose: expose a simple risk verdict powered by on-chain signals DAOs care about.

### Signals used (first pass)

- Wallet age and first-seen chain
- Transaction entropy (counterparties, protocols touched)
- Cross-chain activity (Base + L2 mix)
- Badge combinations (cred badges vs. empty/new wallets)
- Social graph (follower depth, mutuals with verified)

### API

- `GET /sdk/sybil?address=0x...` → `{ sybilRisk: 'low'|'medium'|'high', confidence: 0.0-1.0, signals: { walletAgeDays, txEntropy, chains: [], badges: [], socialScore } }`
- `POST /sdk/ai/risk` already returns `{ score, label, signals }`; `sybilRisk` can reuse the same engine but with a binary-friendly verdict.

### Example response

```json
{
  "sybilRisk": "low",
  "confidence": 0.91,
  "signals": {
    "walletAgeDays": 420,
    "txEntropy": 0.74,
    "chains": ["base", "ethereum"],
    "badges": ["EARLY_ADOPTER", "DAO_MEMBER"],
    "socialScore": 0.68
  },
  "requestId": "req_123",
  "latencyMs": 132
}
```

### Consumers

- DAOs: gate proposals/voting or assign review queues
- Apps: down-rank spam accounts, throttle messaging
- Partners: align grants with low-risk users

## Base Identity Boost (Base-native)

Make ProtoVM feel built-for-Base.

### What we highlight

- Base-only badges: early Base adopter, Base builder, Base DeFi, Base social
- Base usage: top dapps touched (tx count, recency), bridge events, on-chain streaks
- Base leaderboard: score weighted to Base activity and Base badges
- Wallet perks: Coinbase Wallet flag for UX boosts (auto-connect, deep links)

### API

- `GET /sdk/base/highlights?address=0x...` → `{ badges: Badge[], dapps: [{ name, txCount, lastUsedAt }], leaderboard: { rank, score }, wallet: { coinbase: boolean } }`
- `GET /sdk/base/leaderboard?limit=100` → sorted by Base score (activity + Base badges)

### Scoring sketch

- Base tx volume (log curve) + recency decay
- Diversity of Base protocols (entropy) + bridge usage
- Base badge weights (Base Builder, Base Early, Onchain Summer)
- Bonus if using Coinbase Wallet or verified ENS on Base

## Builder Profiles (ProtoStack/Launchpad fit)

Special view for developers and builders.

### Data surfaced

- Deployed contracts: address, chain, verified status, last tx
- GitHub repos: linked via OAuth; stars, recent commits
- Hackathon wins: curated list with event, prize, link
- On-chain commits: EAS attestations for shipped milestones
- Tooling usage: frameworks (Foundry/Hardhat), deployments to Base

### API

- `GET /sdk/builder/profile?address=0x...` → `{ contracts: [{ address, chain, name?, verified, lastTxAt }], repos: [{ name, url, stars, lastCommitAt }], hackathons: [{ event, prize, link }], attestations: [{ uid, schema, summary, issuedAt }], tools: { hardhat: bool, foundry: bool, wagmi: bool } }`

### Widget examples

- Builder badge strip inside `ProtoProfile` when `mode="builder"`
- Inline contract list (Base deployments first)
- GitHub + EAS pills showing recency

## Profile Governance & Ownership

Co-managed identities for DAOs, teams, and multisigs.

### Concepts

- Owners: primary controllers (EOA or multisig)
- Delegates: scoped permissions (edit bio, change avatar, post activity)
- Policies: action-level rules (quorum for high-impact changes)

### API

- `GET /sdk/profile/governance?address=0x...` → `{ owners: [{ address, type: 'eoa'|'multisig' }], delegates: [{ address, scopes: string[] }], policies: { quorum?: number, actions?: Record<string, string[]> }, multisig?: { threshold: number, signers: string[] } }`

### Use cases

- DAO-managed profiles: governance multisig as owner, delegates for comms team
- Team wallets: founders as owners, marketing as delegates for content
- Multisig-controlled identity: Safe/Gnosis as owner, require threshold for profile transfer

### Widget idea

- In `ProtoProfile`, show “Managed by DAO Safe” pill and list delegates with scopes.

## Recovery & Guardians

Social recovery for profiles with safety rails.

### Features

- Guardian wallets: approve recovery requests
- Time-lock recovery: delay before takeover completes
- ENS-based recovery: nominate an ENS as recovery alias

### API

- `GET /sdk/profile/recovery?address=0x...` → `{ guardians: string[], timelockHours: number, ensRecovery?: string, activeRequests: [{ requestedBy, createdAt, eta, status }] }`
- (future write) `POST /sdk/profile/recovery/request` to initiate with guardians

### UX ideas

- “Recovery” pill in profile settings showing guardian count and timelock
- Alert banner if a recovery is pending (countdown)

## Nice-to-Have (polished extras)

- Profile version history with rollback (audit log + revert endpoint)
- On-chain verification checkmark (badge + onchain proof)
- Theme marketplace (ties to existing premium themes)
- Dark/light profile modes (per-embed + per-profile)
- Profile NFTs with dynamic metadata (e.g., reputation score, Base highlights)
