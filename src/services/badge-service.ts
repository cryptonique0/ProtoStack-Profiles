import { supabase } from '@/lib/supabase';
import type { Badge, UserBadge } from '@/types/database.types';

export interface BadgeWithEarned extends Badge {
  earnedAt?: string;
  txHash?: string;
}

export class BadgeService {
  // Get all available badges
  static async getAllBadges(): Promise<Badge[]> {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('points', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Get badge by ID
  static async getBadgeById(id: string): Promise<Badge | null> {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return data;
  }

  // Get badges by category
  static async getBadgesByCategory(category: string): Promise<Badge[]> {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('category', category)
      .order('points', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Get user's earned badges
  static async getUserBadges(address: string): Promise<BadgeWithEarned[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        earned_at,
        tx_hash,
        badges (*)
      `)
      .eq('address', address.toLowerCase())
      .order('earned_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data.map((ub) => {
      const badge = ub.badges as unknown as Badge;
      return {
        ...badge,
        earnedAt: ub.earned_at,
        txHash: ub.tx_hash,
      };
    });
  }

  // Award badge to user
  static async awardBadge(
    address: string,
    badgeId: string,
    txHash?: string
  ): Promise<void> {
    // Check if already has badge
    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('address', address.toLowerCase())
      .eq('badge_id', badgeId)
      .single();

    if (existing) {
      throw new Error('Badge already awarded');
    }

    const { error } = await supabase.from('user_badges').insert({
      address: address.toLowerCase(),
      badge_id: badgeId,
      tx_hash: txHash,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Get badge details for activity
    const badge = await this.getBadgeById(badgeId);

    // Create activity record
    await supabase.from('activity').insert({
      address: address.toLowerCase(),
      type: 'badge_earned',
      title: `Earned ${badge?.name} badge`,
      metadata: { badge_id: badgeId, badge_name: badge?.name },
      tx_hash: txHash,
    });

    // Create notification
    await supabase.from('notifications').insert({
      address: address.toLowerCase(),
      type: 'badge_earned',
      title: 'New Badge Earned!',
      message: `Congratulations! You earned the ${badge?.name} badge.`,
      data: { badge_id: badgeId },
    });
  }

  // Check if user has badge
  static async hasBadge(address: string, badgeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_badges')
      .select('id')
      .eq('address', address.toLowerCase())
      .eq('badge_id', badgeId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return !!data;
  }

  // Get user's total points
  static async getUserPoints(address: string): Promise<number> {
    const badges = await this.getUserBadges(address);
    return badges.reduce((sum, badge) => sum + badge.points, 0);
  }

  // Get badges count by rarity
  static async getUserBadgesByRarity(
    address: string
  ): Promise<Record<string, number>> {
    const badges = await this.getUserBadges(address);
    
    return badges.reduce(
      (acc, badge) => {
        acc[badge.rarity] = (acc[badge.rarity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  // Get recent badge earners (for display)
  static async getRecentEarners(
    badgeId: string,
    limit = 10
  ): Promise<{ address: string; earnedAt: string }[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select('address, earned_at')
      .eq('badge_id', badgeId)
      .order('earned_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data.map((ub) => ({
      address: ub.address,
      earnedAt: ub.earned_at,
    }));
  }
}
