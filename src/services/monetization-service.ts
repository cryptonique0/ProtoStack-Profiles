import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * MonetizationService
 * Handles subscriptions, tipping, premium themes, and creator monetization
 */
export class MonetizationService {
  private supabase: SupabaseClient;
  private subscriptionNFTAddress: string;
  private tippingContractAddress: string;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    // These would be set from environment variables
    this.subscriptionNFTAddress = process.env.NEXT_PUBLIC_SUBSCRIPTION_NFT_ADDRESS || '';
    this.tippingContractAddress = process.env.NEXT_PUBLIC_TIPPING_CONTRACT_ADDRESS || '';
  }

  // =============================================
  // SUBSCRIPTION METHODS
  // =============================================

  /**
   * Set creator's subscription configuration
   */
  async setSubscriptionConfig(config: {
    creatorAddress: string;
    subscriptionPrice: string; // in wei
    isAcceptingSubscribers: boolean;
    benefits?: string[];
  }) {
    const { data, error } = await this.supabase
      .from('subscription_configs')
      .upsert({
        creator_address: config.creatorAddress,
        subscription_price: config.subscriptionPrice,
        is_accepting_subscribers: config.isAcceptingSubscribers,
        benefits: config.benefits || [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get creator's subscription configuration
   */
  async getSubscriptionConfig(creatorAddress: string) {
    const { data, error } = await this.supabase
      .from('subscription_configs')
      .select('*')
      .eq('creator_address', creatorAddress)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Record a new subscription in database (called after on-chain transaction)
   */
  async recordSubscription(subscription: {
    tokenId: number;
    creatorAddress: string;
    subscriberAddress: string;
    pricePerMonth: string;
    expiresAt: Date;
    transactionHash: string;
  }) {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .insert({
        token_id: subscription.tokenId,
        creator_address: subscription.creatorAddress,
        subscriber_address: subscription.subscriberAddress,
        price_per_month: subscription.pricePerMonth,
        expires_at: subscription.expiresAt.toISOString(),
        transaction_hash: subscription.transactionHash,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Update subscription config stats
    await this.supabase.rpc('increment_subscription_stats', {
      p_creator_address: subscription.creatorAddress,
      p_amount: subscription.pricePerMonth,
    });

    return data;
  }

  /**
   * Get user's subscriptions
   */
  async getUserSubscriptions(userAddress: string) {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('subscriber_address', userAddress)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get creator's subscribers
   */
  async getCreatorSubscribers(creatorAddress: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('creator_address', creatorAddress)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Check if user has active subscription to creator
   */
  async hasActiveSubscription(subscriberAddress: string, creatorAddress: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('has_active_subscription', {
      p_subscriber_address: subscriberAddress,
      p_creator_address: creatorAddress,
    });

    if (error) throw error;
    return data as boolean;
  }

  /**
   * Update subscription status (e.g., mark as expired)
   */
  async updateSubscriptionStatus(tokenId: number, isActive: boolean) {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .update({ is_active: isActive })
      .eq('token_id', tokenId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =============================================
  // TIPPING METHODS
  // =============================================

  /**
   * Record a tip in database (called after on-chain transaction)
   */
  async recordTip(tip: {
    fromAddress: string;
    toAddress: string;
    amount: string; // in wei
    tokenType?: string;
    message?: string;
    transactionHash: string;
    platformFee?: string;
  }) {
    const { data, error } = await this.supabase
      .from('tips')
      .insert({
        from_address: tip.fromAddress,
        to_address: tip.toAddress,
        amount: tip.amount,
        token_type: tip.tokenType || 'ETH',
        message: tip.message,
        transaction_hash: tip.transactionHash,
        platform_fee: tip.platformFee || '0',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get tips received by creator
   */
  async getTipsReceived(creatorAddress: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('tips')
      .select('*')
      .eq('to_address', creatorAddress)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get tips sent by user
   */
  async getTipsSent(userAddress: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('tips')
      .select('*')
      .eq('from_address', userAddress)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Set creator's fee split configuration
   */
  async setFeeSplitConfig(config: {
    creatorAddress: string;
    recipients: Array<{ address: string; percentage: number }>;
  }) {
    const { data, error } = await this.supabase
      .from('tip_fee_splits')
      .upsert({
        creator_address: config.creatorAddress,
        recipients: config.recipients,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get creator's fee split configuration
   */
  async getFeeSplitConfig(creatorAddress: string) {
    const { data, error } = await this.supabase
      .from('tip_fee_splits')
      .select('*')
      .eq('creator_address', creatorAddress)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Get top supporters for a creator
   */
  async getTopSupporters(creatorAddress: string, limit = 10) {
    const { data, error } = await this.supabase.rpc('get_top_supporters', {
      p_creator_address: creatorAddress,
      p_limit: limit,
    });

    if (error) throw error;
    return data || [];
  }

  // =============================================
  // PREMIUM THEMES METHODS
  // =============================================

  /**
   * Create a premium theme
   */
  async createPremiumTheme(theme: {
    name: string;
    description?: string;
    previewImageUrl?: string;
    cssCode: string;
    gatingNftAddress?: string;
    gatingBadgeId?: string;
    price?: string;
    createdBy: string;
  }) {
    const { data, error } = await this.supabase
      .from('premium_themes')
      .insert({
        name: theme.name,
        description: theme.description,
        preview_image_url: theme.previewImageUrl,
        css_code: theme.cssCode,
        gating_nft_address: theme.gatingNftAddress,
        gating_badge_id: theme.gatingBadgeId,
        price: theme.price,
        created_by: theme.createdBy,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all active premium themes
   */
  async getPremiumThemes(limit = 50) {
    const { data, error } = await this.supabase
      .from('premium_themes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get theme by ID
   */
  async getPremiumTheme(themeId: string) {
    const { data, error } = await this.supabase
      .from('premium_themes')
      .select('*')
      .eq('id', themeId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Unlock a theme for user
   */
  async unlockTheme(userAddress: string, themeId: string, transactionHash?: string) {
    const { data, error } = await this.supabase
      .from('user_themes')
      .insert({
        user_address: userAddress,
        theme_id: themeId,
        transaction_hash: transactionHash,
      })
      .select()
      .single();

    if (error) throw error;

    // Increment theme usage count
    await this.supabase.rpc('increment', {
      table_name: 'premium_themes',
      row_id: themeId,
      column_name: 'usage_count',
    });

    return data;
  }

  /**
   * Set active theme for user
   */
  async setActiveTheme(userAddress: string, themeId: string) {
    // First, deactivate all themes for user
    await this.supabase
      .from('user_themes')
      .update({ is_active: false })
      .eq('user_address', userAddress);

    // Then activate the selected theme
    const { data, error } = await this.supabase
      .from('user_themes')
      .update({ is_active: true })
      .eq('user_address', userAddress)
      .eq('theme_id', themeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user's unlocked themes
   */
  async getUserThemes(userAddress: string) {
    const { data, error } = await this.supabase
      .from('user_themes')
      .select('*, premium_themes(*)')
      .eq('user_address', userAddress)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get user's active theme
   */
  async getActiveTheme(userAddress: string) {
    const { data, error } = await this.supabase
      .from('user_themes')
      .select('*, premium_themes(*)')
      .eq('user_address', userAddress)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Check if user can access a theme (owns required NFT/badge)
   */
  async canAccessTheme(userAddress: string, themeId: string): Promise<boolean> {
    const theme = await this.getPremiumTheme(themeId);
    if (!theme) return false;

    // If no gating, theme is accessible
    if (!theme.gating_nft_address && !theme.gating_badge_id) {
      return true;
    }

    // Check NFT ownership (would need to call contract)
    // This is a placeholder - implement based on your NFT checking logic
    if (theme.gating_nft_address) {
      // TODO: Check NFT balance via contract call
      return false;
    }

    // Check badge ownership
    if (theme.gating_badge_id) {
      const { data } = await this.supabase
        .from('profile_badges')
        .select('id')
        .eq('profile_address', userAddress)
        .eq('badge_id', theme.gating_badge_id)
        .single();

      return !!data;
    }

    return false;
  }

  // =============================================
  // MONETIZATION STATS METHODS
  // =============================================

  /**
   * Get creator's monetization stats
   */
  async getMonetizationStats(creatorAddress: string) {
    const { data, error } = await this.supabase
      .from('monetization_stats')
      .select('*')
      .eq('creator_address', creatorAddress)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return (
      data || {
        creator_address: creatorAddress,
        total_tips_received: '0',
        total_tips_count: 0,
        total_subscription_revenue: '0',
        total_subscribers: 0,
        total_theme_sales: '0',
        total_theme_sales_count: 0,
      }
    );
  }

  /**
   * Get top earners by tips
   */
  async getTopEarnersByTips(limit = 10) {
    const { data, error } = await this.supabase
      .from('monetization_stats')
      .select('*')
      .order('total_tips_received', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get top earners by subscribers
   */
  async getTopEarnersBySubscribers(limit = 10) {
    const { data, error } = await this.supabase
      .from('monetization_stats')
      .select('*')
      .order('total_subscribers', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}
