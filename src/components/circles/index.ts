import React, { useState } from 'react';
import Link from 'next/link';
import { useCircles, useCircleContent, useCircleLeaderboard } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Circle, CirclePost, CircleLeaderboardEntry } from '@/types';

/**
 * Circle Card - Display circle info with join button
 */
export function CircleCard({
  circle,
  onJoin,
  isMember = false,
}: {
  circle: Circle;
  onJoin?: (circleId: string) => void;
  isMember?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!onJoin) return;
    setIsLoading(true);
    try {
      await onJoin(circle.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link href={`/circles/${circle.id}`}>
            <h3 className="text-lg font-semibold hover:text-blue-600 cursor-pointer">
              {circle.name}
            </h3>
          </Link>
          <p className="text-sm text-gray-600 mt-1">{circle.description}</p>
          <div className="flex gap-4 mt-4 text-sm text-gray-500">
            <span>{circle.memberCount || 0} members</span>
            {circle.category && <span className="capitalize">{circle.category}</span>}
            {circle.isPublic ? (
              <span className="text-blue-600">Public</span>
            ) : (
              <span className="text-amber-600">Private</span>
            )}
          </div>
        </div>
        {!isMember && (
          <Button
            onClick={handleJoin}
            disabled={isLoading}
            className="ml-4 whitespace-nowrap"
          >
            {isLoading ? 'Joining...' : 'Join Circle'}
          </Button>
        )}
      </div>
    </Card>
  );
}

/**
 * Circle Feed - Display posts in a circle
 */
export function CircleFeed({
  circleId,
  userAddress,
}: {
  circleId: string;
  userAddress: string;
}) {
  const { posts, isLoading } = useCircleContent(circleId);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const { createPost } = useCircleContent(circleId);

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !postContent.trim()) return;

    setIsCreatingPost(true);
    try {
      await createPost(userAddress, postTitle, postContent);
      setPostTitle('');
      setPostContent('');
    } finally {
      setIsCreatingPost(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Post Form */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Create a Post</h3>
        <div className="space-y-4">
          <Input
            placeholder="Post title..."
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            disabled={isCreatingPost}
          />
          <textarea
            placeholder="What's on your mind..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            disabled={isCreatingPost}
            className="w-full p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
          <Button
            onClick={handleCreatePost}
            disabled={isCreatingPost || !postTitle.trim() || !postContent.trim()}
            className="w-full"
          >
            {isCreatingPost ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-6 text-center text-gray-500">Loading posts...</Card>
        ) : posts.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">No posts yet</Card>
        ) : (
          posts.map((post) => (
            <CirclePostCard
              key={post.id}
              post={post}
              userAddress={userAddress}
              circleId={circleId}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Circle Post Card - Display a single post
 */
export function CirclePostCard({
  post,
  userAddress,
  circleId,
}: {
  post: CirclePost;
  userAddress: string;
  circleId: string;
}) {
  const { likePost, addComment } = useCircleContent(circleId);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isComenting, setIsCommenting] = useState(false);

  const handleLike = async () => {
    setIsLiking(true);
    try {
      await likePost(userAddress, post.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    setIsCommenting(true);
    try {
      await addComment(userAddress, post.id, commentText);
      setCommentText('');
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-lg">{post.title}</h4>
          <p className="text-sm text-gray-500 mt-1">
            by {post.authorAddress?.slice(0, 6)}...{post.authorAddress?.slice(-4)}
          </p>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="mt-4 text-gray-700">{post.content}</p>

      <div className="flex gap-4 mt-4 pt-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={isLiking}
          className="flex items-center gap-2"
        >
          👍 {post.likeCount || 0} Like{(post.likeCount || 0) !== 1 ? 's' : ''}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2"
        >
          💬 {post.commentCount || 0} Comment{(post.commentCount || 0) !== 1 ? 's' : ''}
        </Button>
      </div>

      {showComments && (
        <div className="mt-4 space-y-3 pt-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={isComenting}
              size="sm"
            />
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={isComenting || !commentText.trim()}
            >
              {isComenting ? '...' : 'Reply'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Circle Leaderboard - Display member rankings
 */
export function CircleLeaderboard({
  circleId,
  limit = 10,
}: {
  circleId: string;
  limit?: number;
}) {
  const { leaderboard, isLoading } = useCircleLeaderboard(circleId);

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">🏆 Leaderboard</h3>

      {isLoading ? (
        <div className="text-center text-gray-500 py-8">Loading leaderboard...</div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No rankings yet</div>
      ) : (
        <div className="space-y-2">
          {leaderboard.slice(0, limit).map((entry, index) => (
            <LeaderboardRow
              key={entry.memberAddress}
              rank={index + 1}
              entry={entry}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * Leaderboard Row - Single ranking entry
 */
function LeaderboardRow({
  rank,
  entry,
}: {
  rank: number;
  entry: CircleLeaderboardEntry;
}) {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <span className="font-bold w-6">{getRankBadge(rank)}</span>
        <div>
          <p className="font-medium">
            {entry.memberAddress?.slice(0, 6)}...{entry.memberAddress?.slice(-4)}
          </p>
          <p className="text-xs text-gray-500">{entry.role}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold">{entry.totalPoints} pts</p>
        <p className="text-xs text-gray-500">
          {entry.postCount} posts · {entry.commentCount} comments
        </p>
      </div>
    </div>
  );
}

/**
 * Circle Join Button - Smart button that handles join/leave states
 */
export function CircleJoinButton({
  circle,
  userAddress,
  isMember = false,
  onJoinChange,
}: {
  circle: Circle;
  userAddress: string;
  isMember?: boolean;
  onJoinChange?: () => void;
}) {
  const { joinCircle, leaveCircle } = useCircles(userAddress);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isMember) {
        await leaveCircle(circle.id);
      } else {
        await joinCircle(circle.id);
      }
      onJoinChange?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      variant={isMember ? 'outline' : 'default'}
    >
      {isLoading ? 'Loading...' : isMember ? 'Leave Circle' : 'Join Circle'}
    </Button>
  );
}

/**
 * Circle Header - Circle info header with actions
 */
export function CircleHeader({
  circle,
  userAddress,
  isMember = false,
  onJoinChange,
}: {
  circle: Circle;
  userAddress: string;
  isMember?: boolean;
  onJoinChange?: () => void;
}) {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg mb-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-4xl font-bold">{circle.name}</h1>
          <p className="text-blue-100 mt-2">{circle.description}</p>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-blue-100 text-sm">Members</p>
              <p className="text-2xl font-bold">{circle.memberCount || 0}</p>
            </div>
            {circle.category && (
              <div>
                <p className="text-blue-100 text-sm">Category</p>
                <p className="text-2xl font-bold capitalize">{circle.category}</p>
              </div>
            )}
          </div>
        </div>
        <CircleJoinButton
          circle={circle}
          userAddress={userAddress}
          isMember={isMember}
          onJoinChange={onJoinChange}
        />
      </div>
    </div>
  );
}

/**
 * Circles Grid - Display multiple circles
 */
export function CirclesGrid({
  circles,
  userAddress,
  userCircleIds = [],
  onJoin,
}: {
  circles: Circle[];
  userAddress: string;
  userCircleIds?: string[];
  onJoin?: (circleId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {circles.map((circle) => (
        <CircleCard
          key={circle.id}
          circle={circle}
          isMember={userCircleIds.includes(circle.id)}
          onJoin={onJoin}
        />
      ))}
    </div>
  );
}
