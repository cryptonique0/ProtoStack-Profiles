/**
 * CIRCLES_EXAMPLES.tsx
 * Complete working examples for the Circles / Communities feature
 */

import {
  CircleCard,
  CircleFeed,
  CircleHeader,
  CircleLeaderboard,
  CirclesGrid,
} from '@/components/circles';
import { useCircleInvites, useCircleLeaderboard, useCircles, useWeb3Profile } from '@/hooks';
import React, { useState } from 'react';

// ============================================
// Example 1: Explore Public Circles
// ============================================

export function ExploreCirclesExample() {
  const { userAddress } = useWeb3Profile();
  const { circles, fetchPublicCircles, isLoading } = useCircles(userAddress);
  const { joinCircle } = useCircles(userAddress);

  React.useEffect(() => {
    fetchPublicCircles(20);
  }, []);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-8 text-4xl font-bold">Explore Circles</h1>

      {isLoading ? (
        <div className="py-12 text-center">Loading circles...</div>
      ) : (
        <CirclesGrid circles={circles} userAddress={userAddress} onJoin={joinCircle} />
      )}
    </div>
  );
}

// ============================================
// Example 2: User's Circle Dashboard
// ============================================

export function MyCirclesDashboardExample() {
  const { userAddress } = useWeb3Profile();
  const { userCircles, isLoading } = useCircles(userAddress);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-8 text-4xl font-bold">My Circles</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {userCircles.map((circle) => (
          <div key={circle.id} className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-xl font-semibold">{circle.name}</h3>
            <p className="mt-2 text-gray-600">{circle.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">{circle.memberCount} members</span>
              <a href={`/circles/${circle.id}`} className="text-blue-600 hover:underline">
                View →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Example 3: Create New Circle
// ============================================

export function CreateCircleExample() {
  const { userAddress } = useWeb3Profile();
  const { createCircle, userCircles } = useCircles(userAddress);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'community',
    isPublic: true,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const circle = await createCircle(formData);
      setSuccess(true);
      setFormData({ name: '', description: '', category: 'community', isPublic: true });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to create circle:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-8 text-4xl font-bold">Create a Circle</h1>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-8 shadow">
        <div>
          <label className="mb-2 block text-sm font-medium">Circle Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., DAO Founders"
            className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What's this circle about?"
            rows={4}
            className="w-full resize-none rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="community">Community</option>
            <option value="dao">DAO</option>
            <option value="club">Club</option>
            <option value="project">Project</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm font-medium">Make circle public</span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Public circles are discoverable. Private circles require invites.
          </p>
        </div>

        <button
          type="submit"
          disabled={isCreating}
          className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create Circle'}
        </button>

        {success && (
          <div className="rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
            Circle created successfully!
          </div>
        )}
      </form>

      <div className="mt-8 rounded-lg bg-blue-50 p-6">
        <h2 className="mb-2 font-semibold">You have {userCircles.length} circle(s)</h2>
        <ul className="space-y-2">
          {userCircles.map((c) => (
            <li key={c.id} className="text-sm text-gray-700">
              • {c.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================
// Example 4: Circle Feed with Posting
// ============================================

export function CircleFeedExample({ circleId }: { circleId: string }) {
  const { userAddress } = useWeb3Profile();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <CircleFeed circleId={circleId} userAddress={userAddress} />
    </div>
  );
}

// ============================================
// Example 5: Circle Page with All Features
// ============================================

export function CirclePageExample({ circleId }: { circleId: string }) {
  const { userAddress } = useWeb3Profile();
  const [circle, setCircle] = React.useState(null);
  const [isMember, setIsMember] = React.useState(false);

  React.useEffect(() => {
    // Fetch circle details
    fetch(`/api/circles?action=getCircle&circleId=${circleId}`)
      .then((r) => r.json())
      .then((data) => setCircle(data.circle));

    // Check membership
    fetch(`/api/circles?action=isMember&circleId=${circleId}&userAddress=${userAddress}`)
      .then((r) => r.json())
      .then((data) => setIsMember(data.isMember));
  }, [circleId, userAddress]);

  if (!circle) return <div>Loading...</div>;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <CircleHeader
        circle={circle}
        userAddress={userAddress}
        isMember={isMember}
        onJoinChange={() => setIsMember(!isMember)}
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          {isMember ? (
            <CircleFeed circleId={circleId} userAddress={userAddress} />
          ) : (
            <div className="rounded-lg bg-white p-8 text-center text-gray-500">
              Join the circle to see the feed
            </div>
          )}
        </div>

        <div className="space-y-6">
          <CircleLeaderboard circleId={circleId} limit={5} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Example 6: Search and Filter Circles
// ============================================

export function SearchCirclesExample() {
  const { userAddress } = useWeb3Profile();
  const { searchCircles } = useCircles(userAddress);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const found = await searchCircles(query);
      setResults(found);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-8 text-4xl font-bold">Search Circles</h1>

      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search circles by name or description..."
          className="flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((circle) => (
            <CircleCard key={circle.id} circle={circle} isMember={false} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Example 7: Circle Leaderboard
// ============================================

export function CircleLeaderboardExample({ circleId }: { circleId: string }) {
  const { userAddress } = useWeb3Profile();
  const { leaderboard, userRank, fetchUserRank } = useCircleLeaderboard(circleId);

  React.useEffect(() => {
    fetchUserRank(userAddress);
  }, [circleId, userAddress]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-8 text-4xl font-bold">🏆 Circle Leaderboard</h1>

      {userRank && (
        <div className="mb-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <h2 className="text-xl font-semibold">Your Rank</h2>
          <p className="mt-2 text-4xl font-bold">#{leaderboard.indexOf(userRank) + 1}</p>
          <p className="mt-2 text-lg">{userRank.totalPoints} points</p>
        </div>
      )}

      <CircleLeaderboard circleId={circleId} limit={50} />
    </div>
  );
}

// ============================================
// Example 8: Generate and Share Invite
// ============================================

export function CircleInviteExample({ circleId }: { circleId: string }) {
  const { userAddress } = useWeb3Profile();
  const { createInvite, useInvite } = useCircleInvites(userAddress);
  const [inviteCode, setInviteCode] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [inviteLink, setInviteLink] = React.useState('');

  const handleGenerateInvite = async () => {
    setIsGenerating(true);
    try {
      const invite = await createInvite(circleId);
      setInviteCode(invite.inviteCode);
      setInviteLink(`${window.location.origin}/circles/join?code=${invite.inviteCode}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-8 text-3xl font-bold">Invite Friends</h1>

      <div className="space-y-6 rounded-lg bg-white p-8 shadow">
        <button
          onClick={handleGenerateInvite}
          disabled={isGenerating}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate Invite Code'}
        </button>

        {inviteCode && (
          <div className="space-y-4 rounded-lg bg-gray-50 p-6">
            <div>
              <p className="mb-2 text-sm text-gray-600">Invite Code</p>
              <div className="flex gap-2">
                <code className="flex-1 rounded border bg-white px-4 py-2 font-mono">
                  {inviteCode}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-gray-600">Invite Link</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 rounded border bg-white px-4 py-2"
                />
                <button
                  onClick={copyToClipboard}
                  className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
                >
                  Copy
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Invite expires in 7 days. Share this link with friends to invite them to the circle.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Example 9: Use Invite Code
// ============================================

export function UseInviteExample() {
  const { userAddress } = useWeb3Profile();
  const { useInvite } = useCircleInvites(userAddress);
  const [inviteCode, setInviteCode] = React.useState('');
  const [isJoining, setIsJoining] = React.useState(false);
  const [joinedCircleId, setJoinedCircleId] = React.useState('');
  const [error, setError] = React.useState('');

  const handleUseInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);
    setError('');

    try {
      const circleId = await useInvite(inviteCode);
      setJoinedCircleId(circleId);
      setInviteCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join circle');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-8 text-3xl font-bold">Join Circle with Invite</h1>

      {!joinedCircleId ? (
        <form onSubmit={handleUseInvite} className="space-y-6 rounded-lg bg-white p-8 shadow">
          <div>
            <label className="mb-2 block text-sm font-medium">Invite Code</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter the invite code you received"
              className="w-full rounded-lg border px-4 py-2 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isJoining || !inviteCode.trim()}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isJoining ? 'Joining...' : 'Join Circle'}
          </button>
        </form>
      ) : (
        <div className="rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
          <p className="font-semibold">Success! 🎉</p>
          <p className="mt-2">You've successfully joined the circle!</p>
          <a
            href={`/circles/${joinedCircleId}`}
            className="mt-4 inline-block rounded bg-green-600 px-6 py-2 text-white hover:bg-green-700"
          >
            View Circle →
          </a>
        </div>
      )}
    </div>
  );
}

export default {
  ExploreCirclesExample,
  MyCirclesDashboardExample,
  CreateCircleExample,
  CircleFeedExample,
  CirclePageExample,
  SearchCirclesExample,
  CircleLeaderboardExample,
  CircleInviteExample,
  UseInviteExample,
};
