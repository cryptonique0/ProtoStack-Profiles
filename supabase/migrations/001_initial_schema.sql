-- ProtoStack Profiles Database Schema
-- Run this migration in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  ens_name TEXT,
  email TEXT,
  website TEXT,
  twitter TEXT,
  github TEXT,
  discord TEXT,
  telegram TEXT,
  location TEXT,
  nft_avatar_contract TEXT,
  nft_avatar_token_id TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  show_email BOOLEAN DEFAULT FALSE,
  show_nfts BOOLEAN DEFAULT TRUE,
  show_badges BOOLEAN DEFAULT TRUE,
  show_activity BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS profiles_address_idx ON profiles(address);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
CREATE INDEX IF NOT EXISTS profiles_ens_name_idx ON profiles(ens_name);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at DESC);

-- ============================================
-- FOLLOWERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_address TEXT NOT NULL,
  following_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_address, following_address)
);

-- Indexes for followers
CREATE INDEX IF NOT EXISTS followers_follower_idx ON followers(follower_address);
CREATE INDEX IF NOT EXISTS followers_following_idx ON followers(following_address);

-- ============================================
-- BADGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'achievement',
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  points INTEGER DEFAULT 0,
  max_supply INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for badges
CREATE INDEX IF NOT EXISTS badges_category_idx ON badges(category);
CREATE INDEX IF NOT EXISTS badges_rarity_idx ON badges(rarity);

-- ============================================
-- USER BADGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tx_hash TEXT,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_address, badge_id)
);

-- Indexes for user_badges
CREATE INDEX IF NOT EXISTS user_badges_user_idx ON user_badges(user_address);
CREATE INDEX IF NOT EXISTS user_badges_badge_idx ON user_badges(badge_id);

-- ============================================
-- ACTIVITY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  tx_hash TEXT,
  related_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for activity
CREATE INDEX IF NOT EXISTS activity_user_idx ON activity(user_address);
CREATE INDEX IF NOT EXISTS activity_type_idx ON activity(type);
CREATE INDEX IF NOT EXISTS activity_created_at_idx ON activity(created_at DESC);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_address);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(target_address TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM followers
    WHERE following_address = target_address
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get following count
CREATE OR REPLACE FUNCTION get_following_count(target_address TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM followers
    WHERE follower_address = target_address
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get badge count
CREATE OR REPLACE FUNCTION get_badge_count(target_address TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM user_badges
    WHERE user_address = target_address
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get total points
CREATE OR REPLACE FUNCTION get_total_points(target_address TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(b.points), 0)::INTEGER
    FROM user_badges ub
    JOIN badges b ON ub.badge_id = b.id
    WHERE ub.user_address = target_address
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.jwt() ->> 'sub' = address);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.jwt() ->> 'sub' = address);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = address);

-- Followers policies
CREATE POLICY "Followers are viewable by everyone"
  ON followers FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON followers FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = follower_address);

CREATE POLICY "Users can unfollow"
  ON followers FOR DELETE
  USING (auth.jwt() ->> 'sub' = follower_address);

-- Badges policies
CREATE POLICY "Badges are viewable by everyone"
  ON badges FOR SELECT
  USING (true);

-- User badges policies
CREATE POLICY "User badges are viewable by everyone"
  ON user_badges FOR SELECT
  USING (true);

-- Activity policies
CREATE POLICY "Activity is viewable by everyone"
  ON activity FOR SELECT
  USING (true);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_address);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_address);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default badges
INSERT INTO badges (name, description, image_url, category, rarity, points) VALUES
  ('Early Adopter', 'One of the first to join ProtoStack', 'https://api.protostack.dev/badges/early-adopter.png', 'achievement', 'epic', 100),
  ('Profile Creator', 'Created a profile on ProtoStack', 'https://api.protostack.dev/badges/profile-creator.png', 'achievement', 'common', 50),
  ('Verified', 'Verified identity on ProtoStack', 'https://api.protostack.dev/badges/verified.png', 'achievement', 'rare', 200),
  ('Community Builder', 'Followed 10 or more profiles', 'https://api.protostack.dev/badges/community-builder.png', 'community', 'uncommon', 75),
  ('Social Butterfly', 'Gained 100 or more followers', 'https://api.protostack.dev/badges/social-butterfly.png', 'community', 'rare', 150),
  ('NFT Collector', 'Owns 10 or more NFTs', 'https://api.protostack.dev/badges/nft-collector.png', 'achievement', 'uncommon', 75),
  ('Diamond Hands', 'Member for over 1 year', 'https://api.protostack.dev/badges/diamond-hands.png', 'achievement', 'legendary', 500),
  ('Bug Hunter', 'Reported a valid bug', 'https://api.protostack.dev/badges/bug-hunter.png', 'special', 'epic', 250),
  ('Contributor', 'Contributed to ProtoStack', 'https://api.protostack.dev/badges/contributor.png', 'special', 'legendary', 1000)
ON CONFLICT DO NOTHING;
