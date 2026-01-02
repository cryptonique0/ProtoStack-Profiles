'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, type ReactNode } from 'react';

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (posthogKey && typeof window !== 'undefined') {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        capture_pageview: false,
        capture_pageleave: true,
        persistence: 'localStorage',
        autocapture: {
          dom_event_allowlist: ['click', 'submit'],
          url_allowlist: ['.*'],
          element_allowlist: ['button', 'a', 'form'],
        },
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            posthog.debug();
          }
        },
      });
    }
  }, []);

  if (!posthogKey) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

// Analytics helper functions
export const analytics = {
  identify: (userId: string, traits?: Record<string, any>) => {
    if (posthogKey) {
      posthog.identify(userId, traits);
    }
  },

  track: (event: string, properties?: Record<string, any>) => {
    if (posthogKey) {
      posthog.capture(event, properties);
    }
  },

  page: (pageName?: string, properties?: Record<string, any>) => {
    if (posthogKey) {
      posthog.capture('$pageview', { ...properties, $current_url: pageName });
    }
  },

  reset: () => {
    if (posthogKey) {
      posthog.reset();
    }
  },

  // Web3 specific events
  walletConnected: (address: string, chain: string) => {
    analytics.track('wallet_connected', { address, chain });
  },

  walletDisconnected: (address: string) => {
    analytics.track('wallet_disconnected', { address });
  },

  profileCreated: (address: string, ensName?: string) => {
    analytics.track('profile_created', { address, ensName });
  },

  profileUpdated: (address: string, fields: string[]) => {
    analytics.track('profile_updated', { address, fields });
  },

  nftAvatarSet: (address: string, tokenId: string, collection: string) => {
    analytics.track('nft_avatar_set', { address, tokenId, collection });
  },

  profileViewed: (viewerAddress: string | null, profileAddress: string) => {
    analytics.track('profile_viewed', { viewerAddress, profileAddress });
  },

  searchPerformed: (query: string, resultsCount: number) => {
    analytics.track('search_performed', { query, resultsCount });
  },
};
