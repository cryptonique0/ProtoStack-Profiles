import { supabase, createServerClient } from '@/lib/supabase';
import type { Profile, ProfileInsert, ProfileUpdate } from '@/types/database.types';
import type { ProfileFormData, ProfileStats, SearchResult } from '@/types';

export class ProfileService {
  // Get profile by address
  static async getByAddress(address: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('address', address.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return data;
  }

  // Get profile by username or ENS
  static async getByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.eq.${username},ens_name.eq.${username}`)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return data;
  }

  // Create new profile
  static async create(address: string, data?: Partial<ProfileFormData>): Promise<Profile> {
    const profileData: ProfileInsert = {
      address: address.toLowerCase(),
      username: data?.username,
      display_name: data?.displayName,
      bio: data?.bio,
      website: data?.website,
      twitter: data?.twitter,
      github: data?.github,
      discord: data?.discord,
      telegram: data?.telegram,
      email: data?.email,
      location: data?.location,
      avatar_url: data?.avatarUrl,
      cover_url: data?.coverUrl,
      theme: data?.theme || 'default',
      is_public: data?.isPublic ?? true,
      show_nfts: data?.showNfts ?? true,
      show_activity: data?.showActivity ?? true,
      show_badges: data?.showBadges ?? true,
    };

    const { data: profile, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return profile;
  }

  // Update profile
  static async update(address: string, data: Partial<ProfileFormData>): Promise<Profile> {
    const updateData: ProfileUpdate = {
      username: data.username,
      display_name: data.displayName,
      bio: data.bio,
      website: data.website,
      twitter: data.twitter,
      github: data.github,
      discord: data.discord,
      telegram: data.telegram,
      email: data.email,
      location: data.location,
      avatar_url: data.avatarUrl,
      cover_url: data.coverUrl,
      theme: data.theme,
      is_public: data.isPublic,
      show_nfts: data.showNfts,
      show_activity: data.showActivity,
      show_badges: data.showBadges,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof ProfileUpdate] === undefined) {
        delete updateData[key as keyof ProfileUpdate];
      }
    });

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('address', address.toLowerCase())
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return profile;
  }

  // Update ENS name
  static async updateENS(address: string, ensName: string | null): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ ens_name: ensName })
      .eq('address', address.toLowerCase());

    if (error) {
      throw new Error(error.message);
    }
  }

  // Set NFT avatar
  static async setNFTAvatar(
    address: string,
    tokenId: string,
    contractAddress: string,
    imageUrl: string
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_nft_token_id: tokenId,
        avatar_nft_contract: contractAddress,
        avatar_url: imageUrl,
      })
      .eq('address', address.toLowerCase());

    if (error) {
      throw new Error(error.message);
    }
  }

  // Search profiles
  static async search(query: string, limit = 20): Promise<SearchResult[]> {
    const { data, error } = await supabase.rpc('search_profiles', {
      search_query: query,
      limit_count: limit,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.map((p) => ({
      id: p.id,
      address: p.address,
      ensName: p.ens_name,
      username: p.username,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
      isVerified: p.is_verified,
    }));
  }

  // Get profile stats
  static async getStats(address: string): Promise<ProfileStats> {
    const [followers, following, badges, activities] = await Promise.all([
      supabase.rpc('get_follower_count', { profile_address: address.toLowerCase() }),
      supabase.rpc('get_following_count', { profile_address: address.toLowerCase() }),
      supabase
        .from('user_badges')
        .select('*', { count: 'exact', head: true })
        .eq('address', address.toLowerCase()),
      supabase
        .from('activity')
        .select('*', { count: 'exact', head: true })
        .eq('address', address.toLowerCase()),
    ]);

    // Calculate points from badges
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id, badges(points)')
      .eq('address', address.toLowerCase());

    const totalPoints = userBadges?.reduce((sum, ub) => {
      const badge = ub.badges as unknown as { points: number };
      return sum + (badge?.points || 0);
    }, 0) || 0;

    return {
      followers: followers.data || 0,
      following: following.data || 0,
      badges: badges.count || 0,
      points: totalPoints,
      nfts: 0, // Will be fetched from blockchain
      activities: activities.count || 0,
    };
  }

  // Get explore/discover profiles
  static async getExploreProfiles(options: {
    limit?: number;
    offset?: number;
    filter?: 'all' | 'verified' | 'new';
  }): Promise<Profile[]> {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (options.filter === 'verified') {
      query = query.eq('is_verified', true);
    } else if (options.filter === 'new') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte('created_at', weekAgo.toISOString());
    }

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

  // Check if username is available
  static async isUsernameAvailable(username: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    if (error && error.code === 'PGRST116') {
      return true; // Not found = available
    }

    return !data;
  }

  // Verify profile (admin only)
  static async verifyProfile(address: string): Promise<void> {
    const serverClient = createServerClient();
    
    const { error } = await serverClient
      .from('profiles')
      .update({ is_verified: true })
      .eq('address', address.toLowerCase());

    if (error) {
      throw new Error(error.message);
    }
  }
}
