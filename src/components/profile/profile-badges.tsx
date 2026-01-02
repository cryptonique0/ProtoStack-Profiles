'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { BadgeWithEarned } from '@/services/badge-service';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ProfileBadgesProps {
  address: string;
}

const rarityColors: Record<string, string> = {
  common: 'from-gray-400 to-gray-600',
  uncommon: 'from-green-400 to-green-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-600',
};

export function ProfileBadges({ address }: ProfileBadgesProps) {
  const [badges, setBadges] = useState<BadgeWithEarned[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBadges() {
      try {
        const response = await fetch(`/api/badges/${address}`);
        const data = await response.json();
        setBadges(data.data || []);
      } catch (error) {
        console.error('Failed to fetch badges:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBadges();
  }, [address]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col items-center p-4 rounded-xl border">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-4 w-20 mt-3" />
            <Skeleton className="h-3 w-16 mt-1" />
          </div>
        ))}
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <span className="text-2xl">🏆</span>
        </div>
        <p className="text-muted-foreground">No badges earned yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Complete activities to earn badges
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {badges.map((badge, index) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group relative flex flex-col items-center p-4 rounded-xl border hover:shadow-lg transition-all cursor-pointer"
        >
          {/* Badge image with gradient ring */}
          <div className={`p-1 rounded-full bg-gradient-to-br ${rarityColors[badge.rarity] || rarityColors.common}`}>
            <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center overflow-hidden">
              {badge.image_url ? (
                <img
                  src={badge.image_url}
                  alt={badge.name}
                  className="h-14 w-14 object-cover rounded-full"
                />
              ) : (
                <span className="text-2xl">🏅</span>
              )}
            </div>
          </div>

          {/* Badge info */}
          <h3 className="mt-3 font-medium text-center">{badge.name}</h3>
          <p className="text-xs text-muted-foreground capitalize">{badge.rarity}</p>
          
          {/* Points */}
          <div className="mt-2 text-sm font-medium gradient-text">
            +{badge.points} pts
          </div>

          {/* Earned date */}
          {badge.earnedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              {format(new Date(badge.earnedAt), 'MMM d, yyyy')}
            </p>
          )}

          {/* Hover overlay with description */}
          <div className="absolute inset-0 bg-background/95 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
            <p className="text-sm text-center text-muted-foreground">
              {badge.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
