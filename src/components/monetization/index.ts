import React, { useState } from 'react';
import { useSubscriptions, useTipping, usePremiumThemes, useMonetizationStats } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatEther } from 'ethers';

/**
 * SubscribeButton - Subscribe to a creator
 */
export function SubscribeButton({
  creatorAddress,
  userAddress,
  onSubscribe,
}: {
  creatorAddress: string;
  userAddress: string;
  onSubscribe?: () => void;
}) {
  const { fetchConfig, hasActiveSubscription } = useSubscriptions(userAddress);
  const [config, setConfig] = useState<any>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (creatorAddress && userAddress) {
      fetchConfig(creatorAddress).then(setConfig);
      hasActiveSubscription(creatorAddress).then(setHasSubscription);
    }
  }, [creatorAddress, userAddress]);

  if (!config || !config.isAcceptingSubscribers) {
    return null;
  }

  return (
    <Button
      onClick={() => {
        setIsLoading(true);
        onSubscribe?.();
      }}
      disabled={isLoading || hasSubscription}
      className="bg-gradient-to-r from-purple-600 to-blue-600"
    >
      {hasSubscription ? '✓ Subscribed' : `Subscribe - ${formatEther(config.subscriptionPrice)} ETH/mo`}
    </Button>
  );
}

/**
 * TipButton - Send a tip to a creator
 */
export function TipButton({
  creatorAddress,
  userAddress,
}: {
  creatorAddress: string;
  userAddress: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendTip = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setIsSending(true);
    try {
      // TODO: Integrate with tipping contract
      // This would call the smart contract to send the tip
      console.log('Sending tip:', { amount, message, to: creatorAddress });
      
      setShowModal(false);
      setAmount('');
      setMessage('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button onClick={() => setShowModal(true)} variant="outline" size="sm">
        💰 Tip
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Send a Tip</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (ETH)</label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message (optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Leave a nice message..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSendTip}
                  disabled={isSending || !amount}
                  className="flex-1"
                >
                  {isSending ? 'Sending...' : 'Send Tip'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

/**
 * MonetizationDashboard - Creator's earnings dashboard
 */
export function MonetizationDashboard({ creatorAddress }: { creatorAddress: string }) {
  const { stats, isLoading } = useMonetizationStats(creatorAddress);
  const { tipsReceived } = useTipping(creatorAddress);
  const { subscriptions } = useSubscriptions(creatorAddress);

  if (isLoading) {
    return <div className="text-center p-8">Loading stats...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">💰 Monetization Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="text-sm text-gray-600 mb-2">Total Tips</h3>
          <p className="text-3xl font-bold">{formatEther(stats?.totalTipsReceived || '0')} ETH</p>
          <p className="text-sm text-gray-500 mt-1">{stats?.totalTipsCount || 0} tips</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm text-gray-600 mb-2">Subscribers</h3>
          <p className="text-3xl font-bold">{stats?.totalSubscribers || 0}</p>
          <p className="text-sm text-gray-500 mt-1">
            {formatEther(stats?.totalSubscriptionRevenue || '0')} ETH earned
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm text-gray-600 mb-2">Theme Sales</h3>
          <p className="text-3xl font-bold">{formatEther(stats?.totalThemeSales || '0')} ETH</p>
          <p className="text-sm text-gray-500 mt-1">{stats?.totalThemeSalesCount || 0} sales</p>
        </Card>
      </div>

      {/* Recent Tips */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Tips</h3>
        {tipsReceived.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tips yet</p>
        ) : (
          <div className="space-y-3">
            {tipsReceived.slice(0, 10).map((tip) => (
              <div key={tip.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">
                    {tip.fromAddress.slice(0, 6)}...{tip.fromAddress.slice(-4)}
                  </p>
                  {tip.message && <p className="text-sm text-gray-600">{tip.message}</p>}
                </div>
                <p className="font-bold">{formatEther(tip.amount)} ETH</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * ThemeSelector - Select and activate premium themes
 */
export function ThemeSelector({ userAddress }: { userAddress: string }) {
  const { themes, userThemes, activeTheme, activateTheme, isLoading } = usePremiumThemes(userAddress);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const unlockedThemeIds = userThemes.map((ut) => ut.themeId);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🎨 Profile Themes</h2>

      {isLoading ? (
        <div className="text-center p-8">Loading themes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme) => {
            const isUnlocked = unlockedThemeIds.includes(theme.id);
            const isActive = activeTheme?.themeId === theme.id;

            return (
              <Card
                key={theme.id}
                className={`p-4 cursor-pointer transition-all ${
                  isActive ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedTheme(theme.id)}
              >
                {theme.previewImageUrl && (
                  <img
                    src={theme.previewImageUrl}
                    alt={theme.name}
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                )}
                <h3 className="font-semibold">{theme.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{theme.description}</p>

                <div className="mt-4 flex gap-2">
                  {isUnlocked ? (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        activateTheme(theme.id);
                      }}
                      variant={isActive ? 'default' : 'outline'}
                      className="flex-1"
                    >
                      {isActive ? '✓ Active' : 'Activate'}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1">
                      🔒 Unlock - {theme.price ? formatEther(theme.price) + ' ETH' : 'NFT Required'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * SubscriptionConfig - Creator's subscription settings
 */
export function SubscriptionConfigForm({ creatorAddress }: { creatorAddress: string }) {
  const { config, setSubscriptionConfig } = useSubscriptions(creatorAddress);
  const [price, setPrice] = useState('');
  const [accepting, setAccepting] = useState(true);
  const [benefits, setBenefits] = useState<string[]>(['']);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (config) {
      setPrice(formatEther(config.subscriptionPrice));
      setAccepting(config.isAcceptingSubscribers);
      setBenefits(config.benefits || ['']);
    }
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setSubscriptionConfig(
        ethers.parseEther(price).toString(),
        accepting,
        benefits.filter((b) => b.trim())
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Subscription Settings</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Monthly Price (ETH)</label>
          <Input
            type="number"
            step="0.001"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.01"
          />
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={accepting}
              onChange={(e) => setAccepting(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium">Accept new subscribers</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Subscriber Benefits</label>
          {benefits.map((benefit, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <Input
                value={benefit}
                onChange={(e) => {
                  const newBenefits = [...benefits];
                  newBenefits[idx] = e.target.value;
                  setBenefits(newBenefits);
                }}
                placeholder="e.g., Exclusive content access"
              />
              {idx === benefits.length - 1 && (
                <Button
                  size="sm"
                  onClick={() => setBenefits([...benefits, ''])}
                  variant="outline"
                >
                  +
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </Card>
  );
}

/**
 * GaslessIndicator - Show if transaction will be gasless
 */
export function GaslessIndicator({
  userAddress,
  operationType,
}: {
  userAddress: string;
  operationType: string;
}) {
  const [qualifies, setQualifies] = useState(false);

  React.useEffect(() => {
    fetch(`/api/paymaster?action=qualifiesForGasless&userAddress=${userAddress}&operationType=${operationType}`)
      .then((r) => r.json())
      .then((data) => setQualifies(data.qualifies));
  }, [userAddress, operationType]);

  if (!qualifies) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
      ⚡ Gas-free transaction
    </div>
  );
}
