-- =============================================
-- ProtoStack Monetization Schema
-- Features: Subscriptions, Tipping, Premium Themes
-- =============================================

-- =============================================
-- 1. SUBSCRIPTIONS TABLE
-- Tracks subscription NFT metadata and status
-- =============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id BIGINT NOT NULL UNIQUE,
  creator_address TEXT NOT NULL,
  subscriber_address TEXT NOT NULL,
  price_per_month NUMERIC NOT NULL, -- in wei
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_creator ON subscriptions(creator_address);
CREATE INDEX idx_subscriptions_subscriber ON subscriptions(subscriber_address);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);
CREATE INDEX idx_subscriptions_active ON subscriptions(is_active, expires_at);

-- =============================================
-- 2. SUBSCRIPTION_CONFIGS TABLE
-- Creator subscription settings
-- =============================================

CREATE TABLE IF NOT EXISTS subscription_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_address TEXT NOT NULL UNIQUE,
  subscription_price NUMERIC NOT NULL, -- monthly price in wei
  is_accepting_subscribers BOOLEAN DEFAULT TRUE,
  total_subscribers INTEGER DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  benefits TEXT[], -- array of benefit descriptions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscription_configs_creator ON subscription_configs(creator_address);
CREATE INDEX idx_subscription_configs_accepting ON subscription_configs(is_accepting_subscribers);

-- =============================================
-- 3. TIPS TABLE
-- Track all tipping transactions
-- =============================================

CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount NUMERIC NOT NULL, -- in wei
  token_type TEXT DEFAULT 'ETH', -- ETH, USDC, etc.
  message TEXT,
  transaction_hash TEXT NOT NULL,
  platform_fee NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tips_from ON tips(from_address);
CREATE INDEX idx_tips_to ON tips(to_address);
CREATE INDEX idx_tips_created_at ON tips(created_at DESC);
CREATE INDEX idx_tips_transaction ON tips(transaction_hash);

-- =============================================
-- 4. TIP_FEE_SPLITS TABLE
-- Creator configured payment splits
-- =============================================

CREATE TABLE IF NOT EXISTS tip_fee_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_address TEXT NOT NULL UNIQUE,
  recipients JSONB NOT NULL, -- [{"address": "0x...", "percentage": 5000}]
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tip_fee_splits_creator ON tip_fee_splits(creator_address);
CREATE INDEX idx_tip_fee_splits_active ON tip_fee_splits(is_active);

-- =============================================
-- 5. PREMIUM_THEMES TABLE
-- NFT-gated premium profile themes
-- =============================================

CREATE TABLE IF NOT EXISTS premium_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  css_code TEXT,
  gating_nft_address TEXT, -- NFT contract required to unlock
  gating_badge_id UUID, -- Or badge required
  price NUMERIC, -- Optional price if purchasable
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_premium_themes_active ON premium_themes(is_active);
CREATE INDEX idx_premium_themes_creator ON premium_themes(created_by);
CREATE INDEX idx_premium_themes_nft ON premium_themes(gating_nft_address);

-- =============================================
-- 6. USER_THEMES TABLE
-- Track which users have unlocked which themes
-- =============================================

CREATE TABLE IF NOT EXISTS user_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  theme_id UUID NOT NULL REFERENCES premium_themes(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT FALSE, -- whether currently using this theme
  transaction_hash TEXT,
  UNIQUE(user_address, theme_id)
);

CREATE INDEX idx_user_themes_user ON user_themes(user_address);
CREATE INDEX idx_user_themes_theme ON user_themes(theme_id);
CREATE INDEX idx_user_themes_active ON user_themes(user_address, is_active);

-- =============================================
-- 7. MONETIZATION_STATS TABLE
-- Aggregate stats for creators
-- =============================================

CREATE TABLE IF NOT EXISTS monetization_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_address TEXT NOT NULL UNIQUE,
  total_tips_received NUMERIC DEFAULT 0,
  total_tips_count INTEGER DEFAULT 0,
  total_subscription_revenue NUMERIC DEFAULT 0,
  total_subscribers INTEGER DEFAULT 0,
  total_theme_sales NUMERIC DEFAULT 0,
  total_theme_sales_count INTEGER DEFAULT 0,
  last_tip_at TIMESTAMP WITH TIME ZONE,
  last_subscription_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_monetization_stats_creator ON monetization_stats(creator_address);
CREATE INDEX idx_monetization_stats_tips ON monetization_stats(total_tips_received DESC);
CREATE INDEX idx_monetization_stats_subscribers ON monetization_stats(total_subscribers DESC);

-- =============================================
-- 8. GASLESS_TRANSACTIONS TABLE
-- Track paymaster-sponsored transactions
-- =============================================

CREATE TABLE IF NOT EXISTS gasless_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  user_operation_hash TEXT NOT NULL UNIQUE,
  transaction_hash TEXT,
  operation_type TEXT NOT NULL, -- profile_edit, badge_mint, etc.
  gas_cost NUMERIC, -- estimated gas in wei
  paymaster_address TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_gasless_txs_user ON gasless_transactions(user_address);
