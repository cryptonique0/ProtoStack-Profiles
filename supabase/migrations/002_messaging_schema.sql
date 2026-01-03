-- ProtoStack Messaging Schema
-- Adds messaging tables and functionality

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1 TEXT NOT NULL,
  participant_2 TEXT NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_1, participant_2),
  CHECK (participant_1 < participant_2) -- Ensure consistent ordering
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS conversations_participant_1_idx ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS conversations_participant_2_idx ON conversations(participant_2);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations(updated_at DESC);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_address TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'announcement')),
  message_type TEXT DEFAULT 'direct' CHECK (message_type IN ('direct', 'group', 'announcement')),
  is_encrypted BOOLEAN DEFAULT FALSE,
  encryption_type TEXT DEFAULT 'none' CHECK (encryption_type IN ('none', 'xmtp', 'push')),
  xmtp_message_id TEXT,
  push_message_id TEXT,
  on_chain_tx_hash TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages(sender_address);
CREATE INDEX IF NOT EXISTS messages_is_read_idx ON messages(is_read);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);

-- ============================================
-- MESSAGE REACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  reaction_emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_address, reaction_emoji)
);

-- Indexes for message reactions
CREATE INDEX IF NOT EXISTS message_reactions_message_idx ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS message_reactions_user_idx ON message_reactions(user_address);

-- ============================================
-- MESSAGE PERMISSIONS TABLE (Badge-Gated Access)
-- ============================================
CREATE TABLE IF NOT EXISTS message_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  min_follower_count INTEGER DEFAULT 0,
  min_badge_points INTEGER DEFAULT 0,
  requires_verification BOOLEAN DEFAULT FALSE,
  requires_premium BOOLEAN DEFAULT FALSE,
  permission_type TEXT DEFAULT 'none' CHECK (permission_type IN ('none', 'badge_gated', 'follower_gated', 'premium_only', 'custom')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for message permissions
CREATE INDEX IF NOT EXISTS message_permissions_conversation_idx ON message_permissions(conversation_id);
CREATE INDEX IF NOT EXISTS message_permissions_badge_idx ON message_permissions(badge_id);

-- ============================================
-- BLOCKED USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_address TEXT NOT NULL,
  blocked_address TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_address, blocked_address)
);

-- Indexes for blocked users
CREATE INDEX IF NOT EXISTS blocked_users_blocker_idx ON blocked_users(blocker_address);
CREATE INDEX IF NOT EXISTS blocked_users_blocked_idx ON blocked_users(blocked_address);

-- ============================================
-- MESSAGE BROADCASTS TABLE (Announcements)
-- ============================================
CREATE TABLE IF NOT EXISTS message_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_address TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_badge_id UUID REFERENCES badges(id) ON DELETE SET NULL,
  target_follower_count_min INTEGER DEFAULT 0,
  recipient_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for message broadcasts
CREATE INDEX IF NOT EXISTS message_broadcasts_sender_idx ON message_broadcasts(sender_address);
CREATE INDEX IF NOT EXISTS message_broadcasts_created_at_idx ON message_broadcasts(created_at DESC);

-- ============================================
-- BROADCAST RECIPIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID NOT NULL REFERENCES message_broadcasts(id) ON DELETE CASCADE,
  recipient_address TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(broadcast_id, recipient_address)
);

-- Indexes for broadcast recipients
CREATE INDEX IF NOT EXISTS broadcast_recipients_broadcast_idx ON broadcast_recipients(broadcast_id);
CREATE INDEX IF NOT EXISTS broadcast_recipients_recipient_idx ON broadcast_recipients(recipient_address);

-- ============================================
-- XMTP INTEGRATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS xmtp_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL UNIQUE,
  xmtp_installation_id TEXT NOT NULL UNIQUE,
  xmtp_account_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for XMTP connections
CREATE INDEX IF NOT EXISTS xmtp_connections_user_idx ON xmtp_connections(user_address);

-- ============================================
-- PUSH PROTOCOL INTEGRATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS push_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL UNIQUE,
  push_user_id TEXT NOT NULL UNIQUE,
  push_channel TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  notification_settings JSONB DEFAULT '{"on_message": true, "on_broadcast": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Push connections
CREATE INDEX IF NOT EXISTS push_connections_user_idx ON push_connections(user_address);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

-- Trigger for conversations updated_at
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for messages updated_at
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for XMTP connections updated_at
DROP TRIGGER IF EXISTS update_xmtp_connections_updated_at ON xmtp_connections;
CREATE TRIGGER update_xmtp_connections_updated_at
  BEFORE UPDATE ON xmtp_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for Push connections updated_at
DROP TRIGGER IF EXISTS update_push_connections_updated_at ON push_connections;
CREATE TRIGGER update_push_connections_updated_at
  BEFORE UPDATE ON push_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get conversation for two participants
CREATE OR REPLACE FUNCTION get_or_create_conversation(addr1 TEXT, addr2 TEXT)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
  sorted_addr1 TEXT;
  sorted_addr2 TEXT;
