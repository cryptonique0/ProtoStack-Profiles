import { supabase } from '@/lib/supabase';
import type { Follower } from '@/types/database.types';

export class FollowerService {
  // Follow a profile
  static async follow(followerAddress: string, followingAddress: string): Promise<void> {
    const { error } = await supabase.from('followers').insert({
      follower_address: followerAddress.toLowerCase(),
      following_address: followingAddress.toLowerCase(),
    });

    if (error) {
      if (error.code === '23505') {
        throw new Error('Already following this profile');
      }
      throw new Error(error.message);
    }

    // Create activity record
    await supabase.from('activity').insert({
      address: followerAddress.toLowerCase(),
      type: 'followed',
      title: 'Followed a profile',
      metadata: { following: followingAddress.toLowerCase() },
    });

    // Create notification for the followed user
    await supabase.from('notifications').insert({
      address: followingAddress.toLowerCase(),
      type: 'new_follower',
      title: 'New Follower',
      message: `${followerAddress.slice(0, 6)}...${followerAddress.slice(-4)} started following you`,
      data: { follower: followerAddress.toLowerCase() },
    });
  }

  // Unfollow a profile
  static async unfollow(followerAddress: string, followingAddress: string): Promise<void> {
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_address', followerAddress.toLowerCase())
      .eq('following_address', followingAddress.toLowerCase());

    if (error) {
      throw new Error(error.message);
    }

    // Create activity record
    await supabase.from('activity').insert({
      address: followerAddress.toLowerCase(),
      type: 'unfollowed',
      title: 'Unfollowed a profile',
      metadata: { unfollowed: followingAddress.toLowerCase() },
    });
  }

  // Check if following
  static async isFollowing(
    followerAddress: string,
    followingAddress: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_address', followerAddress.toLowerCase())
      .eq('following_address', followingAddress.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return !!data;
  }

  // Get followers
  static async getFollowers(
    address: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ address: string; createdAt: string }[]> {
    let query = supabase
      .from('followers')
      .select('follower_address, created_at')
      .eq('following_address', address.toLowerCase())
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

    return data.map((f) => ({
      address: f.follower_address,
      createdAt: f.created_at,
    }));
  }

  // Get following
  static async getFollowing(
    address: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ address: string; createdAt: string }[]> {
    let query = supabase
      .from('followers')
      .select('following_address, created_at')
      .eq('follower_address', address.toLowerCase())
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

    return data.map((f) => ({
      address: f.following_address,
      createdAt: f.created_at,
    }));
  }

  // Get follower count
  static async getFollowerCount(address: string): Promise<number> {
    const { count, error } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_address', address.toLowerCase());

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  }

  // Get following count
  static async getFollowingCount(address: string): Promise<number> {
    const { count, error } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_address', address.toLowerCase());

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  }

  // Get mutual followers
  static async getMutualFollowers(
    address1: string,
    address2: string
  ): Promise<string[]> {
    const [followers1, followers2] = await Promise.all([
      this.getFollowers(address1, { limit: 1000 }),
      this.getFollowers(address2, { limit: 1000 }),
    ]);

    const set1 = new Set(followers1.map((f) => f.address));
    const mutuals = followers2.filter((f) => set1.has(f.address));

    return mutuals.map((f) => f.address);
  }
}
