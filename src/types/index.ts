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
