import { createClient } from '@supabase/supabase-js';

interface CircleConfig {
  name: string;
  description?: string;
  category?: 'dao' | 'community' | 'project' | 'social' | 'professional' | 'gaming' | 'general';
  imageUrl?: string;
  bannerUrl?: string;
  isPublic?: boolean;
  metadata?: Record<string, unknown>;
}

interface GatingRule {
  ruleType:
    | 'badge'
    | 'nft'
    | 'follower_count'
    | 'badge_points'
    | 'token_balance'
    | 'verification'
    | 'invite_only';
  badgeId?: string;
  nftContract?: string;
  minFollowerCount?: number;
  minBadgePoints?: number;
  tokenAddress?: string;
  minTokenBalance?: string;
  requiresVerification?: boolean;
}

interface CirclePost {
  circleId: string;
  authorAddress: string;
  title?: string;
  content: string;
  mediaUrls?: string[];
  isPinned?: boolean;
}

interface CircleComment {
  postId: string;
  authorAddress: string;
  content: string;
  parentCommentId?: string;
}

export class CirclesService {
  private supabase;

  constructor(
    private supabaseUrl: string,
    private supabaseKey: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ============================================
  // CIRCLE MANAGEMENT
  // ============================================

  /**
   * Create a new circle
   */
  async createCircle(creatorAddress: string, config: CircleConfig) {
    try {
      const slug = config.name.toLowerCase().replace(/\s+/g, '-');

      const { data: circle, error } = await this.supabase
        .from('circles')
        .insert({
          name: config.name,
          slug,
          description: config.description,
          image_url: config.imageUrl,
          banner_url: config.bannerUrl,
          creator_address: creatorAddress,
          category: config.category || 'general',
          is_public: config.isPublic ?? true,
          metadata: config.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await this.addMember(circle.id, creatorAddress, 'admin');

      // Set up default role permissions
      await this.setupDefaultRolePermissions(circle.id);

      return circle;
    } catch (error) {
      console.error('Failed to create circle:', error);
      throw error;
    }
  }

  /**
   * Get circle details
   */
  async getCircle(circleId: string) {
    try {
      const { data: circle, error } = await this.supabase
        .from('circles')
        .select('*')
        .eq('id', circleId)
        .single();

      if (error) throw error;
      return circle;
    } catch (error) {
      console.error('Failed to get circle:', error);
      return null;
    }
  }

  /**
   * Get circles by creator
   */
  async getCirclesByCreator(creatorAddress: string) {
    try {
      const { data: circles, error } = await this.supabase
        .from('circles')
        .select('*')
        .eq('creator_address', creatorAddress)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return circles || [];
    } catch (error) {
      console.error('Failed to get circles:', error);
      return [];
    }
  }

  /**
   * Get all public circles
   */
  async getPublicCircles(limit = 50, offset = 0) {
    try {
      const { data: circles, error } = await this.supabase
        .from('circles')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return circles || [];
    } catch (error) {
      console.error('Failed to get public circles:', error);
      return [];
    }
  }

  /**
   * Search circles
   */
  async searchCircles(query: string, limit = 20) {
    try {
      const { data: circles, error } = await this.supabase
        .from('circles')
        .select('*')
        .eq('is_public', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit);

      if (error) throw error;
      return circles || [];
    } catch (error) {
      console.error('Failed to search circles:', error);
      return [];
    }
  }

  // ============================================
  // MEMBERSHIP MANAGEMENT
  // ============================================

  /**
   * Add member to circle
   */
  async addMember(circleId: string, memberAddress: string, role = 'member') {
    try {
      const { data: member, error } = await this.supabase
        .from('circle_members')
        .insert({
          circle_id: circleId,
          member_address: memberAddress,
          role,
        })
        .select()
        .single();

      if (error && error.code !== '23505') throw error; // 23505 = unique constraint

      // Update circle member count
      await this.updateCircleMemberCount(circleId);

      // Log activity
      await this.logActivity(circleId, memberAddress, 'joined', 'Joined circle');

      return member;
    } catch (error) {
      console.error('Failed to add member:', error);
      throw error;
    }
  }

  /**
   * Remove member from circle
   */
  async removeMember(circleId: string, memberAddress: string) {
    try {
      const { error } = await this.supabase
        .from('circle_members')
        .delete()
        .eq('circle_id', circleId)
        .eq('member_address', memberAddress);

      if (error) throw error;

      await this.updateCircleMemberCount(circleId);
      await this.logActivity(circleId, memberAddress, 'left', 'Left circle');
    } catch (error) {
      console.error('Failed to remove member:', error);
      throw error;
    }
  }

  /**
   * Get circle members
   */
  async getCircleMembers(circleId: string, limit = 50) {
    try {
      const { data: members, error } = await this.supabase
        .from('circle_members')
        .select('*')
        .eq('circle_id', circleId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return members || [];
    } catch (error) {
      console.error('Failed to get circle members:', error);
      return [];
    }
  }

  /**
   * Check if user is member
   */
  async isMember(circleId: string, memberAddress: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('circle_members')
        .select('id')
        .eq('circle_id', circleId)
        .eq('member_address', memberAddress)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Failed to check membership:', error);
      return false;
    }
  }

  /**
   * Get user's circles
   */
  async getUserCircles(userAddress: string) {
    try {
      const { data: circles, error } = await this.supabase
        .from('circle_members')
        .select('circles(*)')
        .eq('member_address', userAddress)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return circles?.map((c) => c.circles) || [];
    } catch (error) {
      console.error('Failed to get user circles:', error);
      return [];
    }
  }

  // ============================================
  // GATING & ACCESS CONTROL
  // ============================================

  /**
   * Add gating rule to circle
   */
  async addGatingRule(circleId: string, rule: GatingRule) {
    try {
      const { data: gatingRule, error } = await this.supabase
        .from('circle_gating_rules')
        .insert({
          circle_id: circleId,
          rule_type: rule.ruleType,
          badge_id: rule.badgeId,
          nft_contract: rule.nftContract,
          min_follower_count: rule.minFollowerCount || 0,
          min_badge_points: rule.minBadgePoints || 0,
          token_address: rule.tokenAddress,
          min_token_balance: rule.minTokenBalance || '0',
          requires_verification: rule.requiresVerification || false,
        })
        .select()
        .single();

      if (error) throw error;
      return gatingRule;
    } catch (error) {
      console.error('Failed to add gating rule:', error);
      throw error;
    }
  }

  /**
   * Get gating rules for circle
   */
  async getGatingRules(circleId: string) {
    try {
      const { data: rules, error } = await this.supabase
        .from('circle_gating_rules')
        .select('*')
        .eq('circle_id', circleId)
        .eq('is_active', true);

      if (error) throw error;
      return rules || [];
    } catch (error) {
      console.error('Failed to get gating rules:', error);
      return [];
    }
  }

  /**
   * Check if user can access circle
   */
  async canAccessCircle(userAddress: string, circleId: string): Promise<boolean> {
    try {
      const { data: result, error } = await this.supabase.rpc('can_access_circle', {
        user_addr: userAddress,
        circle_uuid: circleId,
      });

      if (error) throw error;
      return result || false;
    } catch (error) {
      console.error('Failed to check circle access:', error);
      return false;
    }
  }

  /**
   * Check if user can perform action
   */
  async canPerformAction(userAddress: string, circleId: string, action: string): Promise<boolean> {
    try {
      const { data: result, error } = await this.supabase.rpc('can_perform_action', {
        user_addr: userAddress,
        circle_uuid: circleId,
        action,
      });

      if (error) throw error;
      return result || false;
    } catch (error) {
      console.error('Failed to check action permission:', error);
      return false;
    }
  }

  // ============================================
  // INVITES
  // ============================================

  /**
   * Create invite to circle
   */
  async createInvite(circleId: string, invitedBy: string, invitedAddress?: string) {
    try {
      const inviteCode = `invite_${Math.random().toString(36).substr(2, 9)}`;

      const { data: invite, error } = await this.supabase
        .from('circle_invites')
        .insert({
          circle_id: circleId,
          invited_by: invitedBy,
          invite_code: inviteCode,
          invited_address: invitedAddress,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return invite;
    } catch (error) {
      console.error('Failed to create invite:', error);
      throw error;
    }
  }

  /**
   * Use invite code to join circle
   */
  async useInvite(inviteCode: string, userAddress: string) {
    try {
      // Get invite
      const { data: invite, error: inviteError } = await this.supabase
        .from('circle_invites')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      if (inviteError) throw new Error('Invalid invite code');
      if (invite.is_used) throw new Error('Invite already used');
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        throw new Error('Invite expired');
      }

      // Mark as used
      await this.supabase
        .from('circle_invites')
        .update({
          is_used: true,
          used_by: userAddress,
        })
        .eq('id', invite.id);

      // Add member
      await this.addMember(invite.circle_id, userAddress, 'member');

      return invite.circle_id;
    } catch (error) {
      console.error('Failed to use invite:', error);
      throw error;
    }
  }

  // ============================================
  // POSTS & CONTENT
  // ============================================

  /**
   * Create post in circle
   */
  async createPost(post: CirclePost) {
    try {
      // Check permission
      const canPost = await this.canPerformAction(post.authorAddress, post.circleId, 'post');
      if (!canPost) {
        throw new Error('You do not have permission to post in this circle');
      }

      const { data: createdPost, error } = await this.supabase
        .from('circle_posts')
        .insert({
          circle_id: post.circleId,
          author_address: post.authorAddress,
          title: post.title,
          content: post.content,
          media_urls: post.mediaUrls || [],
          is_pinned: post.isPinned || false,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity(
        post.circleId,
        post.authorAddress,
        'posted',
        post.title || 'Posted in circle'
      );

      return createdPost;
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  }

  /**
   * Get circle posts
   */
  async getCirclePosts(circleId: string, limit = 20, offset = 0) {
    try {
      const { data: posts, error } = await this.supabase
        .from('circle_posts')
        .select('*')
        .eq('circle_id', circleId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return posts || [];
    } catch (error) {
      console.error('Failed to get posts:', error);
      return [];
    }
  }

  /**
   * Like/interact with post
   */
  async interactWithPost(
    postId: string,
    userAddress: string,
    interactionType: 'like' | 'dislike' | 'share'
  ) {
    try {
      const { data: interaction, error } = await this.supabase
        .from('circle_post_interactions')
        .insert({
          post_id: postId,
          user_address: userAddress,
          interaction_type: interactionType,
        })
        .select()
        .single();

      if (error && error.code !== '23505') throw error;

      // Update post counts
      if (interactionType === 'like') {
        await this.supabase.rpc('update_leaderboard_points', {
          circle_uuid: (
            await this.supabase.from('circle_posts').select('circle_id').eq('id', postId).single()
          ).data?.circle_id,
          member_addr: userAddress,
        });
      }

      return interaction;
    } catch (error) {
      console.error('Failed to interact with post:', error);
      throw error;
    }
  }

  // ============================================
  // COMMENTS
  // ============================================

  /**
   * Add comment to post
   */
  async addComment(comment: CircleComment) {
    try {
      const { data: createdComment, error } = await this.supabase
        .from('circle_comments')
        .insert({
          post_id: comment.postId,
          author_address: comment.authorAddress,
          content: comment.content,
          parent_comment_id: comment.parentCommentId,
        })
        .select()
        .single();

      if (error) throw error;

      // Update post comment count
      await this.supabase.rpc('update_leaderboard_points', {
        circle_uuid: (
          await this.supabase
            .from('circle_posts')
            .select('circle_id')
            .eq('id', comment.postId)
            .single()
        ).data?.circle_id,
        member_addr: comment.authorAddress,
      });

      return createdComment;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }

  /**
   * Get post comments
   */
  async getPostComments(postId: string) {
    try {
      const { data: comments, error } = await this.supabase
        .from('circle_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return comments || [];
    } catch (error) {
      console.error('Failed to get comments:', error);
      return [];
    }
  }

  // ============================================
  // LEADERBOARD
  // ============================================

  /**
   * Get circle leaderboard
   */
  async getLeaderboard(circleId: string, limit = 50) {
    try {
      const { data: leaderboard, error } = await this.supabase
        .from('circle_leaderboard')
        .select('*')
        .eq('circle_id', circleId)
        .order('points', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return leaderboard || [];
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }

  /**
   * Get member rank
   */
  async getMemberRank(circleId: string, memberAddress: string) {
    try {
      const { data: leaderboard, error } = await this.supabase
        .from('circle_leaderboard')
        .select('*')
        .eq('circle_id', circleId)
        .eq('member_address', memberAddress)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return leaderboard || null;
    } catch (error) {
      console.error('Failed to get member rank:', error);
      return null;
    }
  }

  // ============================================
  // ACTIVITY FEED
  // ============================================

  /**
   * Get circle activity
   */
  async getCircleActivity(circleId: string, limit = 50, offset = 0) {
    try {
      const { data: activity, error } = await this.supabase
        .from('circle_activity')
        .select('*')
        .eq('circle_id', circleId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return activity || [];
    } catch (error) {
      console.error('Failed to get activity:', error);
      return [];
    }
  }

  /**
   * Log activity (internal)
   */
  private async logActivity(circleId: string, userAddress: string, type: string, title: string) {
    try {
      await this.supabase.from('circle_activity').insert({
        circle_id: circleId,
        user_address: userAddress,
        type,
        title,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Update circle member count (internal)
   */
  private async updateCircleMemberCount(circleId: string) {
    try {
      const { data: members, error } = await this.supabase
        .from('circle_members')
        .select('id')
        .eq('circle_id', circleId);

      if (!error && members) {
        await this.supabase
          .from('circles')
          .update({ member_count: members.length })
          .eq('id', circleId);
      }
    } catch (error) {
      console.error('Failed to update member count:', error);
    }
  }

  /**
   * Setup default role permissions
   */
  private async setupDefaultRolePermissions(circleId: string) {
    try {
      const roles = [
        {
          role: 'admin',
          permissions: {
            can_post: true,
            can_comment: true,
            can_invite: true,
            can_moderate: true,
            can_manage_treasury: true,
            can_create_proposal: true,
            can_vote: true,
            can_manage_roles: true,
          },
        },
        {
          role: 'moderator',
          permissions: {
            can_post: true,
            can_comment: true,
            can_invite: true,
            can_moderate: true,
            can_manage_treasury: false,
            can_create_proposal: true,
            can_vote: true,
            can_manage_roles: false,
          },
        },
        {
          role: 'member',
          permissions: {
            can_post: true,
            can_comment: true,
            can_invite: false,
            can_moderate: false,
            can_manage_treasury: false,
            can_create_proposal: false,
            can_vote: true,
            can_manage_roles: false,
          },
        },
        {
          role: 'viewer',
          permissions: {
            can_post: false,
            can_comment: false,
            can_invite: false,
            can_moderate: false,
            can_manage_treasury: false,
            can_create_proposal: false,
            can_vote: false,
            can_manage_roles: false,
          },
        },
      ];

      for (const { role, permissions } of roles) {
        await this.supabase.from('circle_role_permissions').insert({
          circle_id: circleId,
          role,
          ...permissions,
        });
      }
    } catch (error) {
      console.error('Failed to setup role permissions:', error);
    }
  }
}

export default CirclesService;
