/**
 * Example: Implementing Messaging in Your ProtoStack Profiles App
 *
 * This file demonstrates how to use the messaging system
 */

// ============================================
// EXAMPLE 1: Basic Messaging Page
// ============================================

import { ConversationsList, MessageThread } from '@/components/messaging';
import { useMessaging } from '@/hooks';
import { useEffect, useState } from 'react';

export default function MessagesPage() {
  const userAddress = '0x...'; // Get from wallet
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const { conversations, messages, isLoading, fetchMessages, sendMessage } =
    useMessaging(userAddress);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return;

    const conversation = conversations.find((c) => c.id === selectedConversation);
    if (!conversation) return;

    const recipient =
      conversation.participant1 === userAddress
        ? conversation.participant2
        : conversation.participant1;

    await sendMessage(recipient, content, 'xmtp');
  };

  return (
    <div className="flex h-screen">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r">
        <ConversationsList
          conversations={conversations}
          selectedId={selectedConversation || undefined}
          isLoading={isLoading}
          onSelectConversation={(conv) => setSelectedConversation(conv.id)}
        />
      </div>

      {/* Message Thread */}
      <div className="flex-1">
        {selectedConversation ? (
          <MessageThread
            conversation={conversations.find((c) => c.id === selectedConversation)!}
            messages={messages[selectedConversation] || []}
            currentUserAddress={userAddress}
            isLoading={isLoading}
            hasPermission={true}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 2: Badge-Gated Chat Component
// ============================================

import { Button } from '@/components/ui/button';
import { useMessagePermissions, useWeb3Profile } from '@/hooks';

export function BadgeGatedChat({
  conversationId,
  userAddress,
}: {
  conversationId: string;
  userAddress: string;
}) {
  const { setMessagePermissions, permissions } = useMessagePermissions(userAddress);
  const { badges } = useWeb3Profile(userAddress);

  const currentPerms = permissions[conversationId];

  const handleGateChat = async (badgeId: string) => {
    await setMessagePermissions(conversationId, {
      badgeId,
      permissionType: 'badge_gated',
      requiresVerification: true,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold">Conversation Settings</h3>

      {/* Current permissions display */}
      {currentPerms && (
        <div className="rounded border border-blue-200 bg-blue-50 p-3">
          <p className="mb-2 text-sm font-medium">🔒 Current Restrictions:</p>
          <ul className="space-y-1 text-sm">
            {currentPerms.requiresVerification && <li>✓ Requires verified account</li>}
            {currentPerms.minFollowerCount > 0 && (
              <li>✓ Requires {currentPerms.minFollowerCount}+ followers</li>
            )}
            {currentPerms.minBadgePoints > 0 && (
              <li>✓ Requires {currentPerms.minBadgePoints}+ badge points</li>
            )}
          </ul>
        </div>
      )}

      {/* Badge gating options */}
      <div>
        <p className="mb-2 text-sm font-medium">Gate by Badge:</p>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <Button
              key={badge.id}
              variant={currentPerms?.badgeId === badge.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleGateChat(badge.id)}
            >
              {badge.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 3: Broadcast Announcements
// ============================================

import { BroadcastAnnouncement } from '@/components/messaging';
import { useBroadcasts } from '@/hooks';

export function AnnouncementsPanel({ userAddress }: { userAddress: string }) {
  const { broadcasts, sendBroadcast, markAsRead } = useBroadcasts(userAddress);

  const handleSendAnnouncement = async () => {
    await sendBroadcast(
      '📢 New Feature Launch',
      'We just launched badge-gated messaging! Check it out.',
      {
        isPinned: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Announcements</h2>
        <Button onClick={handleSendAnnouncement} size="sm">
          📢 New Announcement
        </Button>
      </div>

      <div className="space-y-3">
        {broadcasts.map((broadcast) => (
          <BroadcastAnnouncement
            key={broadcast.id}
            {...broadcast}
            senderName={broadcast.senderAddress}
            onMarkAsRead={() => markAsRead(broadcast.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 4: Message with Reactions
// ============================================

export function MessageWithReactions({
  messageId,
  userAddress,
}: {
  messageId: string;
  userAddress: string;
}) {
  const { addReaction } = useMessaging(userAddress);

  const handleReaction = async (emoji: string) => {
    try {
      await addReaction(messageId, emoji);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  return (
    <div className="flex gap-2">
      {['👍', '❤️', '😂', '🔥', '✨'].map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleReaction(emoji)}
          className="text-2xl transition hover:scale-125"
          title={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// ============================================
// EXAMPLE 5: Initialize XMTP on App Load
// ============================================

import { usePushProtocol, useXMTP } from '@/hooks';
import { useAccount } from 'wagmi';

export function MessagingInitializer() {
  const { address: userAddress } = useAccount();
  const { initializeXMTP, isConnected: xmtpConnected } = useXMTP(userAddress);
  const { initializePushProtocol, isConnected: pushConnected } = usePushProtocol(userAddress);

  useEffect(() => {
    if (!userAddress) return;

    // Initialize both protocols
    initializeXMTP(window.ethereum); // Your wallet client
    initializePushProtocol(window.ethereum);
  }, [userAddress, initializeXMTP, initializePushProtocol]);

  return (
    <div className="flex gap-2 text-xs">
      <span className={xmtpConnected ? 'text-green-600' : 'text-gray-500'}>
        {xmtpConnected ? '✓' : '○'} XMTP
      </span>
      <span className={pushConnected ? 'text-green-600' : 'text-gray-500'}>
        {pushConnected ? '✓' : '○'} Push
      </span>
    </div>
  );
}

// ============================================
// EXAMPLE 6: Profile Card with Message Button
// ============================================

import Link from 'next/link';

export function ProfileCardWithMessaging({
  profileAddress,
  userName,
  avatarUrl,
}: {
  profileAddress: string;
  userName: string;
  avatarUrl: string;
}) {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      {/* Profile info */}
      <div className="flex items-center gap-3">
        <img src={avatarUrl} alt={userName} className="h-12 w-12 rounded-full" />
        <div>
          <h3 className="font-semibold">{userName}</h3>
          <p className="text-xs text-gray-600">{profileAddress.slice(0, 10)}...</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Link href={`/profile/${profileAddress}`} className="flex-1">
          <Button variant="outline" className="w-full">
            View Profile
          </Button>
        </Link>
        <Link href={`/messages?recipient=${profileAddress}`} className="flex-1">
          <Button className="w-full">💬 Message</Button>
        </Link>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 7: Block User Dialog
// ============================================

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export function BlockUserDialog({
  userAddress,
  targetAddress,
  onClose,
}: {
  userAddress: string;
  targetAddress: string;
  onClose: () => void;
}) {
  const { blockUser } = useMessaging(userAddress);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBlock = async () => {
    try {
      setIsLoading(true);
      await blockUser(targetAddress, reason || undefined);
      onClose();
    } catch (error) {
      console.error('Failed to block user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block User</DialogTitle>
          <DialogDescription>This user will not be able to message you.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Reason (optional)</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you blocking this user?"
              className="mt-2"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBlock} disabled={isLoading}>
              {isLoading ? 'Blocking...' : 'Block User'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// EXAMPLE 8: Message Permissions Form
// ============================================

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export function MessagePermissionsForm({
  conversationId,
  userAddress,
  availableBadges,
}: {
  conversationId: string;
  userAddress: string;
  availableBadges: Array<{ id: string; name: string }>;
}) {
  const { setMessagePermissions } = useMessagePermissions(userAddress);

  const [config, setConfig] = useState({
    badgeId: '',
    minFollowerCount: 0,
    minBadgePoints: 0,
    requiresVerification: false,
    requiresPremium: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await setMessagePermissions(conversationId, config);
      alert('Permissions updated!');
    } catch (error) {
      console.error('Failed to update permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <h3 className="font-semibold">Message Permissions</h3>

      {/* Badge requirement */}
      <div>
        <label className="text-sm font-medium">Require Badge (optional)</label>
        <select
          value={config.badgeId}
          onChange={(e) => setConfig({ ...config, badgeId: e.target.value })}
          className="mt-2 w-full rounded border px-3 py-2"
        >
          <option value="">No badge required</option>
          {availableBadges.map((badge) => (
            <option key={badge.id} value={badge.id}>
              {badge.name}
            </option>
          ))}
        </select>
      </div>

      {/* Follower requirement */}
      <div>
        <label className="text-sm font-medium">Minimum Followers</label>
        <Input
          type="number"
          value={config.minFollowerCount}
          onChange={(e) =>
            setConfig({ ...config, minFollowerCount: parseInt(e.target.value) || 0 })
          }
          className="mt-2"
        />
      </div>

      {/* Badge points requirement */}
      <div>
        <label className="text-sm font-medium">Minimum Badge Points</label>
        <Input
          type="number"
          value={config.minBadgePoints}
          onChange={(e) => setConfig({ ...config, minBadgePoints: parseInt(e.target.value) || 0 })}
          className="mt-2"
        />
      </div>

      {/* Verification requirement */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={config.requiresVerification}
          onChange={(checked) => setConfig({ ...config, requiresVerification: checked })}
        />
        <label className="text-sm">Require verified account</label>
      </div>

      {/* Premium requirement */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={config.requiresPremium}
          onChange={(checked) => setConfig({ ...config, requiresPremium: checked })}
        />
        <label className="text-sm">Premium members only</label>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : 'Save Permissions'}
      </Button>
    </form>
  );
}

// ============================================
// USAGE IN MAIN APP
// ============================================

/*
import { MessagingInitializer } from '@/components/messaging-initializer';

export default function RootLayout() {
  return (
    <html>
      <body>
        <MessagingInitializer />
        <YourAppContent />
      </body>
    </html>
  );
}
*/
