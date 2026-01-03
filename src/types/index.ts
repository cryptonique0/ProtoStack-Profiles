import type { Address } from 'viem';

export interface Web3Profile {
  address: Address;
  ensName?: string | null;
  ensAvatar?: string | null;
  balance?: string;
  chainId?: number;
}

export interface NFT {
  tokenId: string;
  contractAddress: Address;
  name: string;
  description?: string;
  image: string;
  collection: {
    name: string;
    slug: string;
    imageUrl?: string;
  };
  attributes?: NFTAttribute[];
  chainId: number;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface ProfileFormData {
  username?: string;
  displayName?: string;
  bio?: string;
  website?: string;
  twitter?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  email?: string;
  location?: string;
  avatarUrl?: string;
  coverUrl?: string;
  theme?: string;
  isPublic?: boolean;
  showNfts?: boolean;
  showActivity?: boolean;
  showBadges?: boolean;
}

export interface ProfileStats {
  followers: number;
  following: number;
  badges: number;
  points: number;
  nfts: number;
  activities: number;
}

export interface SearchResult {
  id: string;
  address: string;
  ensName?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  isVerified: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName?: string;
  avatarUrl?: string;
  isVerified: boolean;
  totalPoints: number;
  badgeCount: number;
  followerCount: number;
}

export interface SIWEMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
}

export type ChainId = 1 | 137 | 42161 | 10 | 8453 | 11155111;

export const CHAIN_NAMES: Record<ChainId, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base',
  11155111: 'Sepolia',
};

export const CHAIN_ICONS: Record<ChainId, string> = {
  1: '/chains/ethereum.svg',
  137: '/chains/polygon.svg',
  42161: '/chains/arbitrum.svg',
  10: '/chains/optimism.svg',
  8453: '/chains/base.svg',
  11155111: '/chains/sepolia.svg',
};

// ============================================
// MESSAGING TYPES
// ============================================

