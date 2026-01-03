-- ProtoStack Circles/Communities Schema
-- Mini-DAOs, groups, and communities with gating

-- ============================================
-- CIRCLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  description TEXT,
  image_url TEXT,
  banner_url TEXT,
  creator_address TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('dao', 'community', 'project', 'social', 'professional', 'gaming', 'general')),
  is_public BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  member_count INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for circles
CREATE INDEX IF NOT EXISTS circles_creator_idx ON circles(creator_address);
CREATE INDEX IF NOT EXISTS circles_slug_idx ON circles(slug);
CREATE INDEX IF NOT EXISTS circles_category_idx ON circles(category);
CREATE INDEX IF NOT EXISTS circles_is_public_idx ON circles(is_public);
CREATE INDEX IF NOT EXISTS circles_created_at_idx ON circles(created_at DESC);

-- ============================================
-- CIRCLE MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS circle_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  member_address TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  UNIQUE(circle_id, member_address)
);

-- Indexes for circle members
CREATE INDEX IF NOT EXISTS circle_members_circle_idx ON circle_members(circle_id);
CREATE INDEX IF NOT EXISTS circle_members_address_idx ON circle_members(member_address);
CREATE INDEX IF NOT EXISTS circle_members_role_idx ON circle_members(role);

-- ============================================
-- CIRCLE GATING RULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS circle_gating_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('badge', 'nft', 'follower_count', 'badge_points', 'token_balance', 'verification', 'invite_only')),
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  nft_contract TEXT,
  min_follower_count INTEGER DEFAULT 0,
  min_badge_points INTEGER DEFAULT 0,
  token_address TEXT,
  min_token_balance TEXT DEFAULT '0',
  requires_verification BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for gating rules
CREATE INDEX IF NOT EXISTS circle_gating_rules_circle_idx ON circle_gating_rules(circle_id);
CREATE INDEX IF NOT EXISTS circle_gating_rules_type_idx ON circle_gating_rules(rule_type);
CREATE INDEX IF NOT EXISTS circle_gating_rules_badge_idx ON circle_gating_rules(badge_id);

-- ============================================
-- CIRCLE INVITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS circle_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  invited_by TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  invited_address TEXT,
  used_by TEXT,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for invites
CREATE INDEX IF NOT EXISTS circle_invites_circle_idx ON circle_invites(circle_id);
CREATE INDEX IF NOT EXISTS circle_invites_code_idx ON circle_invites(invite_code);
CREATE INDEX IF NOT EXISTS circle_invites_invited_address_idx ON circle_invites(invited_address);

-- ============================================
-- CIRCLE ACTIVITY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS circle_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('joined', 'posted', 'commented', 'reacted', 'created_proposal', 'voted', 'shared', 'left')),
  title TEXT NOT NULL,
  description TEXT,
  content_id UUID,
  content_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for circle activity
CREATE INDEX IF NOT EXISTS circle_activity_circle_idx ON circle_activity(circle_id);
CREATE INDEX IF NOT EXISTS circle_activity_user_idx ON circle_activity(user_address);
CREATE INDEX IF NOT EXISTS circle_activity_type_idx ON circle_activity(type);
CREATE INDEX IF NOT EXISTS circle_activity_created_at_idx ON circle_activity(created_at DESC);

-- ============================================
-- CIRCLE POSTS/CONTENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS circle_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  author_address TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT FALSE,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for circle posts
CREATE INDEX IF NOT EXISTS circle_posts_circle_idx ON circle_posts(circle_id);
CREATE INDEX IF NOT EXISTS circle_posts_author_idx ON circle_posts(author_address);
CREATE INDEX IF NOT EXISTS circle_posts_is_pinned_idx ON circle_posts(is_pinned);
CREATE INDEX IF NOT EXISTS circle_posts_created_at_idx ON circle_posts(created_at DESC);

-- ============================================
-- CIRCLE POST INTERACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS circle_post_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES circle_posts(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'dislike', 'share')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_address, interaction_type)
);

-- Indexes for post interactions
CREATE INDEX IF NOT EXISTS circle_post_interactions_post_idx ON circle_post_interactions(post_id);
CREATE INDEX IF NOT EXISTS circle_post_interactions_user_idx ON circle_post_interactions(user_address);
CREATE INDEX IF NOT EXISTS circle_post_interactions_type_idx ON circle_post_interactions(interaction_type);

