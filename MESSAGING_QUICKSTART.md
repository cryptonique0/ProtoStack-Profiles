# 🚀 Messaging Quick Start Guide

## 5-Minute Setup

### Step 1: Run Database Migration

```bash
# Push messaging schema to Supabase
supabase db push

# Or manually run the SQL:
# supabase/migrations/002_messaging_schema.sql
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Add Environment Variables

```bash
# .env.local
NEXT_PUBLIC_XMTP_ENV=production
NEXT_PUBLIC_PUSH_ENV=prod
```

### Step 4: Create Messages Page

Create `src/app/messages/page.tsx`:

```typescript
import { useMessaging } from '@/hooks';
import { MessageThread, ConversationsList } from '@/components/messaging';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

export default function MessagesPage() {
  const { address } = useAccount();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    conversations,
    messages,
    fetchMessages,
    sendMessage,
  } = useMessaging(address!);

  if (!address) return <div>Connect wallet to message</div>;

  return (
    <div className="flex h-screen gap-4">
      {/* Conversations */}
      <div className="w-96 border-r">
        <ConversationsList
          conversations={conversations}
          selectedId={selectedId || undefined}
          onSelectConversation={(conv) => setSelectedId(conv.id)}
        />
      </div>

      {/* Messages */}
      <div className="flex-1">
        {selectedId && conversations.find(c => c.id === selectedId) && (
          <MessageThread
            conversation={conversations.find(c => c.id === selectedId)!}
            messages={messages[selectedId] || []}
            currentUserAddress={address}
            isLoading={false}
            hasPermission={true}
            onSendMessage={(content) => {
              const conv = conversations.find(c => c.id === selectedId)!;
              const recipient = conv.participant1 === address ? conv.participant2 : conv.participant1;
              return sendMessage(recipient, content);
            }}
          />
        )}
      </div>
    </div>
  );
}
```

### Step 5: Add Message Button to Profile

In your profile header component:

```typescript
<Button onClick={() => router.push(`/messages?recipient=${profileAddress}`)}>
  💬 Message
</Button>
```

## Common Patterns

### Send Direct Message

```typescript
const { sendMessage } = useMessaging(userAddress);

await sendMessage(
  recipientAddress,
  'Hello!',
  'xmtp' // or 'push' or 'none'
);
```

### Gate a Conversation

```typescript
const { setMessagePermissions } = useMessagePermissions(userAddress);

await setMessagePermissions(conversationId, {
  badgeId: 'vip-badge-id',
  requiresVerification: true,
  minFollowerCount: 10,
  permissionType: 'custom',
});
```

### Send Announcement

```typescript
const { sendBroadcast } = useBroadcasts(userAddress);

await sendBroadcast('Important Update', 'Check out our new features!', {
  targetBadgeId: 'dao-member',
  isPinned: true,
});
```

### React to Message

```typescript
const { addReaction } = useMessaging(userAddress);

await addReaction(messageId, '👍');
```

## API Cheatsheet

### Get Conversations

```typescript
GET /api/messages?address=0x...&action=conversations
```

### Send Message

```typescript
POST /api/messages
{
  userAddress: "0x...",
  action: "send",
  toAddress: "0x...",
  content: "Hello!",
  encryptionType: "xmtp"
}
```

### Set Badge Gate

```typescript
POST /api/messages
{
  userAddress: "0x...",
  action: "setPermissions",
  conversationId: "uuid",
  badgeId: "uuid",
  permissionType: "badge_gated"
}
```

### Send Broadcast

```typescript
POST /api/messages
{
  userAddress: "0x...",
  action: "broadcast",
  title: "Title",
  content: "Content",
  targetBadgeId: "uuid",
  isPinned: true
}
```

### Block User

```typescript
POST /api/messages
{
  userAddress: "0x...",
  action: "block",
  blockedAddress: "0x...",
  reason: "Spam"
}
```

## Hooks Overview

| Hook                      | Purpose                                     |
| ------------------------- | ------------------------------------------- |
| `useMessaging()`          | Send/receive messages, manage conversations |
| `useMessagePermissions()` | Configure badge-gating                      |
| `useBroadcasts()`         | Send announcements                          |
| `useXMTP()`               | Initialize XMTP encryption                  |
| `usePushProtocol()`       | Initialize Push notifications               |

## Components Overview

| Component               | Purpose                         |
| ----------------------- | ------------------------------- |
| `MessagesList`          | Display messages with reactions |
| `MessageInput`          | Compose messages                |
| `MessageThread`         | Full conversation UI            |
| `ConversationsList`     | List all conversations          |
| `PermissionGate`        | Show access requirements        |
| `BroadcastAnnouncement` | Display announcements           |

## Troubleshooting

### Messages not appearing?

- Check database migration ran successfully
- Verify RLS policies are enabled
- Check conversation ID exists

### Encryption not working?

- Verify XMTP package installed
- Check environment variable `NEXT_PUBLIC_XMTP_ENV=production`
- Ensure wallet supports XMTP

### Badge gate not enforcing?

- Check permission type is set to 'badge_gated'
- Verify user doesn't have required badge
- Check database permission record exists

## Next Steps

1. ✅ **Database migration** - Done if following setup
2. ✅ **Dependencies installed** - Run `npm install`
3. ⏳ **Create message page** - Copy the example above
4. ⏳ **Add message button** - Add to profile cards
5. ⏳ **Configure permissions** - Set up badge gates
6. ⏳ **Test with team** - Send messages between users

## Advanced Features

- [Badge-gated messaging](./MESSAGING.md#badge-gated-messaging)
- [XMTP encryption setup](./MESSAGING.md#xmtp-integration)
- [Push Protocol notifications](./MESSAGING.md#push-protocol-integration)
- [Broadcast announcements](./MESSAGING.md#announcements--broadcasts)
- [Custom permissions](./MESSAGING.md#custom-permission-logic)

## Support

- 📖 Full docs: [MESSAGING.md](./MESSAGING.md)
- 💡 Examples: [MESSAGING_EXAMPLES.tsx](./MESSAGING_EXAMPLES.tsx)
- 📋 Implementation: [MESSAGING_IMPLEMENTATION.md](./MESSAGING_IMPLEMENTATION.md)

---

**Ready to go!** Your messaging system is ready to deploy. 🚀