BEGIN
  -- Ensure consistent ordering
  IF addr1 < addr2 THEN
    sorted_addr1 := addr1;
    sorted_addr2 := addr2;
  ELSE
    sorted_addr1 := addr2;
    sorted_addr2 := addr1;
  END IF;

  -- Try to get existing conversation
  SELECT id INTO conv_id FROM conversations
  WHERE participant_1 = sorted_addr1 AND participant_2 = sorted_addr2;

  -- Create if doesn't exist
  IF conv_id IS NULL THEN
    INSERT INTO conversations (participant_1, participant_2)
    VALUES (sorted_addr1, sorted_addr2)
    RETURNING id INTO conv_id;
  END IF;

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql;

-- Check message permissions for user
CREATE OR REPLACE FUNCTION can_send_message(sender_addr TEXT, conv_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  perm RECORD;
  user_badges_count INTEGER;
  user_followers_count INTEGER;
  total_badge_points INTEGER;
  is_verified BOOLEAN;
  is_premium BOOLEAN;
BEGIN
  -- Get conversation permissions
  SELECT * INTO perm FROM message_permissions WHERE conversation_id = conv_id LIMIT 1;

  -- No permissions set, allow
  IF perm IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check if premium required
  IF perm.requires_premium THEN
    SELECT is_premium INTO is_premium FROM profiles WHERE address = sender_addr;
    IF NOT is_premium THEN RETURN FALSE; END IF;
  END IF;

  -- Check if verification required
  IF perm.requires_verification THEN
    SELECT is_verified INTO is_verified FROM profiles WHERE address = sender_addr;
    IF NOT is_verified THEN RETURN FALSE; END IF;
  END IF;

  -- Check follower count
  IF perm.min_follower_count > 0 THEN
    SELECT COUNT(*)::INTEGER INTO user_followers_count FROM followers WHERE following_address = sender_addr;
    IF user_followers_count < perm.min_follower_count THEN RETURN FALSE; END IF;
  END IF;

  -- Check badge points
  IF perm.min_badge_points > 0 THEN
    SELECT COALESCE(SUM(b.points), 0)::INTEGER INTO total_badge_points
    FROM user_badges ub
    JOIN badges b ON ub.badge_id = b.id
    WHERE ub.user_address = sender_addr;
    IF total_badge_points < perm.min_badge_points THEN RETURN FALSE; END IF;
  END IF;

  -- Check specific badge
  IF perm.badge_id IS NOT NULL THEN
    SELECT COUNT(*)::INTEGER INTO user_badges_count FROM user_badges
    WHERE user_address = sender_addr AND badge_id = perm.badge_id;
    IF user_badges_count = 0 THEN RETURN FALSE; END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES FOR MESSAGING
-- ============================================

-- Enable RLS on messaging tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE xmtp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_connections ENABLE ROW LEVEL SECURITY;

-- Conversations: users can see their own conversations
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (auth.jwt() ->> 'sub' IN (participant_1, participant_2));

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' IN (participant_1, participant_2));

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (auth.jwt() ->> 'sub' IN (participant_1, participant_2));

-- Messages: users can see messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE auth.jwt() ->> 'sub' IN (participant_1, participant_2)
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE auth.jwt() ->> 'sub' IN (participant_1, participant_2)
    )
    AND sender_address = auth.jwt() ->> 'sub'
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (sender_address = auth.jwt() ->> 'sub');

-- Message reactions: viewable in conversations users are part of
CREATE POLICY "Users can view reactions in their conversations"
  ON message_reactions FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM messages m
      WHERE m.conversation_id IN (
        SELECT id FROM conversations
        WHERE auth.jwt() ->> 'sub' IN (participant_1, participant_2)
      )
    )
  );

CREATE POLICY "Users can add reactions to messages"
  ON message_reactions FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT id FROM messages m
      WHERE m.conversation_id IN (
        SELECT id FROM conversations
        WHERE auth.jwt() ->> 'sub' IN (participant_1, participant_2)
      )
    )
  );

-- Blocked users
CREATE POLICY "Users can view blocked users"
  ON blocked_users FOR SELECT
  USING (blocker_address = auth.jwt() ->> 'sub');

CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  WITH CHECK (blocker_address = auth.jwt() ->> 'sub');

CREATE POLICY "Users can unblock"
  ON blocked_users FOR DELETE
  USING (blocker_address = auth.jwt() ->> 'sub');

-- Broadcasts
CREATE POLICY "Broadcasts are viewable by recipients"
  ON message_broadcasts FOR SELECT
  USING (sender_address = auth.jwt() ->> 'sub' OR id IN (
    SELECT broadcast_id FROM broadcast_recipients WHERE recipient_address = auth.jwt() ->> 'sub'
  ));

-- XMTP connections
CREATE POLICY "Users can view their XMTP connection"
  ON xmtp_connections FOR SELECT
  USING (user_address = auth.jwt() ->> 'sub');

CREATE POLICY "Users can create XMTP connection"
  ON xmtp_connections FOR INSERT
  WITH CHECK (user_address = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their XMTP connection"
  ON xmtp_connections FOR UPDATE
  USING (user_address = auth.jwt() ->> 'sub');

-- Push connections
CREATE POLICY "Users can view their Push connection"
  ON push_connections FOR SELECT
  USING (user_address = auth.jwt() ->> 'sub');

CREATE POLICY "Users can create Push connection"
  ON push_connections FOR INSERT
  WITH CHECK (user_address = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their Push connection"
  ON push_connections FOR UPDATE
  USING (user_address = auth.jwt() ->> 'sub');
