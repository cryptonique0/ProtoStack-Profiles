import { createClient } from '@supabase/supabase-js';
import type { DecodedMessage, Client as XMTPClient } from '@xmtp/sdk';

interface MessagePayload {
  conversationId: string;
  senderAddress: string;
  content: string;
  contentType?: 'text' | 'image' | 'file' | 'announcement';
  messageType?: 'direct' | 'group' | 'announcement';
  isEncrypted?: boolean;
  encryptionType?: 'none' | 'xmtp' | 'push';
  metadata?: Record<string, unknown>;
}

interface ConversationData {
  id: string;
  participant1: string;
  participant2: string;
  lastMessageAt?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

interface PermissionConfig {
  conversationId: string;
  badgeId?: string;
  minFollowerCount?: number;
  minBadgePoints?: number;
  requiresVerification?: boolean;
  requiresPremium?: boolean;
  permissionType?: 'none' | 'badge_gated' | 'follower_gated' | 'premium_only' | 'custom';
}

export class MessagingService {
  private supabase;
  private xmtpClient: XMTPClient | null = null;

  constructor(
    private supabaseUrl: string,
    private supabaseKey: string,
    private userAddress?: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ============================================
  // XMTP INTEGRATION
  // ============================================

  /**
   * Initialize XMTP connection for user
   */
  async initializeXMTP(wallet: {
    getAddress: () => Promise<string>;
    signMessage: (message: string) => Promise<string>;
  }) {
    try {
      const { Client } = await import('@xmtp/sdk');

      this.userAddress = await wallet.getAddress();

      // Check if user already has XMTP connection
      const { data: existingConnection } = await this.supabase
        .from('xmtp_connections')
        .select('*')
        .eq('user_address', this.userAddress)
        .single();

      if (existingConnection) {
        console.log('Existing XMTP connection found');
        return existingConnection;
      }

      // Create new XMTP client
      this.xmtpClient = await Client.create(wallet, { env: 'production' });

      // Store connection in database
      const { data: connection, error } = await this.supabase
        .from('xmtp_connections')
        .insert({
          user_address: this.userAddress,
          xmtp_installation_id: this.xmtpClient.address,
          xmtp_account_id: this.userAddress,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return connection;
    } catch (error) {
      console.error('Failed to initialize XMTP:', error);
      throw error;
    }
  }

  /**
   * Send message via XMTP
   */
  async sendMessageViaXMTP(toAddress: string, content: string): Promise<string> {
    if (!this.xmtpClient || !this.userAddress) {
      throw new Error('XMTP not initialized');
    }

    try {
      // Check if user is blocked
      const isBlocked = await this.isUserBlocked(this.userAddress, toAddress);
      if (isBlocked) {
        throw new Error('This user has blocked you');
      }

      // Get or create conversation
      const conversationId = await this.getOrCreateConversation(this.userAddress, toAddress);

      // Check permissions
      const hasPermission = await this.checkMessagePermission(this.userAddress, conversationId);
      if (!hasPermission) {
        throw new Error('You do not have permission to message this user');
      }

      // Create or get conversation in XMTP
      const conversation = await this.xmtpClient.conversations.newConversation(toAddress);

      // Send message
      const messageId = await conversation.send(content);

      // Store message in database
      const { data: message, error } = await this.supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_address: this.userAddress,
          content,
          content_type: 'text',
          message_type: 'direct',
          is_encrypted: true,
          encryption_type: 'xmtp',
          xmtp_message_id: messageId,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Update conversation last message timestamp
      await this.supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return message.id;
    } catch (error) {
      console.error('Failed to send XMTP message:', error);
      throw error;
    }
  }

  /**
   * Get messages from XMTP conversation
   */
  async getMessagesFromXMTP(toAddress: string, limit = 50): Promise<any[]> {
    if (!this.xmtpClient || !this.userAddress) {
      throw new Error('XMTP not initialized');
    }

    try {
      const conversation = await this.xmtpClient.conversations.getConversationById(toAddress);
      if (!conversation) return [];

      const messages = await conversation.messages({ limit });
      return messages.map((msg: DecodedMessage) => ({
        id: msg.id,
        sender: msg.senderAddress,
        content: msg.content,
        timestamp: msg.sent,
        isFromMe: msg.senderAddress === this.userAddress,
      }));
    } catch (error) {
      console.error('Failed to get XMTP messages:', error);
      return [];
    }
  }

  // ============================================
  // PUSH PROTOCOL INTEGRATION
  // ============================================

  /**
   * Initialize Push Protocol connection
   */
  async initializePushProtocol(userAddress: string, wallet: any) {
    try {
      const PushAPI = await import('@pushprotocol/restapi');

      // Create or get Push user
      const user = await PushAPI.user.create({
        account: `eip155:1:${userAddress}`,
        env: 'prod',
      });

      // Store in database
      const { data: connection, error } = await this.supabase
        .from('push_connections')
        .upsert({
          user_address: userAddress,
          push_user_id: user.did,
          is_active: true,
          notification_settings: {
            on_message: true,
            on_broadcast: true,
          },
        })
        .select()
        .single();

      if (error) throw error;
      return connection;
    } catch (error) {
      console.error('Failed to initialize Push Protocol:', error);
      throw error;
    }
  }

  /**
   * Send message via Push Protocol
   */
  async sendMessageViaPush(toAddress: string, content: string): Promise<string> {
    if (!this.userAddress) throw new Error('User address not set');

    try {
      const PushAPI = await import('@pushprotocol/restapi');

      // Get conversation
      const conversationId = await this.getOrCreateConversation(this.userAddress, toAddress);

      // Check permissions
      const hasPermission = await this.checkMessagePermission(this.userAddress, conversationId);
      if (!hasPermission) {
        throw new Error('You do not have permission to message this user');
      }

      // Send chat via Push
      const response = await PushAPI.chat.send({
        messageContent: content,
        messageType: 'Text',
        receiverAddress: `eip155:1:${toAddress}`,
        senderAddress: `eip155:1:${this.userAddress}`,
        env: 'prod',
      });

      // Store message in database
      const { data: message, error } = await this.supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_address: this.userAddress,
          content,
          content_type: 'text',
          message_type: 'direct',
          is_encrypted: true,
          encryption_type: 'push',
          push_message_id: response.messageId,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Update conversation
      await this.supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return message.id;
    } catch (error) {
      console.error('Failed to send Push message:', error);
      throw error;
    }
  }

  // ============================================
  // MESSAGE MANAGEMENT
  // ============================================

  /**
   * Send a message (hybrid: tries XMTP first, falls back to Push)
   */
  async sendMessage(payload: MessagePayload): Promise<string> {
    try {
      // Determine encryption type
      let messageId: string;

      if (payload.encryptionType === 'xmtp' && this.xmtpClient) {
        messageId = await this.sendMessageViaXMTP(payload.senderAddress, payload.content);
      } else if (payload.encryptionType === 'push') {
        messageId = await this.sendMessageViaPush(payload.senderAddress, payload.content);
      } else {
        // Fallback: Store in database with no encryption
        const { data: message, error } = await this.supabase
          .from('messages')
          .insert({
            conversation_id: payload.conversationId,
            sender_address: payload.senderAddress,
            content: payload.content,
            content_type: payload.contentType || 'text',
            message_type: payload.messageType || 'direct',
            is_encrypted: false,
            encryption_type: 'none',
            metadata: payload.metadata,
          })
          .select('id')
          .single();

        if (error) throw error;
        messageId = message.id;

        // Update conversation
        await this.supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', payload.conversationId);
      }

      return messageId;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Get or create conversation between two users
   */
  async getOrCreateConversation(address1: string, address2: string): Promise<string> {
    // Ensure consistent ordering
    const [participant1, participant2] = [address1, address2].sort();

    try {
      // Try to get existing conversation
      const { data: existing } = await this.supabase
        .from('conversations')
        .select('id')
        .eq('participant_1', participant1)
        .eq('participant_2', participant2)
        .single();

      if (existing) return existing.id;

      // Create new conversation
      const { data: conversation, error } = await this.supabase
        .from('conversations')
        .insert({
          participant_1: participant1,
          participant_2: participant2,
          is_active: true,
        })
        .select('id')
        .single();

      if (error) throw error;
      return conversation.id;
    } catch (error) {
      console.error('Failed to get or create conversation:', error);
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(userAddress: string): Promise<ConversationData[]> {
    try {
      const { data: conversations, error } = await this.supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${userAddress},participant_2.eq.${userAddress}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return conversations || [];
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(conversationId: string, limit = 50, offset = 0) {
    try {
      const { data: messages, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return messages || [];
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }

  // ============================================
  // BADGE-GATED MESSAGING
  // ============================================

  /**
   * Set message permissions (badge-gating, etc.)
   */
  async setMessagePermissions(config: PermissionConfig): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('message_permissions')
        .upsert({
          conversation_id: config.conversationId,
          badge_id: config.badgeId,
          min_follower_count: config.minFollowerCount || 0,
          min_badge_points: config.minBadgePoints || 0,
          requires_verification: config.requiresVerification || false,
          requires_premium: config.requiresPremium || false,
          permission_type: config.permissionType || 'none',
        })
        .eq('conversation_id', config.conversationId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to set message permissions:', error);
      throw error;
    }
  }

  /**
   * Check if user has permission to message in conversation
   */
  async checkMessagePermission(userAddress: string, conversationId: string): Promise<boolean> {
    try {
      const { data: result, error } = await this.supabase.rpc('can_send_message', {
        sender_addr: userAddress,
        conv_id: conversationId,
      });

      if (error) throw error;
      return result || false;
    } catch (error) {
      console.error('Failed to check message permission:', error);
      return false;
    }
  }

  /**
   * Get message permissions for conversation
   */
  async getMessagePermissions(conversationId: string) {
    try {
      const { data: permissions, error } = await this.supabase
        .from('message_permissions')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
      return permissions || null;
    } catch (error) {
      console.error('Failed to get message permissions:', error);
      return null;
    }
  }

  // ============================================
  // BLOCKING & PRIVACY
  // ============================================

  /**
   * Block a user
   */
  async blockUser(userAddress: string, blockedAddress: string, reason?: string): Promise<void> {
    try {
      const { error } = await this.supabase.from('blocked_users').insert({
        blocker_address: userAddress,
        blocked_address: blockedAddress,
        reason,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(userAddress: string, blockedAddress: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_address', userAddress)
        .eq('blocked_address', blockedAddress);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  }

  /**
   * Check if user is blocked
   */
  async isUserBlocked(userAddress: string, otherAddress: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('blocked_users')
        .select('id')
        .or(
          `and(blocker_address.eq.${userAddress},blocked_address.eq.${otherAddress}),and(blocker_address.eq.${otherAddress},blocked_address.eq.${userAddress})`
        )
        .limit(1);

      if (error) throw error;
      return (data && data.length > 0) || false;
    } catch (error) {
      console.error('Failed to check blocked status:', error);
      return false;
    }
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(userAddress: string) {
    try {
      const { data: blocked, error } = await this.supabase
        .from('blocked_users')
        .select('blocked_address')
        .eq('blocker_address', userAddress);

      if (error) throw error;
      return blocked?.map((b) => b.blocked_address) || [];
    } catch (error) {
      console.error('Failed to get blocked users:', error);
      return [];
    }
  }

  // ============================================
  // ANNOUNCEMENTS & BROADCASTS
  // ============================================

  /**
   * Send a broadcast announcement to multiple users
   */
  async sendBroadcast(
    senderAddress: string,
    title: string,
    content: string,
    options?: {
      targetBadgeId?: string;
      targetFollowerCountMin?: number;
      expiresAt?: string;
      isPinned?: boolean;
    }
  ): Promise<string> {
    try {
      // Create broadcast
      const { data: broadcast, error } = await this.supabase
        .from('message_broadcasts')
        .insert({
          sender_address: senderAddress,
          title,
          content,
          target_badge_id: options?.targetBadgeId,
          target_follower_count_min: options?.targetFollowerCountMin || 0,
          is_pinned: options?.isPinned || false,
          expires_at: options?.expiresAt,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Get recipients based on criteria
      let recipients: string[] = [];

      if (options?.targetBadgeId) {
        // Get users with specific badge
        const { data: badgeHolders } = await this.supabase
          .from('user_badges')
          .select('user_address')
          .eq('badge_id', options.targetBadgeId);

        recipients = badgeHolders?.map((u) => u.user_address) || [];
      } else if (options?.targetFollowerCountMin) {
        // Get users with minimum followers
        const { data: profiles } = await this.supabase
          .from('profiles')
          .select('address')
          .gte('follower_count', options.targetFollowerCountMin);

        recipients = profiles?.map((p) => p.address) || [];
      } else {
        // Send to all users
        const { data: profiles } = await this.supabase.from('profiles').select('address');
        recipients = profiles?.map((p) => p.address) || [];
      }

      // Create broadcast recipient entries
      if (recipients.length > 0) {
        const recipientRecords = recipients.map((addr) => ({
          broadcast_id: broadcast.id,
          recipient_address: addr,
        }));

        await this.supabase.from('broadcast_recipients').insert(recipientRecords);

        // Update recipient count
        await this.supabase
          .from('message_broadcasts')
          .update({ recipient_count: recipients.length })
          .eq('id', broadcast.id);
      }

      return broadcast.id;
    } catch (error) {
      console.error('Failed to send broadcast:', error);
      throw error;
    }
  }

  /**
   * Get broadcasts for a user
   */
  async getBroadcasts(userAddress: string, limit = 20) {
    try {
      const { data: broadcasts, error } = await this.supabase
        .from('broadcast_recipients')
        .select('*, message_broadcasts(*)')
        .eq('recipient_address', userAddress)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return broadcasts || [];
    } catch (error) {
      console.error('Failed to get broadcasts:', error);
      return [];
    }
  }

  /**
   * Mark broadcast as read
   */
  async markBroadcastAsRead(broadcastId: string, userAddress: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('broadcast_recipients')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('broadcast_id', broadcastId)
        .eq('recipient_address', userAddress);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark broadcast as read:', error);
    }
  }

  // ============================================
  // MESSAGE REACTIONS
  // ============================================

  /**
   * Add reaction to message
   */
  async addReaction(messageId: string, userAddress: string, emoji: string): Promise<void> {
    try {
      const { error } = await this.supabase.from('message_reactions').insert({
        message_id: messageId,
        user_address: userAddress,
        reaction_emoji: emoji,
      });

      if (error && error.code !== '23505') throw error; // 23505 = unique constraint
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId: string, userAddress: string, emoji: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_address', userAddress)
        .eq('reaction_emoji', emoji);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      throw error;
    }
  }

  /**
   * Get reactions for message
   */
  async getReactions(messageId: string) {
    try {
      const { data: reactions, error } = await this.supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId);

      if (error) throw error;
      return reactions || [];
    } catch (error) {
      console.error('Failed to get reactions:', error);
      return [];
    }
  }
}

export default MessagingService;
