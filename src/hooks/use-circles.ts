import type { Circle, CircleActivity, CircleLeaderboardEntry, CirclePost } from '@/types';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for managing circles (communities)
 */
export function useCircles(userAddress: string) {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [userCircles, setUserCircles] = useState<Circle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's circles
  const fetchUserCircles = useCallback(async () => {
    if (!userAddress) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/circles?userAddress=${userAddress}&action=getUserCircles`);
      if (!response.ok) throw new Error('Failed to fetch circles');

      const data = await response.json();
      setUserCircles(data.circles || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  // Get public circles
  const fetchPublicCircles = useCallback(async (limit = 50) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/circles?action=getPublic&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch public circles');

      const data = await response.json();
      setCircles(data.circles || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create circle
  const createCircle = useCallback(
    async (config: {
      name: string;
      description?: string;
      category?: string;
      isPublic?: boolean;
    }) => {
      if (!userAddress) return;

      try {
        const response = await fetch('/api/circles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'createCircle',
            ...config,
          }),
        });

        if (!response.ok) throw new Error('Failed to create circle');

        const data = await response.json();
        await fetchUserCircles();
        setError(null);
        return data.circle;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [userAddress, fetchUserCircles]
  );

  // Join circle
  const joinCircle = useCallback(
    async (circleId: string) => {
      if (!userAddress) return;

      try {
        const response = await fetch('/api/circles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'joinCircle',
            circleId,
          }),
        });

        if (!response.ok) throw new Error('Failed to join circle');

        await fetchUserCircles();
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [userAddress, fetchUserCircles]
  );

  // Leave circle
  const leaveCircle = useCallback(
    async (circleId: string) => {
      if (!userAddress) return;

      try {
        const response = await fetch('/api/circles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'leaveCircle',
            circleId,
          }),
        });

        if (!response.ok) throw new Error('Failed to leave circle');

        await fetchUserCircles();
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [userAddress, fetchUserCircles]
  );

  // Search circles
  const searchCircles = useCallback(async (query: string) => {
    try {
      const response = await fetch(
        `/api/circles?action=search&query=${encodeURIComponent(query)}&limit=20`
      );
      if (!response.ok) throw new Error('Failed to search circles');

      const data = await response.json();
      return data.circles || [];
    } catch (err) {
      console.error('Failed to search circles:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    if (userAddress) {
      fetchUserCircles();
    }
  }, [userAddress, fetchUserCircles]);

  return {
    circles,
    userCircles,
    isLoading,
    error,
    fetchUserCircles,
    fetchPublicCircles,
    createCircle,
    joinCircle,
    leaveCircle,
    searchCircles,
  };
}

/**
 * Hook for managing circle content (posts, comments)
 */
export function useCircleContent(circleId: string) {
  const [posts, setPosts] = useState<CirclePost[]>([]);
  const [activity, setActivity] = useState<CircleActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get posts
  const fetchPosts = useCallback(
    async (limit = 20) => {
      if (!circleId) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/circles?action=getPosts&circleId=${circleId}&limit=${limit}`
        );
        if (!response.ok) throw new Error('Failed to fetch posts');

        const data = await response.json();
        setPosts(data.posts || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    [circleId]
  );

  // Get activity
  const fetchActivity = useCallback(
    async (limit = 50) => {
      if (!circleId) return;

      try {
        const response = await fetch(
          `/api/circles?action=getActivity&circleId=${circleId}&limit=${limit}`
        );
        if (!response.ok) throw new Error('Failed to fetch activity');

        const data = await response.json();
        setActivity(data.activity || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    },
    [circleId]
  );

  // Create post
  const createPost = useCallback(
    async (userAddress: string, title: string, content: string, mediaUrls?: string[]) => {
      try {
        const response = await fetch('/api/circles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'createPost',
            circleId,
            title,
            content,
            mediaUrls,
          }),
        });

        if (!response.ok) throw new Error('Failed to create post');

        await fetchPosts();
        await fetchActivity();
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [circleId, fetchPosts, fetchActivity]
  );

  // Like post
  const likePost = useCallback(
    async (userAddress: string, postId: string) => {
      try {
        await fetch('/api/circles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'interactWithPost',
            postId,
            interactionType: 'like',
          }),
        });

        await fetchPosts();
      } catch (err) {
        console.error('Failed to like post:', err);
      }
    },
    [fetchPosts]
  );

  // Add comment
  const addComment = useCallback(
    async (userAddress: string, postId: string, content: string) => {
      try {
        const response = await fetch('/api/circles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'addComment',
            postId,
            content,
          }),
        });

        if (!response.ok) throw new Error('Failed to add comment');
        await fetchPosts();
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [fetchPosts]
  );

  useEffect(() => {
    if (circleId) {
      fetchPosts();
      fetchActivity();
    }
  }, [circleId, fetchPosts, fetchActivity]);

  return {
    posts,
    activity,
    isLoading,
    error,
    fetchPosts,
    fetchActivity,
    createPost,
    likePost,
    addComment,
  };
}

/**
 * Hook for circle leaderboard
 */
export function useCircleLeaderboard(circleId: string) {
  const [leaderboard, setLeaderboard] = useState<CircleLeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<CircleLeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get leaderboard
  const fetchLeaderboard = useCallback(
    async (limit = 50) => {
      if (!circleId) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/circles?action=getLeaderboard&circleId=${circleId}&limit=${limit}`
        );
        if (!response.ok) throw new Error('Failed to fetch leaderboard');

        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    [circleId]
  );

  // Get user rank
  const fetchUserRank = useCallback(
    async (userAddress: string) => {
      if (!circleId || !userAddress) return;

      try {
        const response = await fetch(
          `/api/circles?action=getMemberRank&circleId=${circleId}&userAddress=${userAddress}`
        );
        if (!response.ok) throw new Error('Failed to fetch user rank');

        const data = await response.json();
        setUserRank(data.rank);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    },
    [circleId]
  );

  useEffect(() => {
    if (circleId) {
      fetchLeaderboard();
    }
  }, [circleId, fetchLeaderboard]);

  return {
    leaderboard,
    userRank,
    isLoading,
    error,
    fetchLeaderboard,
    fetchUserRank,
  };
}

/**
 * Hook for circle invites
 */
export function useCircleInvites(userAddress: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create invite
  const createInvite = useCallback(
    async (circleId: string, invitedAddress?: string) => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/circles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'createInvite',
            circleId,
            invitedAddress,
          }),
        });

        if (!response.ok) throw new Error('Failed to create invite');

        const data = await response.json();
        setError(null);
        return data.invite;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userAddress]
  );

  // Use invite
  const useInvite = useCallback(
    async (inviteCode: string) => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/circles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress,
            action: 'useInvite',
            inviteCode,
          }),
        });

        if (!response.ok) throw new Error('Failed to use invite');

        const data = await response.json();
        setError(null);
        return data.circleId;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userAddress]
  );

  return {
    isLoading,
    error,
    createInvite,
    useInvite,
  };
}
