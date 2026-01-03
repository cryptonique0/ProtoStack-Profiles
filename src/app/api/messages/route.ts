import MessagingService from '@/services/messaging-service';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getMessagingService(userAddress: string) {
  return new MessagingService(supabaseUrl, supabaseKey, userAddress);
}

// GET - Fetch conversations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userAddress = searchParams.get('address');
    const action = searchParams.get('action');
    const conversationId = searchParams.get('conversationId');

    if (!userAddress) {
      return NextResponse.json({ error: 'User address required' }, { status: 400 });
    }

    const messagingService = await getMessagingService(userAddress);

    if (action === 'conversations') {
      const conversations = await messagingService.getConversations(userAddress);
      return NextResponse.json({ conversations });
    }

    if (action === 'messages' && conversationId) {
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');
      const messages = await messagingService.getMessages(conversationId, limit, offset);
      return NextResponse.json({ messages });
    }

    if (action === 'permissions' && conversationId) {
      const permissions = await messagingService.getMessagePermissions(conversationId);
      return NextResponse.json({ permissions });
    }

    if (action === 'broadcasts') {
      const limit = parseInt(searchParams.get('limit') || '20');
      const broadcasts = await messagingService.getBroadcasts(userAddress, limit);
      return NextResponse.json({ broadcasts });
    }

    if (action === 'reactions') {
      const messageId = searchParams.get('messageId');
      if (!messageId) {
        return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
      }
      const reactions = await messagingService.getReactions(messageId);
      return NextResponse.json({ reactions });
    }

    if (action === 'blocked') {
      const blockedUsers = await messagingService.getBlockedUsers(userAddress);
      return NextResponse.json({ blockedUsers });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Messaging GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch messaging data' },
      { status: 500 }
    );
  }
}

// POST - Send messages, block users, create conversations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, action, ...payload } = body;

    if (!userAddress) {
      return NextResponse.json({ error: 'User address required' }, { status: 400 });
    }

    const messagingService = await getMessagingService(userAddress);

    if (action === 'send') {
      // Send a message
      const { toAddress, content, encryptionType = 'xmtp' } = payload;

      if (!toAddress || !content) {
        return NextResponse.json({ error: 'ToAddress and content required' }, { status: 400 });
      }

      const conversationId = await messagingService.getOrCreateConversation(userAddress, toAddress);

      const messageId = await messagingService.sendMessage({
        conversationId,
        senderAddress: toAddress,
        content,
        encryptionType: encryptionType as 'xmtp' | 'push' | 'none',
        metadata: payload.metadata,
      });

      return NextResponse.json({ messageId, conversationId });
    }

    if (action === 'block') {
      // Block a user
      const { blockedAddress, reason } = payload;
      if (!blockedAddress) {
        return NextResponse.json({ error: 'Blocked address required' }, { status: 400 });
      }

      await messagingService.blockUser(userAddress, blockedAddress, reason);
      return NextResponse.json({ success: true });
    }

    if (action === 'unblock') {
      // Unblock a user
      const { blockedAddress } = payload;
      if (!blockedAddress) {
        return NextResponse.json({ error: 'Blocked address required' }, { status: 400 });
      }

      await messagingService.unblockUser(userAddress, blockedAddress);
      return NextResponse.json({ success: true });
    }

    if (action === 'setPermissions') {
      // Set message permissions
      const { conversationId, ...permConfig } = payload;
      if (!conversationId) {
        return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
      }

      await messagingService.setMessagePermissions({
        conversationId,
        ...permConfig,
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'broadcast') {
      // Send broadcast
      const { title, content, targetBadgeId, targetFollowerCountMin, isPinned, expiresAt } =
        payload;

      if (!title || !content) {
        return NextResponse.json({ error: 'Title and content required' }, { status: 400 });
      }

      const broadcastId = await messagingService.sendBroadcast(userAddress, title, content, {
        targetBadgeId,
        targetFollowerCountMin,
        isPinned,
        expiresAt,
      });

      return NextResponse.json({ broadcastId });
    }

    if (action === 'addReaction') {
      // Add reaction to message
      const { messageId, emoji } = payload;
      if (!messageId || !emoji) {
        return NextResponse.json({ error: 'Message ID and emoji required' }, { status: 400 });
      }

      await messagingService.addReaction(messageId, userAddress, emoji);
      return NextResponse.json({ success: true });
    }

    if (action === 'removeReaction') {
      // Remove reaction from message
      const { messageId, emoji } = payload;
      if (!messageId || !emoji) {
        return NextResponse.json({ error: 'Message ID and emoji required' }, { status: 400 });
      }

      await messagingService.removeReaction(messageId, userAddress, emoji);
      return NextResponse.json({ success: true });
    }

    if (action === 'initXMTP') {
      // Initialize XMTP
      const wallet = payload.wallet;
      if (!wallet) {
        return NextResponse.json({ error: 'Wallet required' }, { status: 400 });
      }

      const connection = await messagingService.initializeXMTP(wallet);
      return NextResponse.json({ connection });
    }

    if (action === 'initPush') {
      // Initialize Push Protocol
      const wallet = payload.wallet;
      if (!wallet) {
        return NextResponse.json({ error: 'Wallet required' }, { status: 400 });
      }

      const connection = await messagingService.initializePushProtocol(userAddress, wallet);
      return NextResponse.json({ connection });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Messaging POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process messaging request' },
      { status: 500 }
    );
  }
}

// PUT - Mark as read, update message, etc.
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, action, ...payload } = body;

    if (!userAddress) {
      return NextResponse.json({ error: 'User address required' }, { status: 400 });
    }

    const messagingService = await getMessagingService(userAddress);

    if (action === 'markAsRead') {
      const { messageId } = payload;
      if (!messageId) {
        return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
      }

      await messagingService.markAsRead(messageId);
      return NextResponse.json({ success: true });
    }

    if (action === 'markBroadcastAsRead') {
      const { broadcastId } = payload;
      if (!broadcastId) {
        return NextResponse.json({ error: 'Broadcast ID required' }, { status: 400 });
      }

      await messagingService.markBroadcastAsRead(broadcastId, userAddress);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Messaging PUT error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update messaging data' },
      { status: 500 }
    );
  }
}
