export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          address: string;
          ens_name: string | null;
          username: string | null;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          avatar_nft_token_id: string | null;
          avatar_nft_contract: string | null;
          cover_url: string | null;
          website: string | null;
          twitter: string | null;
          github: string | null;
          discord: string | null;
          telegram: string | null;
          email: string | null;
          location: string | null;
          is_verified: boolean;
          is_premium: boolean;
          is_public: boolean;
          show_nfts: boolean;
          show_activity: boolean;
          show_badges: boolean;
          theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          address: string;
          ens_name?: string | null;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          avatar_nft_token_id?: string | null;
          avatar_nft_contract?: string | null;
          cover_url?: string | null;
          website?: string | null;
          twitter?: string | null;
          github?: string | null;
          discord?: string | null;
          telegram?: string | null;
          email?: string | null;
          location?: string | null;
          is_verified?: boolean;
          is_premium?: boolean;
          is_public?: boolean;
          show_nfts?: boolean;
          show_activity?: boolean;
          show_badges?: boolean;
          theme?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          address?: string;
          ens_name?: string | null;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          avatar_nft_token_id?: string | null;
          avatar_nft_contract?: string | null;
          cover_url?: string | null;
          website?: string | null;
          twitter?: string | null;
          github?: string | null;
          discord?: string | null;
          telegram?: string | null;
          email?: string | null;
          location?: string | null;
          is_verified?: boolean;
          is_premium?: boolean;
          is_public?: boolean;
          show_nfts?: boolean;
          show_activity?: boolean;
          show_badges?: boolean;
          theme?: string;
          updated_at?: string;
        };
      };
      followers: {
        Row: {
          id: string;
          follower_address: string;
          following_address: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_address: string;
          following_address: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_address?: string;
          following_address?: string;
          created_at?: string;
        };
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          image_url: string;
          category: string;
          rarity: string;
          points: number;
          criteria: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          image_url: string;
          category: string;
          rarity: string;
          points?: number;
          criteria?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          image_url?: string;
          category?: string;
          rarity?: string;
          points?: number;
          criteria?: Json;
        };
      };
      user_badges: {
        Row: {
          id: string;
          address: string;
          badge_id: string;
          earned_at: string;
          tx_hash: string | null;
        };
        Insert: {
          id?: string;
          address: string;
          badge_id: string;
          earned_at?: string;
          tx_hash?: string | null;
        };
        Update: {
          id?: string;
          address?: string;
          badge_id?: string;
          earned_at?: string;
          tx_hash?: string | null;
        };
      };
      activity: {
        Row: {
          id: string;
          address: string;
          type: string;
          title: string;
          description: string | null;
          metadata: Json;
          tx_hash: string | null;
          chain_id: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          address: string;
          type: string;
          title: string;
          description?: string | null;
          metadata?: Json;
          tx_hash?: string | null;
          chain_id?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          address?: string;
          type?: string;
          title?: string;
          description?: string | null;
          metadata?: Json;
          tx_hash?: string | null;
          chain_id?: number | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          address: string;
          type: string;
          title: string;
          message: string;
          data: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          address: string;
          type: string;
          title: string;
          message: string;
          data?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          address?: string;
          type?: string;
          title?: string;
          message?: string;
          data?: Json;
          is_read?: boolean;
        };
      };
    };
    Views: {
      leaderboard: {
        Row: {
          address: string;
          display_name: string | null;
          avatar_url: string | null;
          is_verified: boolean;
          total_points: number;
          badge_count: number;
          follower_count: number;
          rank: number;
        };
      };
    };
    Functions: {
      search_profiles: {
        Args: {
          search_query: string;
          limit_count?: number;
        };
        Returns: {
          id: string;
          address: string;
          ens_name: string | null;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          is_verified: boolean;
        }[];
      };
      get_follower_count: {
        Args: {
          profile_address: string;
        };
        Returns: number;
      };
      get_following_count: {
        Args: {
          profile_address: string;
        };
        Returns: number;
      };
    };
    Enums: {
      badge_rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
      activity_type:
        | 'profile_created'
        | 'profile_updated'
        | 'nft_received'
        | 'nft_sent'
        | 'badge_earned'
        | 'followed'
        | 'unfollowed'
        | 'verified';
      notification_type:
        | 'new_follower'
        | 'badge_earned'
        | 'mention'
        | 'system';
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Badge = Database['public']['Tables']['badges']['Row'];
export type UserBadge = Database['public']['Tables']['user_badges']['Row'];
export type Activity = Database['public']['Tables']['activity']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Follower = Database['public']['Tables']['followers']['Row'];
