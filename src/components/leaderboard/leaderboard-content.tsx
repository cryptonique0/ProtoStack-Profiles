'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatNumber, generateGradient, shortenAddress } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';
import { motion } from 'framer-motion';
import { Award, Medal, Star, Trophy, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function LeaderboardContent() {
  const [leaderboard, setLeaderboard] = useState<{
    points: LeaderboardEntry[];
    followers: LeaderboardEntry[];
    badges: LeaderboardEntry[];
  }>({
    points: [],
    followers: [],
    badges: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        // In production, this would be a real API call
        // For now, we'll simulate with mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Mock leaderboard data
        const mockData = Array.from({ length: 25 }, (_, i) => ({
          rank: i + 1,
          address: `0x${Math.random().toString(16).slice(2, 42)}`,
          displayName: i < 5 ? `Top Player ${i + 1}` : null,
          ensName: i % 3 === 0 ? `player${i + 1}.eth` : null,
          avatarUrl: null,
          isVerified: i < 10,
          points: Math.floor(10000 / (i + 1)),
          followers: Math.floor(5000 / (i + 1)),
          badges: Math.floor(50 / (i + 1)),
        }));

        setLeaderboard({
          points: [...mockData].sort((a, b) => b.points - a.points),
          followers: [...mockData].sort((a, b) => b.followers - a.followers),
          badges: [...mockData].sort((a, b) => b.badges - a.badges),
        });
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-muted-foreground">{rank}</span>;
    }
  };

  const LeaderboardTable = ({
    entries,
    valueKey,
    valueLabel,
  }: {
    entries: LeaderboardEntry[];
    valueKey: 'points' | 'followers' | 'badges';
    valueLabel: string;
  }) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.slice(0, 25).map((entry, index) => {
          const gradient = generateGradient(entry.address);
          const displayName =
            entry.displayName || entry.ensName || shortenAddress(entry.address);

          return (
            <motion.div
              key={entry.address}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Link href={`/profile/${entry.address}`}>
                <div
                  className={`flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors ${
                    entry.rank <= 3 ? 'border-primary/30 bg-primary/5' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.avatarUrl || undefined} />
                    <AvatarFallback
                      className={`bg-gradient-to-br ${gradient} text-white`}
                    >
                      {displayName[0]}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{displayName}</span>
                      {entry.isVerified && (
                        <span className="text-web3-blue">✓</span>
                      )}
                    </div>
                    {entry.ensName && entry.displayName && (
                      <p className="text-sm text-muted-foreground truncate">
                        {entry.ensName}
                      </p>
                    )}
                  </div>

                  {/* Value */}
                  <div className="text-right">
                    <div className="font-bold gradient-text">
                      {formatNumber(entry[valueKey])}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {valueLabel}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top 3 cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {leaderboard.points.slice(0, 3).map((entry, index) => {
            const gradient = generateGradient(entry.address);
            const displayName =
              entry.displayName || entry.ensName || shortenAddress(entry.address);
            const medals = ['🥇', '🥈', '🥉'];

            return (
              <motion.div
                key={entry.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/profile/${entry.address}`}>
                  <Card
                    className={`relative overflow-hidden hover:shadow-lg transition-all ${
                      index === 0 ? 'md:-mt-4 md:scale-105' : ''
                    }`}
                  >
                    <div
                      className={`h-2 bg-gradient-to-r ${
                        index === 0
                          ? 'from-yellow-400 to-yellow-600'
                          : index === 1
                          ? 'from-gray-300 to-gray-500'
                          : 'from-amber-500 to-amber-700'
                      }`}
                    />
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl mb-2">{medals[index]}</div>
                      <Avatar className="h-20 w-20 mx-auto mb-4">
                        <AvatarImage src={entry.avatarUrl || undefined} />
                        <AvatarFallback
                          className={`bg-gradient-to-br ${gradient} text-white text-2xl`}
                        >
                          {displayName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-bold text-lg">{displayName}</h3>
                      {entry.ensName && entry.displayName && (
                        <p className="text-sm text-muted-foreground">
                          {entry.ensName}
                        </p>
                      )}
                      <div className="mt-4 text-2xl font-bold gradient-text">
                        {formatNumber(entry.points)} pts
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Full Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="points">
            <TabsList className="mb-6">
              <TabsTrigger value="points" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Points
              </TabsTrigger>
              <TabsTrigger value="followers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Followers
              </TabsTrigger>
              <TabsTrigger value="badges" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Badges
              </TabsTrigger>
            </TabsList>

            <TabsContent value="points">
              <LeaderboardTable
                entries={leaderboard.points}
                valueKey="points"
                valueLabel="points"
              />
            </TabsContent>

            <TabsContent value="followers">
              <LeaderboardTable
                entries={leaderboard.followers}
                valueKey="followers"
                valueLabel="followers"
              />
            </TabsContent>

            <TabsContent value="badges">
              <LeaderboardTable
                entries={leaderboard.badges}
                valueKey="badges"
                valueLabel="badges"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