-- ============================================
-- CIRCLE COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS circle_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES circle_posts(id) ON DELETE CASCADE,
  author_address TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES circle_comments(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS circle_comments_post_idx ON circle_comments(post_id);
CREATE INDEX IF NOT EXISTS circle_comments_author_idx ON circle_comments(author_address);
CREATE INDEX IF NOT EXISTS circle_comments_parent_idx ON circle_comments(parent_comment_id);

-- ============================================
-- CIRCLE LEADERBOARD TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS circle_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  member_address TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  rank INTEGER,
  metadata JSONB DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(circle_id, member_address)
);

-- Indexes for leaderboard
CREATE INDEX IF NOT EXISTS circle_leaderboard_circle_idx ON circle_leaderboard(circle_id);
CREATE INDEX IF NOT EXISTS circle_leaderboard_member_idx ON circle_leaderboard(member_address);
CREATE INDEX IF NOT EXISTS circle_leaderboard_points_idx ON circle_leaderboard(circle_id, points DESC);
CREATE INDEX IF NOT EXISTS circle_leaderboard_rank_idx ON circle_leaderboard(circle_id, rank);

-- ============================================
-- CIRCLE TREASURY TABLE (Optional)
-- ============================================
CREATE TABLE IF NOT EXISTS circle_treasuries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE UNIQUE,
  treasury_address TEXT NOT NULL,
  token_address TEXT,
  token_balance TEXT DEFAULT '0',
  total_distributed TEXT DEFAULT '0',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for treasuries
CREATE INDEX IF NOT EXISTS circle_treasuries_circle_idx ON circle_treasuries(circle_id);

-- ============================================
-- CIRCLE ROLES/PERMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS circle_role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  can_post BOOLEAN DEFAULT FALSE,
  can_comment BOOLEAN DEFAULT FALSE,
  can_invite BOOLEAN DEFAULT FALSE,
  can_moderate BOOLEAN DEFAULT FALSE,
  can_manage_treasury BOOLEAN DEFAULT FALSE,
  can_create_proposal BOOLEAN DEFAULT FALSE,
  can_vote BOOLEAN DEFAULT FALSE,
  can_manage_roles BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  UNIQUE(circle_id, role)
);

-- Indexes for role permissions
CREATE INDEX IF NOT EXISTS circle_role_permissions_circle_idx ON circle_role_permissions(circle_id);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_circles_updated_at ON circles;
CREATE TRIGGER update_circles_updated_at
  BEFORE UPDATE ON circles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_circle_posts_updated_at ON circle_posts;
CREATE TRIGGER update_circle_posts_updated_at
  BEFORE UPDATE ON circle_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_circle_comments_updated_at ON circle_comments;
CREATE TRIGGER update_circle_comments_updated_at
  BEFORE UPDATE ON circle_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_circle_treasuries_updated_at ON circle_treasuries;
CREATE TRIGGER update_circle_treasuries_updated_at
  BEFORE UPDATE ON circle_treasuries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user can access circle