export interface Message {
  id: string;
  conversationId: string;
  senderAddress: string;
  content: string;
  contentType: 'text' | 'image' | 'file' | 'announcement';
  messageType: 'direct' | 'group' | 'announcement';
  isEncrypted: boolean;
  encryptionType: 'none' | 'xmtp' | 'push';
  xmtpMessageId?: string;
  pushMessageId?: string;
  onChainTxHash?: string;
  isRead: boolean;
  readAt?: string;
  reactions?: MessageReaction[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userAddress: string;
  reactionEmoji: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant1: string;
  participant2: string;
  lastMessageAt?: string;
  isActive: boolean;
  permissions?: MessagePermission;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MessagePermission {
  id: string;
  conversationId: string;
  badgeId?: string;
  minFollowerCount: number;
  minBadgePoints: number;
  requiresVerification: boolean;
  requiresPremium: boolean;
  permissionType: 'none' | 'badge_gated' | 'follower_gated' | 'premium_only' | 'custom';
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface BlockedUser {
  id: string;
  blockerAddress: string;
  blockedAddress: string;
  reason?: string;
  createdAt: string;
}

export interface MessageBroadcast {
  id: string;
  senderAddress: string;
  title: string;
  content: string;
  targetBadgeId?: string;
  targetFollowerCountMin: number;
  recipientCount: number;
  isPinned: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  expiresAt?: string;
}

export interface BroadcastRecipient {
  id: string;
  broadcastId: string;
  recipientAddress: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface XMTPConnection {
  id: string;
  userAddress: string;
  xmtpInstallationId: string;
  xmtpAccountId?: string;
  isActive: boolean;
  lastSyncedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PushConnection {
  id: string;
  userAddress: string;
  pushUserId: string;
  pushChannel?: string;
  isActive: boolean;
  notificationSettings?: {
    onMessage: boolean;
    onBroadcast: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CIRCLES / COMMUNITIES TYPES
// ============================================

export interface Circle {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  creatorAddress: string;
  category: 'dao' | 'community' | 'project' | 'social' | 'professional' | 'gaming' | 'general';
  isPublic: boolean;
  isVerified: boolean;
  memberCount: number;
  totalPoints: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CircleMember {
  id: string;
  circleId: string;
  memberAddress: string;
  role: 'admin' | 'moderator' | 'member' | 'viewer';
  joinedAt: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface CircleGatingRule {
  id: string;
  circleId: string;
  ruleType:
    | 'badge'
    | 'nft'
    | 'follower_count'
    | 'badge_points'
    | 'token_balance'
    | 'verification'
    | 'invite_only';
  badgeId?: string;
  nftContract?: string;
  minFollowerCount?: number;
  minBadgePoints?: number;
  tokenAddress?: string;
  minTokenBalance?: string;
  requiresVerification?: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CirclePost {
  id: string;
  circleId: string;
  authorAddress: string;
  title?: string;
  content: string;
  mediaUrls?: string[];
  isPinned: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CircleComment {
  id: string;
  postId: string;
  authorAddress: string;
  content: string;
  parentCommentId?: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CircleLeaderboardEntry {
  id: string;
  circleId: string;
  memberAddress: string;
  points: number;
  postsCount: number;
  commentsCount: number;
  likesReceived: number;
  rank?: number;
  metadata?: Record<string, unknown>;
  lastUpdated: string;
}

export interface CircleActivity {
  id: string;
  circleId: string;
  userAddress: string;
  type:
    | 'joined'
    | 'posted'
    | 'commented'
    | 'reacted'
    | 'created_proposal'
    | 'voted'
    | 'shared'
    | 'left';
  title: string;
  description?: string;
  contentId?: string;
  contentType?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CircleInvite {
  id: string;
  circleId: string;
  invitedBy: string;
  inviteCode: string;
  invitedAddress?: string;
  usedBy?: string;
  isUsed: boolean;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CircleRolePermissions {
  id: string;
  circleId: string;
  role: string;
  canPost: boolean;
  canComment: boolean;
  canInvite: boolean;
  canModerate: boolean;
  canManageTreasury: boolean;
  canCreateProposal: boolean;
  canVote: boolean;
  canManageRoles: boolean;
  metadata?: Record<string, unknown>;
}

// =============================================
// MONETIZATION TYPES
// =============================================

export interface Subscription {
  id: string;
  tokenId: number;
  creatorAddress: string;
  subscriberAddress: string;
  pricePerMonth: string; // in wei
  expiresAt: string;
  isActive: boolean;
  transactionHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionConfig {
  id: string;
  creatorAddress: string;
  subscriptionPrice: string; // monthly price in wei
  isAcceptingSubscribers: boolean;
  totalSubscribers: number;
  totalEarned: string;
  benefits?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Tip {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: string; // in wei
  tokenType: string; // ETH, USDC, etc.
  message?: string;
  transactionHash: string;
  platformFee: string;
  createdAt: string;
}

export interface TipFeeSplit {
  id: string;
  creatorAddress: string;
  recipients: Array<{ address: string; percentage: number }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PremiumTheme {
  id: string;
  name: string;
  description?: string;
  previewImageUrl?: string;
  cssCode: string;
  gatingNftAddress?: string;
  gatingBadgeId?: string;
  price?: string;
  isActive: boolean;
  createdBy: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserTheme {
  id: string;
  userAddress: string;
  themeId: string;
  unlockedAt: string;
  isActive: boolean;
  transactionHash?: string;
  premiumThemes?: PremiumTheme;
}

export interface MonetizationStats {
  id: string;
  creatorAddress: string;
  totalTipsReceived: string;
  totalTipsCount: number;
  totalSubscriptionRevenue: string;
  totalSubscribers: number;
  totalThemeSales: string;
  totalThemeSalesCount: number;
  lastTipAt?: string;
  lastSubscriptionAt?: string;
  updatedAt: string;
}

export interface TopSupporter {
  supporterAddress: string;
  totalTipped: string;
  tipCount: number;
  lastTipAt: string;
}

// =============================================
// PAYMASTER / GASLESS TYPES
// =============================================

export interface GaslessTransaction {
  id: string;
  userAddress: string;
  userOperationHash: string;
  transactionHash?: string;
  operationType: 'profile_edit' | 'badge_mint' | 'profile_creation' | string;
  gasCost?: string;
  paymasterAddress?: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  confirmedAt?: string;
}

export interface UserOperation {
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

export interface GaslessStats {
  totalTransactions: number;
  totalGasSponsored: string;
  byOperationType: Record<string, number>;
}

export interface UserOperationReceipt {
  transactionHash: string;
  blockNumber: number;
  success: boolean;
}
