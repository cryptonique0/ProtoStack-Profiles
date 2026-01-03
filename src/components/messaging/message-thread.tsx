import type { Conversation, Message } from '@/types';
import { ConversationItem, MessageInput, MessagesList, PermissionGate } from './index';

interface MessageThreadProps {
  conversation: Conversation;
  messages: Message[];
  currentUserAddress: string;
  isLoading: boolean;
  hasPermission: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onLoadMore?: () => Promise<void>;
  onReaction?: (messageId: string, emoji: string) => Promise<void>;
  permissions?: any;
  userStats?: any;
}

export function MessageThread({
  conversation,
  messages,
  currentUserAddress,
  isLoading,
  hasPermission,
  onSendMessage,
  onLoadMore,
  onReaction,
  permissions,
  userStats,
}: MessageThreadProps) {
  const otherParticipant =
    conversation.participant1 === currentUserAddress
      ? conversation.participant2
      : conversation.participant1;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="font-semibold">{otherParticipant}</h2>
        <p className="text-sm text-gray-600">
          {conversation.isActive ? 'Active' : 'Inactive'} conversation
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {/* Permission Gate */}
          {!hasPermission && (
            <PermissionGate
              hasPermission={hasPermission}
              permissionType={permissions?.permissionType}
              minFollowers={permissions?.minFollowerCount}
              minBadgePoints={permissions?.minBadgePoints}
              requiresVerification={permissions?.requiresVerification}
              requiresPremium={permissions?.requiresPremium}
              userStats={userStats}
            />
          )}

          {/* Messages */}
          <MessagesList
            messages={messages}
            currentUserAddress={currentUserAddress}
            onReactionClick={onReaction}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Input */}
      {hasPermission ? (
        <div className="border-t p-4">
          <MessageInput onSend={onSendMessage} />
        </div>
      ) : (
        <div className="border-t bg-gray-50 p-4 text-center text-sm text-gray-600">
          You don't have permission to message in this conversation
        </div>
      )}
    </div>
  );
}

interface ConversationsListProps {
  conversations: Conversation[];
  selectedId?: string;
  isLoading: boolean;
  onSelectConversation: (conversation: Conversation) => void;
  searchQuery?: string;
}

export function ConversationsList({
  conversations,
  selectedId,
  isLoading,
  onSelectConversation,
  searchQuery = '',
}: ConversationsListProps) {
  const filtered = conversations.filter((conv) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.participant1.toLowerCase().includes(searchLower) ||
      conv.participant2.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h2 className="mb-2 font-semibold">Messages</h2>
        <input
          type="text"
          placeholder="Search conversations..."
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue={searchQuery}
        />
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-600">
            {conversations.length === 0 ? 'No conversations yet' : 'No matching conversations'}
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {filtered.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={`cursor-pointer rounded transition ${
                  selectedId === conv.id ? 'border-blue-300 bg-blue-100' : ''
                }`}
              >
                <ConversationItem
                  id={conv.id}
                  participantName={
                    conv.participant1 === conv.participant2 ? 'Self' : conv.participant2
                  }
                  participantAddress={conv.participant2}
                  isActive={conv.isActive}
                  lastMessageAt={conv.lastMessageAt}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
