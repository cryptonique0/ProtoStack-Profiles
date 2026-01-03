import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for managing subscriptions
 */
export function useSubscriptions(userAddress: string) {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's subscriptions
  const fetchSubscriptions = useCallback(async () => {
    if (!userAddress) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/monetization?action=getUserSubscriptions&userAddress=${userAddress}`
      );
      if (!response.ok) throw new Error('Failed to fetch subscriptions');

      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  // Get subscription config
  const fetchConfig = useCallback(async (creatorAddress: string) => {
    try {
      const response = await fetch(
        `/api/monetization?action=getSubscriptionConfig&creatorAddress=${creatorAddress}`
      );
      if (!response.ok) throw new Error('Failed to fetch config');

      const data = await response.json();
      setConfig(data.config);
      return data.config;
    } catch (err) {
      console.error('Failed to fetch config:', err);
      return null;
    }
  }, []);

  // Set subscription config (for creators)
  const setSubscriptionConfig = useCallback(
    async (subscriptionPrice: string, isAcceptingSubscribers: boolean, benefits?: string[]) => {
      try {
        const response = await fetch('/api/monetization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'setSubscriptionConfig',
            creatorAddress: userAddress,
            subscriptionPrice,
            isAcceptingSubscribers,
            benefits,
          }),
        });

        if (!response.ok) throw new Error('Failed to set config');

        const data = await response.json();
        setConfig(data.config);
        setError(null);
        return data.config;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [userAddress]
  );

  // Record subscription (after on-chain transaction)
  const recordSubscription = useCallback(
    async (subscription: any) => {
      try {
        const response = await fetch('/api/monetization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'recordSubscription',
            ...subscription,
          }),
        });

        if (!response.ok) throw new Error('Failed to record subscription');

        await fetchSubscriptions();
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [fetchSubscriptions]
  );

  // Check if has active subscription
  const hasActiveSubscription = useCallback(
    async (creatorAddress: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/monetization?action=hasActiveSubscription&subscriberAddress=${userAddress}&creatorAddress=${creatorAddress}`
        );
        if (!response.ok) return false;

        const data = await response.json();
        return data.hasSubscription;
      } catch (err) {
        console.error('Failed to check subscription:', err);
        return false;
      }
    },
    [userAddress]
  );

  useEffect(() => {
    if (userAddress) {
      fetchSubscriptions();
    }
  }, [userAddress, fetchSubscriptions]);

  return {
    subscriptions,
    config,
    isLoading,
    error,
    fetchSubscriptions,
    fetchConfig,
    setSubscriptionConfig,
    recordSubscription,
    hasActiveSubscription,
  };
}

/**
 * Hook for tipping functionality
 */
