// MONETIZATION Examples
// Quick snippets demonstrating hooks and components

import React from 'react';
import {
  MonetizationDashboard,
  SubscribeButton,
  SubscriptionConfigForm,
  ThemeSelector,
  TipButton,
} from './src/components/monetization';
import { useMonetizationStats, usePremiumThemes, useSubscriptions, useTipping } from './src/hooks';

// 1) SubscribeButton usage
export function SubscribeButtonExample({
  creatorAddress,
  userAddress,
}: {
  creatorAddress: string;
  userAddress: string;
}) {
  const handleSubscribe = () => console.log('Subscribed!');
  return (
    <SubscribeButton
      creatorAddress={creatorAddress}
      userAddress={userAddress}
      onSubscribe={handleSubscribe}
    />
  );
}

// 2) TipButton usage
export function TipButtonExample({
  creatorAddress,
  userAddress,
}: {
  creatorAddress: string;
  userAddress: string;
}) {
  return <TipButton creatorAddress={creatorAddress} userAddress={userAddress} />;
}

// 3) SubscriptionConfigForm (creator settings)
export function SubscriptionConfigFormExample({ creatorAddress }: { creatorAddress: string }) {
  return <SubscriptionConfigForm creatorAddress={creatorAddress} />;
}

// 4) Monetization Dashboard for creators
export function MonetizationDashboardExample({ creatorAddress }: { creatorAddress: string }) {
  return <MonetizationDashboard creatorAddress={creatorAddress} />;
}

// 5) ThemeSelector for users
export function ThemeSelectorExample({ userAddress }: { userAddress: string }) {
  return <ThemeSelector userAddress={userAddress} />;
}

// 6) useSubscriptions hook example
export function SubscriptionsHookExample({ userAddress }: { userAddress: string }) {
  const {
    subscriptions,
    config,
    isLoading,
    error,
    setSubscriptionConfig,
    recordSubscription,
    hasActiveSubscription,
  } = useSubscriptions(userAddress);

  React.useEffect(() => {
    if (!userAddress) return;
    hasActiveSubscription(userAddress, '0xCreator');
  }, [userAddress, hasActiveSubscription]);

  if (isLoading) return <div>Loading subscriptions...</div>;
  if (error) return <div>Error: {error}</div>;
  return (
    <div>
      <h3>Subscriptions</h3>
      <pre>{JSON.stringify(subscriptions, null, 2)}</pre>
      <h3>Config</h3>
      <pre>{JSON.stringify(config, null, 2)}</pre>
    </div>
  );
}

// 7) useTipping hook example
export function TippingHookExample({ userAddress }: { userAddress: string }) {
  const {
    tipsReceived,
    tipsSent,
    feeSplitConfig,
    recordTip,
    setFeeSplit,
    fetchTopSupporters,
    isLoading,
    error,
  } = useTipping(userAddress);

  const handleTip = async () => {
    await recordTip({
      fromAddress: userAddress,
      toAddress: '0xCreator',
      amount: '10000000000000000',
      tokenType: 'ETH',
      message: 'Nice work!',
      transactionHash: '0x123',
      platformFee: '250000000000000',
    });
  };

  if (isLoading) return <div>Loading tips...</div>;
  if (error) return <div>Error: {error}</div>;
  return (
    <div>
      <button onClick={handleTip}>Send Tip</button>
      <pre>{JSON.stringify({ tipsReceived, tipsSent, feeSplitConfig }, null, 2)}</pre>
    </div>
  );
}

// 8) usePremiumThemes hook example
export function PremiumThemesHookExample({ userAddress }: { userAddress: string }) {
  const {
    themes,
    userThemes,
    activeTheme,
    unlockTheme,
    activateTheme,
    canAccessTheme,
    isLoading,
    error,
  } = usePremiumThemes(userAddress);

  React.useEffect(() => {
    if (!userAddress) return;
    canAccessTheme(userAddress, themes[0]?.id ?? '');
  }, [userAddress, canAccessTheme, themes]);

  if (isLoading) return <div>Loading themes...</div>;
  if (error) return <div>Error: {error}</div>;
  return (
    <div>
      <h3>Themes</h3>
      <pre>{JSON.stringify({ themes, userThemes, activeTheme }, null, 2)}</pre>
      <button onClick={() => themes[0]?.id && unlockTheme(userAddress, themes[0].id)}>
        Unlock first theme
      </button>
      <button
        onClick={() => userThemes[0]?.themeId && activateTheme(userAddress, userThemes[0].themeId)}
      >
        Activate first theme
      </button>
    </div>
  );
}

// 9) useMonetizationStats hook example
export function MonetizationStatsHookExample({ creatorAddress }: { creatorAddress: string }) {
  const { stats, isLoading, error } = useMonetizationStats(creatorAddress);

  if (isLoading) return <div>Loading stats...</div>;
  if (error) return <div>Error: {error}</div>;
  return (
    <div>
      <h3>Stats</h3>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}
