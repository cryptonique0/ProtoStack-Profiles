import { supabase } from '@/lib/supabase';
import type { Activity } from '@/types/database.types';

export interface ActivityWithProfile extends Activity {
  profile?: {
    displayName: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
  };
}

export class ActivityService {
  // Get user's activity feed
  static async getUserActivity(
    address: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Activity[]> {
    let query = supabase
      .from('activity')
      .select('*')
      .eq('address', address.toLowerCase())
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Get global activity feed (from followed users)
  static async getFeedActivity(
    address: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<ActivityWithProfile[]> {
    // First get the list of addresses this user follows
    const { data: following } = await supabase
      .from('followers')
      .select('following_address')
      .eq('follower_address', address.toLowerCase());

    if (!following || following.length === 0) {
      return [];
    }

    const followingAddresses = following.map((f) => f.following_address);

    let query = supabase
      .from('activity')
      .select(`
        *,
        profiles!activity_address_fkey (
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .in('address', followingAddresses)
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data.map((a) => {
      const profile = a.profiles as unknown as {
        display_name: string | null;
        avatar_url: string | null;
        is_verified: boolean;
      };
      
      return {
        ...a,
        profile: profile
          ? {
              displayName: profile.display_name,
              avatarUrl: profile.avatar_url,
              isVerified: profile.is_verified,
            }
          : undefined,
      };
    });
  }

  // Create activity record
  static async createActivity(activity: {
    address: string;
    type: string;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
    txHash?: string;
    chainId?: number;
  }): Promise<Activity> {
    const { data, error } = await supabase
      .from('activity')
      .insert({
        address: activity.address.toLowerCase(),
        type: activity.type,
        title: activity.title,
        description: activity.description,
        metadata: activity.metadata || {},
        tx_hash: activity.txHash,
        chain_id: activity.chainId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Get activity by type
  static async getActivityByType(
    address: string,
    type: string,
    options: { limit?: number } = {}
  ): Promise<Activity[]> {
    let query = supabase
      .from('activity')
      .select('*')
      .eq('address', address.toLowerCase())
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Get recent global activity (for explore)
  static async getRecentActivity(limit = 20): Promise<ActivityWithProfile[]> {
    const { data, error } = await supabase
      .from('activity')
      .select(`
        *,
        profiles!activity_address_fkey (
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data.map((a) => {
      const profile = a.profiles as unknown as {
        display_name: string | null;
        avatar_url: string | null;
        is_verified: boolean;
      };
      
      return {
        ...a,
        profile: profile
          ? {
              displayName: profile.display_name,
              avatarUrl: profile.avatar_url,
              isVerified: profile.is_verified,
            }
          : undefined,
      };
    });
  }

  // Delete old activities (cleanup, admin only)
  static async cleanupOldActivities(daysOld = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { count, error } = await supabase
      .from('activity')
      .delete({ count: 'exact' })
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  }
}