export function useTipping(userAddress: string) {
  const [tipsReceived, setTipsReceived] = useState<any[]>([]);
  const [tipsSent, setTipsSent] = useState<any[]>([]);
  const [feeSplitConfig, setFeeSplitConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get tips received
  const fetchTipsReceived = useCallback(
    async (limit = 50) => {
      if (!userAddress) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/monetization?action=getTipsReceived&creatorAddress=${userAddress}&limit=${limit}`
        );
        if (!response.ok) throw new Error('Failed to fetch tips');

        const data = await response.json();
        setTipsReceived(data.tips || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    [userAddress]
  );

  // Get tips sent
  const fetchTipsSent = useCallback(
    async (limit = 50) => {
      if (!userAddress) return;

      try {
        const response = await fetch(
          `/api/monetization?action=getTipsSent&userAddress=${userAddress}&limit=${limit}`
        );
        if (!response.ok) throw new Error('Failed to fetch tips');

        const data = await response.json();
        setTipsSent(data.tips || []);
      } catch (err) {
        console.error('Failed to fetch tips sent:', err);
      }
    },
    [userAddress]
  );

  // Record tip (after on-chain transaction)
  const recordTip = useCallback(
    async (tip: {
      toAddress: string;
      amount: string;
      tokenType?: string;
      message?: string;
      transactionHash: string;
      platformFee?: string;
    }) => {
      try {
        const response = await fetch('/api/monetization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'recordTip',
            fromAddress: userAddress,
            ...tip,
          }),
        });

        if (!response.ok) throw new Error('Failed to record tip');

        await fetchTipsSent();
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [userAddress, fetchTipsSent]
  );

  // Set fee split config
  const setFeeSplit = useCallback(
    async (recipients: Array<{ address: string; percentage: number }>) => {
      try {
        const response = await fetch('/api/monetization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'setFeeSplitConfig',
            creatorAddress: userAddress,
            recipients,
          }),
        });

        if (!response.ok) throw new Error('Failed to set fee split');

        const data = await response.json();
        setFeeSplitConfig(data.config);
        setError(null);
        return data.config;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [userAddress]
  );

  // Get fee split config
  const fetchFeeSplit = useCallback(
    async (creatorAddress?: string) => {
      const address = creatorAddress || userAddress;
      if (!address) return;

      try {
        const response = await fetch(
          `/api/monetization?action=getFeeSplitConfig&creatorAddress=${address}`
        );
        if (!response.ok) throw new Error('Failed to fetch fee split');

        const data = await response.json();
        setFeeSplitConfig(data.config);
        return data.config;
      } catch (err) {
        console.error('Failed to fetch fee split:', err);
        return null;
      }
    },
    [userAddress]
  );

  // Get top supporters
  const fetchTopSupporters = useCallback(
    async (limit = 10) => {
      if (!userAddress) return [];

      try {
        const response = await fetch(
          `/api/monetization?action=getTopSupporters&creatorAddress=${userAddress}&limit=${limit}`
        );
        if (!response.ok) throw new Error('Failed to fetch supporters');

        const data = await response.json();
        return data.supporters || [];
      } catch (err) {
        console.error('Failed to fetch supporters:', err);
        return [];
      }
    },
    [userAddress]
  );

  useEffect(() => {
    if (userAddress) {
      fetchTipsReceived();
      fetchTipsSent();
      fetchFeeSplit();
    }
  }, [userAddress, fetchTipsReceived, fetchTipsSent, fetchFeeSplit]);

  return {
    tipsReceived,
    tipsSent,
    feeSplitConfig,
    isLoading,
    error,
    fetchTipsReceived,
    fetchTipsSent,
    recordTip,
    setFeeSplit,
    fetchFeeSplit,
    fetchTopSupporters,
  };
}

/**
 * Hook for premium themes
 */
export function usePremiumThemes(userAddress: string) {
  const [themes, setThemes] = useState<any[]>([]);
  const [userThemes, setUserThemes] = useState<any[]>([]);
  const [activeTheme, setActiveTheme] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all premium themes
  const fetchThemes = useCallback(async (limit = 50) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/monetization?action=getPremiumThemes&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch themes');

      const data = await response.json();
      setThemes(data.themes || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user's unlocked themes
  const fetchUserThemes = useCallback(async () => {
    if (!userAddress) return;

    try {
      const response = await fetch(
        `/api/monetization?action=getUserThemes&userAddress=${userAddress}`
      );
      if (!response.ok) throw new Error('Failed to fetch user themes');

      const data = await response.json();
      setUserThemes(data.themes || []);
    } catch (err) {
      console.error('Failed to fetch user themes:', err);
    }
  }, [userAddress]);

  // Fetch active theme
  const fetchActiveTheme = useCallback(async () => {
    if (!userAddress) return;

    try {
      const response = await fetch(
        `/api/monetization?action=getActiveTheme&userAddress=${userAddress}`
      );
      if (!response.ok) return;

      const data = await response.json();
      setActiveTheme(data.theme);
    } catch (err) {
      console.error('Failed to fetch active theme:', err);
    }
  }, [userAddress]);

  // Unlock a theme
  const unlockTheme = useCallback(
    async (themeId: string, transactionHash?: string) => {
      try {
        const response = await fetch('/api/monetization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'unlockTheme',
            userAddress,
            themeId,
            transactionHash,
          }),
        });

        if (!response.ok) throw new Error('Failed to unlock theme');

        await fetchUserThemes();
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [userAddress, fetchUserThemes]
  );

  // Set active theme
  const activateTheme = useCallback(
    async (themeId: string) => {
      try {
        const response = await fetch('/api/monetization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'setActiveTheme',
            userAddress,
            themeId,
          }),
        });

        if (!response.ok) throw new Error('Failed to activate theme');

        await fetchActiveTheme();
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [userAddress, fetchActiveTheme]
  );

  // Check if can access theme
  const canAccessTheme = useCallback(
    async (themeId: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/monetization?action=canAccessTheme&userAddress=${userAddress}&themeId=${themeId}`
        );
        if (!response.ok) return false;

        const data = await response.json();
        return data.canAccess;
      } catch (err) {
        console.error('Failed to check theme access:', err);
        return false;
      }
    },
    [userAddress]
  );

  useEffect(() => {
    fetchThemes();
    if (userAddress) {
      fetchUserThemes();
      fetchActiveTheme();
    }
  }, [userAddress, fetchThemes, fetchUserThemes, fetchActiveTheme]);

  return {
    themes,
    userThemes,
    activeTheme,
    isLoading,
    error,
    fetchThemes,
    fetchUserThemes,
    fetchActiveTheme,
    unlockTheme,
    activateTheme,
    canAccessTheme,
  };
}

/**
 * Hook for monetization stats
 */
export function useMonetizationStats(creatorAddress: string) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!creatorAddress) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/monetization?action=getMonetizationStats&creatorAddress=${creatorAddress}`
      );
      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.stats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [creatorAddress]);

  useEffect(() => {
    if (creatorAddress) {
      fetchStats();
    }
  }, [creatorAddress, fetchStats]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
}
