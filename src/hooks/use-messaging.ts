import type { Conversation, Message, MessageBroadcast, MessagePermission } from '@/types';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for managing messaging operations
 */
export function useMessaging(userAddress: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!userAddress) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/messages?address=${userAddress}&action=conversations`);
      if (!response.ok) throw new Error('Failed to fetch conversations');

      const data = await response.json();
      setConversations(data.conversations || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(
    async (conversationId: string, limit = 50, offset = 0) => {
      if (!userAddress) return;

      try {
        const response = await fetch(
          `/api/messages?address=${userAddress}&action=messages&conversationId=${conversationId}&limit=${limit}&offset=${offset}`
        );
        if (!response.ok) throw new Error('Failed to fetch messages');

        const data = await response.json();
        setMessages((prev) => ({
          ...prev,
          [conversationId]: data.messages || [],
        }));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    },
    [userAddress]
  );

  // Send a message
  const sendMessage = useCallback(
    async (toAddress: string, content: string, encryptionType = 'xmtp') => {
      if (!userAddress) return;

      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'send',
            toAddress,
            content,
            encryptionType,
          }),
        });

        if (!response.ok) throw new Error('Failed to send message');

        const data = await response.json();

        // Refresh messages for this conversation
        if (data.conversationId) {
          await fetchMessages(data.conversationId);
        }

        setError(null);
        return data.messageId;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [userAddress, fetchMessages]
  );

  // Block a user
  const blockUser = useCallback(
    async (blockedAddress: string, reason?: string) => {
      if (!userAddress) return;

      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'block',
            blockedAddress,
            reason,
          }),
        });

        if (!response.ok) throw new Error('Failed to block user');
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [userAddress]
  );

  // Unblock a user
  const unblockUser = useCallback(
    async (blockedAddress: string) => {
      if (!userAddress) return;

      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'unblock',
            blockedAddress,
          }),
        });

        if (!response.ok) throw new Error('Failed to unblock user');
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [userAddress]
  );

  // Mark message as read
  const markAsRead = useCallback(
    async (messageId: string) => {
      if (!userAddress) return;

      try {
        const response = await fetch('/api/messages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'markAsRead',
            messageId,
          }),
        });

        if (!response.ok) throw new Error('Failed to mark message as read');
        setError(null);
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    },
    [userAddress]
  );

  // Add reaction
  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!userAddress) return;

      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'addReaction',
            messageId,
            emoji,
          }),
        });

        if (!response.ok) throw new Error('Failed to add reaction');
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [userAddress]
  );

  // Initialize on user address change
  useEffect(() => {
    if (userAddress) {
      fetchConversations();
    }
  }, [userAddress, fetchConversations]);

  return {
    conversations,
    messages,
    isLoading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    blockUser,
    unblockUser,
    markAsRead,
    addReaction,
  };
}

/**
 * Hook for managing message permissions (badge-gating)
 */
export function useMessagePermissions(userAddress: string) {
  const [permissions, setPermissions] = useState<Record<string, MessagePermission | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get permissions for conversation
  const getPermissions = useCallback(
    async (conversationId: string) => {
      if (!userAddress) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/messages?address=${userAddress}&action=permissions&conversationId=${conversationId}`
        );
        if (!response.ok) throw new Error('Failed to fetch permissions');

        const data = await response.json();
        setPermissions((prev) => ({
          ...prev,
          [conversationId]: data.permissions,
        }));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    [userAddress]
  );

  // Set permissions for conversation
  const setMessagePermissions = useCallback(
    async (
      conversationId: string,
      config: {
        badgeId?: string;
        minFollowerCount?: number;
        minBadgePoints?: number;
        requiresVerification?: boolean;
        requiresPremium?: boolean;
        permissionType?: string;
      }
    ) => {
      if (!userAddress) return;

      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'setPermissions',
            conversationId,
            ...config,
          }),
        });

        if (!response.ok) throw new Error('Failed to set permissions');

        // Refresh permissions
        await getPermissions(conversationId);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [userAddress, getPermissions]
  );

  return {
    permissions,
    isLoading,
    error,
    getPermissions,
    setMessagePermissions,
  };
}

/**
 * Hook for managing broadcasts
 */
export function useBroadcasts(userAddress: string) {
  const [broadcasts, setBroadcasts] = useState<MessageBroadcast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch broadcasts
  const fetchBroadcasts = useCallback(
    async (limit = 20) => {
      if (!userAddress) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/messages?address=${userAddress}&action=broadcasts&limit=${limit}`
        );
        if (!response.ok) throw new Error('Failed to fetch broadcasts');

        const data = await response.json();
        setBroadcasts(data.broadcasts || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    [userAddress]
  );

  // Send broadcast
  const sendBroadcast = useCallback(
    async (
      title: string,
      content: string,
      options?: {
        targetBadgeId?: string;
        targetFollowerCountMin?: number;
        isPinned?: boolean;
        expiresAt?: string;
      }
    ) => {
      if (!userAddress) return;

      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'broadcast',
            title,
            content,
            ...options,
          }),
        });

        if (!response.ok) throw new Error('Failed to send broadcast');

        // Refresh broadcasts
        await fetchBroadcasts();
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [userAddress, fetchBroadcasts]
  );

  // Mark broadcast as read
  const markAsRead = useCallback(
    async (broadcastId: string) => {
      if (!userAddress) return;

      try {
        const response = await fetch('/api/messages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'markBroadcastAsRead',
            broadcastId,
          }),
        });

        if (!response.ok) throw new Error('Failed to mark broadcast as read');
        setError(null);
      } catch (err) {
        console.error('Failed to mark broadcast as read:', err);
      }
    },
    [userAddress]
  );

  // Initialize on user address change
  useEffect(() => {
    if (userAddress) {
      fetchBroadcasts();
    }
  }, [userAddress, fetchBroadcasts]);

  return {
    broadcasts,
    isLoading,
    error,
    fetchBroadcasts,
    sendBroadcast,
    markAsRead,
  };
}

/**
 * Hook for managing XMTP connection
 */
export function useXMTP(userAddress: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeXMTP = useCallback(
    async (wallet: any) => {
      if (!userAddress) return;

      setIsInitializing(true);
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'initXMTP',
            wallet,
          }),
        });

        if (!response.ok) throw new Error('Failed to initialize XMTP');

        setIsConnected(true);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        setIsConnected(false);
      } finally {
        setIsInitializing(false);
      }
    },
    [userAddress]
  );

  return {
    isConnected,
    isInitializing,
    error,
    initializeXMTP,
  };
}

/**
 * Hook for managing Push Protocol connection
 */
export function usePushProtocol(userAddress: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializePushProtocol = useCallback(
    async (wallet: any) => {
      if (!userAddress) return;

      setIsInitializing(true);
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'initPush',
            wallet,
          }),
        });

        if (!response.ok) throw new Error('Failed to initialize Push Protocol');

        setIsConnected(true);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        setIsConnected(false);
      } finally {
        setIsInitializing(false);
      }
    },
    [userAddress]
  );

  return {
    isConnected,
    isInitializing,
    error,
    initializePushProtocol,
  };
}