CREATE INDEX idx_gasless_txs_status ON gasless_transactions(status);
CREATE INDEX idx_gasless_txs_created ON gasless_transactions(created_at DESC);
CREATE INDEX idx_gasless_txs_operation_hash ON gasless_transactions(user_operation_hash);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to update monetization stats after tip
CREATE OR REPLACE FUNCTION update_monetization_stats_on_tip()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO monetization_stats (
    creator_address,
    total_tips_received,
    total_tips_count,
    last_tip_at,
    updated_at
  ) VALUES (
    NEW.to_address,
    NEW.amount,
    1,
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (creator_address)
  DO UPDATE SET
    total_tips_received = monetization_stats.total_tips_received + NEW.amount,
    total_tips_count = monetization_stats.total_tips_count + 1,
    last_tip_at = NEW.created_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update stats on new tip
CREATE TRIGGER trigger_update_monetization_stats_on_tip
AFTER INSERT ON tips
FOR EACH ROW
EXECUTE FUNCTION update_monetization_stats_on_tip();

-- Function to update monetization stats after subscription
CREATE OR REPLACE FUNCTION update_monetization_stats_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO monetization_stats (
    creator_address,
    total_subscription_revenue,
    total_subscribers,
    last_subscription_at,
    updated_at
  ) VALUES (
    NEW.creator_address,
    NEW.price_per_month,
    1,
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (creator_address)
  DO UPDATE SET
    total_subscription_revenue = monetization_stats.total_subscription_revenue + NEW.price_per_month,
    total_subscribers = monetization_stats.total_subscribers + 1,
    last_subscription_at = NEW.created_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update stats on new subscription
CREATE TRIGGER trigger_update_monetization_stats_on_subscription
AFTER INSERT ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_monetization_stats_on_subscription();

-- Function to check if user has active subscription to creator
CREATE OR REPLACE FUNCTION has_active_subscription(
  p_subscriber_address TEXT,
  p_creator_address TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE subscriber_address = p_subscriber_address
      AND creator_address = p_creator_address
      AND is_active = TRUE
      AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get creator's top supporters by tips
CREATE OR REPLACE FUNCTION get_top_supporters(
  p_creator_address TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  supporter_address TEXT,
  total_tipped NUMERIC,
  tip_count BIGINT,
  last_tip_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tips.from_address,
    SUM(tips.amount) as total_tipped,
    COUNT(*) as tip_count,
    MAX(tips.created_at) as last_tip_at
  FROM tips
  WHERE tips.to_address = p_creator_address
  GROUP BY tips.from_address
  ORDER BY total_tipped DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE tip_fee_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE monetization_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE gasless_transactions ENABLE ROW LEVEL SECURITY;

-- Subscriptions: readable by creator and subscriber
CREATE POLICY subscriptions_select_policy ON subscriptions
  FOR SELECT USING (
    creator_address = auth.jwt() ->> 'wallet_address'
    OR subscriber_address = auth.jwt() ->> 'wallet_address'
  );

-- Subscriptions: insertable by anyone (when subscribing)
CREATE POLICY subscriptions_insert_policy ON subscriptions
  FOR INSERT WITH CHECK (true);

-- Subscription configs: readable by all, writable by owner
CREATE POLICY subscription_configs_select_policy ON subscription_configs
  FOR SELECT USING (true);

CREATE POLICY subscription_configs_insert_policy ON subscription_configs
  FOR INSERT WITH CHECK (creator_address = auth.jwt() ->> 'wallet_address');

CREATE POLICY subscription_configs_update_policy ON subscription_configs
  FOR UPDATE USING (creator_address = auth.jwt() ->> 'wallet_address');

-- Tips: readable by tipper and recipient
CREATE POLICY tips_select_policy ON tips
  FOR SELECT USING (
    from_address = auth.jwt() ->> 'wallet_address'
    OR to_address = auth.jwt() ->> 'wallet_address'
  );

-- Tips: insertable by anyone
CREATE POLICY tips_insert_policy ON tips
  FOR INSERT WITH CHECK (true);

-- Tip fee splits: readable by all, writable by owner
CREATE POLICY tip_fee_splits_select_policy ON tip_fee_splits
  FOR SELECT USING (true);

CREATE POLICY tip_fee_splits_insert_policy ON tip_fee_splits
  FOR INSERT WITH CHECK (creator_address = auth.jwt() ->> 'wallet_address');

CREATE POLICY tip_fee_splits_update_policy ON tip_fee_splits
  FOR UPDATE USING (creator_address = auth.jwt() ->> 'wallet_address');

-- Premium themes: readable by all, writable by creator
CREATE POLICY premium_themes_select_policy ON premium_themes
  FOR SELECT USING (true);

CREATE POLICY premium_themes_insert_policy ON premium_themes
  FOR INSERT WITH CHECK (created_by = auth.jwt() ->> 'wallet_address');

CREATE POLICY premium_themes_update_policy ON premium_themes
  FOR UPDATE USING (created_by = auth.jwt() ->> 'wallet_address');

-- User themes: readable by owner
CREATE POLICY user_themes_select_policy ON user_themes
  FOR SELECT USING (user_address = auth.jwt() ->> 'wallet_address');

CREATE POLICY user_themes_insert_policy ON user_themes
  FOR INSERT WITH CHECK (user_address = auth.jwt() ->> 'wallet_address');

CREATE POLICY user_themes_update_policy ON user_themes
  FOR UPDATE USING (user_address = auth.jwt() ->> 'wallet_address');

-- Monetization stats: readable by all
CREATE POLICY monetization_stats_select_policy ON monetization_stats
  FOR SELECT USING (true);

-- Gasless transactions: readable by user
CREATE POLICY gasless_transactions_select_policy ON gasless_transactions
  FOR SELECT USING (user_address = auth.jwt() ->> 'wallet_address');

CREATE POLICY gasless_transactions_insert_policy ON gasless_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY gasless_transactions_update_policy ON gasless_transactions
  FOR UPDATE USING (user_address = auth.jwt() ->> 'wallet_address');

-- =============================================
-- AUTO-UPDATE TIMESTAMPS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_configs_updated_at BEFORE UPDATE ON subscription_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tip_fee_splits_updated_at BEFORE UPDATE ON tip_fee_splits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_premium_themes_updated_at BEFORE UPDATE ON premium_themes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monetization_stats_updated_at BEFORE UPDATE ON monetization_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