CREATE OR REPLACE FUNCTION can_access_circle(user_addr TEXT, circle_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  circle_public BOOLEAN;
  is_member BOOLEAN;
  meets_gating BOOLEAN;
BEGIN
  -- Get circle public status
  SELECT is_public INTO circle_public FROM circles WHERE id = circle_uuid;

  IF circle_public THEN
    RETURN TRUE;
  END IF;

  -- Check if user is member
  SELECT EXISTS(SELECT 1 FROM circle_members WHERE circle_id = circle_uuid AND member_address = user_addr)
  INTO is_member;

  IF is_member THEN
    RETURN TRUE;
  END IF;

  -- Check gating rules (simplified - can be expanded)
  SELECT EXISTS(
    SELECT 1 FROM circle_gating_rules
    WHERE circle_id = circle_uuid
      AND is_active = TRUE
  )
  INTO meets_gating;

  RETURN NOT meets_gating; -- If no gating rules, allow access
END;
$$ LANGUAGE plpgsql;

-- Check if user can perform action in circle
CREATE OR REPLACE FUNCTION can_perform_action(user_addr TEXT, circle_uuid UUID, action TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  can_perform BOOLEAN;
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM circle_members
  WHERE circle_id = circle_uuid AND member_address = user_addr;

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check permissions based on action and role
  SELECT CASE
    WHEN action = 'post' THEN can_post
    WHEN action = 'comment' THEN can_comment
    WHEN action = 'invite' THEN can_invite
    WHEN action = 'moderate' THEN can_moderate
    WHEN action = 'manage_treasury' THEN can_manage_treasury
    WHEN action = 'create_proposal' THEN can_create_proposal
    WHEN action = 'vote' THEN can_vote
    WHEN action = 'manage_roles' THEN can_manage_roles
    ELSE FALSE
  END INTO can_perform
  FROM circle_role_permissions
  WHERE circle_id = circle_uuid AND role = user_role;

  RETURN COALESCE(can_perform, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Update leaderboard points
CREATE OR REPLACE FUNCTION update_leaderboard_points(circle_uuid UUID, member_addr TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO circle_leaderboard (circle_id, member_address, points, posts_count, comments_count)
  SELECT
    circle_uuid,
    member_addr,
    COALESCE(posts_count, 0) * 10 + COALESCE(comments_count, 0) * 5 + COALESCE(likes_received, 0),
    COALESCE(posts_count, 0),
    COALESCE(comments_count, 0),
    COALESCE(likes_received, 0)
  FROM (
    SELECT
      (SELECT COUNT(*) FROM circle_posts WHERE circle_id = circle_uuid AND author_address = member_addr) as posts_count,
      (SELECT COUNT(*) FROM circle_comments WHERE post_id IN (SELECT id FROM circle_posts WHERE circle_id = circle_uuid) AND author_address = member_addr) as comments_count,
      (SELECT COUNT(*) FROM circle_post_interactions WHERE post_id IN (SELECT id FROM circle_posts WHERE circle_id = circle_uuid AND author_address = member_addr) AND interaction_type = 'like') as likes_received
  ) stats
  ON CONFLICT (circle_id, member_address) DO UPDATE SET
    points = COALESCE(excluded.points, 0),
    posts_count = COALESCE(excluded.posts_count, 0),
    comments_count = COALESCE(excluded.comments_count, 0),
    likes_received = COALESCE(excluded.likes_received, 0),
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_gating_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_post_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_treasuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_role_permissions ENABLE ROW LEVEL SECURITY;

-- Circles: public circles viewable by all
CREATE POLICY "Public circles are viewable"
  ON circles FOR SELECT
  USING (is_public = TRUE OR creator_address = auth.jwt() ->> 'sub');

-- Circle members: members can view their circles
CREATE POLICY "Circle members can view"
  ON circle_members FOR SELECT
  USING (member_address = auth.jwt() ->> 'sub' OR circle_id IN (
    SELECT id FROM circles WHERE creator_address = auth.jwt() ->> 'sub'
  ));

-- Circle posts: viewable by members
CREATE POLICY "Circle posts viewable by members"
  ON circle_posts FOR SELECT
  USING (circle_id IN (
    SELECT id FROM circles WHERE is_public = TRUE
    UNION
    SELECT circle_id FROM circle_members WHERE member_address = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can create posts in their circles"
  ON circle_posts FOR INSERT
  WITH CHECK (circle_id IN (
    SELECT circle_id FROM circle_members WHERE member_address = auth.jwt() ->> 'sub'
  ) AND author_address = auth.jwt() ->> 'sub');

-- Circle comments
CREATE POLICY "Circle comments viewable by members"
  ON circle_comments FOR SELECT
  USING (post_id IN (
    SELECT id FROM circle_posts WHERE circle_id IN (
      SELECT id FROM circles WHERE is_public = TRUE
      UNION
      SELECT circle_id FROM circle_members WHERE member_address = auth.jwt() ->> 'sub'
    )
  ));

CREATE POLICY "Users can comment in accessible circles"
  ON circle_comments FOR INSERT
  WITH CHECK (author_address = auth.jwt() ->> 'sub');

-- Leaderboard
CREATE POLICY "Leaderboard viewable by members"
  ON circle_leaderboard FOR SELECT
  USING (circle_id IN (
    SELECT circle_id FROM circle_members WHERE member_address = auth.jwt() ->> 'sub'
    UNION
    SELECT id FROM circles WHERE is_public = TRUE
  ));
