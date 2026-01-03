import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { Message } from '@/types';

interface MessagesListProps {
  messages: Message[];
  currentUserAddress: string;
  onReactionClick?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  isLoading?: boolean;
}

export function MessagesList({
  messages,
  currentUserAddress,
  onReactionClick,
  onReply,
  isLoading,
}: MessagesListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96 w-full border rounded-lg p-4">
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-96 text-gray-500">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderAddress === currentUserAddress ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.senderAddress === currentUserAddress
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-black'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  {message.isEncrypted && (
                    <span className="flex items-center gap-1">
                      🔒 {message.encryptionType === 'xmtp' ? 'XMTP' : 'Push'}
                    </span>
                  )}
                  <span className="opacity-70">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* Message Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {Object.entries(
                      message.reactions.reduce(
                        (acc: Record<string, number>, r: any) => {
                          acc[r.reactionEmoji] = (acc[r.reactionEmoji] || 0) + 1;
                          return acc;
                        },
                        {}
                      )
                    ).map(([emoji, count]) => (
                      <button
                        key={emoji}
                        onClick={() => onReactionClick?.(message.id, emoji)}
                        className="bg-opacity-50 bg-white rounded px-2 py-1 text-xs hover:bg-opacity-75"
                      >
                        {emoji} {count}
                      </button>
                    ))}
                  </div>
                )}

                {/* Reaction Buttons */}
                <div className="flex gap-1 mt-2">
                  {['👍', '❤️', '😂', '🔥', '✨'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onReactionClick?.(message.id, emoji)}
                      className="text-lg hover:scale-125 transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}

interface MessageInputProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  maxLength = 1000,
}: MessageInputProps) {
  const [message, setMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      setIsSending(true);
      await onSend(message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 w-full">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled || isSending}
        className="flex-1"
      />
      <span className="text-xs text-gray-500 self-center">
        {message.length}/{maxLength}
      </span>
      <Button
        onClick={handleSend}
        disabled={disabled || isSending || !message.trim()}
        size="sm"
      >
        {isSending ? 'Sending...' : 'Send'}
      </Button>
    </div>
  );
}

interface ConversationItemProps {
  id: string;
  participantName: string;
  participantAddress: string;
  lastMessage?: string;
  lastMessageAt?: string;
  isActive: boolean;
  unreadCount?: number;
  onClick?: () => void;
  onSelect?: () => void;
}

export function ConversationItem({
  id,
  participantName,
  participantAddress,
  lastMessage,
  lastMessageAt,
  isActive,
  unreadCount = 0,
  onClick,
  onSelect,
}: ConversationItemProps) {
  return (
    <div
      onClick={() => {
        onClick?.();
        onSelect?.();
      }}
      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex-1">
          <h4 className="font-medium truncate">{participantName || participantAddress}</h4>
          <p className="text-sm text-gray-600 truncate">{lastMessage || 'No messages yet'}</p>
        </div>
        {!isActive && <Badge variant="outline">Inactive</Badge>}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {lastMessageAt && new Date(lastMessageAt).toLocaleDateString()}
        </span>
        {unreadCount > 0 && (
          <Badge className="bg-blue-500 text-white rounded-full px-2">{unreadCount}</Badge>
        )}
      </div>
    </div>
  );
}

interface PermissionGateProps {
  hasPermission: boolean;
  permissionType?: string;
  minFollowers?: number;
  minBadgePoints?: number;
  requiredBadge?: string;
  requiresVerification?: boolean;
  requiresPremium?: boolean;
  userStats?: {
    followerCount?: number;
    badgePoints?: number;
    badges?: string[];
    isVerified?: boolean;
    isPremium?: boolean;
  };
}

export function PermissionGate({
  hasPermission,
  permissionType,
  minFollowers,
  minBadgePoints,
  requiredBadge,
  requiresVerification,
  requiresPremium,
  userStats,
}: PermissionGateProps) {
  if (hasPermission) {
    return null;
  }

  const reasons: string[] = [];

  if (requiresVerification && !userStats?.isVerified) {
    reasons.push('Account verification required');
  }
  if (requiresPremium && !userStats?.isPremium) {
    reasons.push('Premium membership required');
  }
  if (minFollowers && (userStats?.followerCount || 0) < minFollowers) {
    reasons.push(`Need ${minFollowers} followers (you have ${userStats?.followerCount || 0})`);
  }
  if (minBadgePoints && (userStats?.badgePoints || 0) < minBadgePoints) {
    reasons.push(`Need ${minBadgePoints} badge points (you have ${userStats?.badgePoints || 0})`);
  }
  if (requiredBadge && !userStats?.badges?.includes(requiredBadge)) {
    reasons.push(`Requires "${requiredBadge}" badge`);
  }

  return (
    <div className="border border-yellow-500 bg-yellow-50 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-yellow-900 mb-2">🔒 This conversation is gated</h3>
      <ul className="space-y-1 text-sm text-yellow-800">
        {reasons.map((reason, i) => (
          <li key={i} className="flex items-center gap-2">
            <span>•</span> {reason}
          </li>
        ))}
      </ul>
      <p className="text-xs text-yellow-700 mt-3">
        Meet the requirements above to participate in this conversation.
      </p>
    </div>
  );
}

interface BroadcastAnnouncementProps {
  id: string;
  title: string;
  content: string;
  senderName: string;
  senderAddress: string;
  recipientCount: number;
  isPinned: boolean;
  expiresAt?: string;
  isRead: boolean;
  onMarkAsRead?: () => void;
  onClick?: () => void;
}

export function BroadcastAnnouncement({
  id,
  title,
  content,
  senderName,
  senderAddress,
  recipientCount,
  isPinned,
  expiresAt,
  isRead,
  onMarkAsRead,
  onClick,
}: BroadcastAnnouncementProps) {
  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  return (
    <div
      onClick={() => {
        onMarkAsRead?.();
        onClick?.();
      }}
      className={`border rounded-lg p-4 cursor-pointer transition ${
        isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-300'
      } hover:shadow-md`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          {isPinned && <Badge className="mb-2 mr-2">📌 Pinned</Badge>}
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-gray-600">by {senderName || senderAddress}</p>
        </div>
        {!isRead && <Badge className="bg-blue-500">New</Badge>}
      </div>

      <p className="text-sm text-gray-700 mb-3">{content}</p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex gap-2">
          <span>👥 {recipientCount} recipients</span>
          {isExpired && <Badge variant="destructive">Expired</Badge>}
          {expiresAt && !isExpired && (
            <span>Expires: {new Date(expiresAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
