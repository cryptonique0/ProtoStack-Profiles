'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { Activity } from '@/types/database.types';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Award, ExternalLink, Image, Settings, UserMinus, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProfileActivityProps {
  address: string;
}

const activityIcons: Record<string, typeof Award> = {
  badge_earned: Award,
  followed: UserPlus,
  unfollowed: UserMinus,
  nft_received: Image,
  profile_updated: Settings,
};

export function ProfileActivity({ address }: ProfileActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const response = await fetch(`/api/activity?address=${address}&limit=20`);
        const data = await response.json();
        setActivities(data.data || []);
      } catch (error) {
        console.error('Failed to fetch activity:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivity();
  }, [address]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-xl border">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity, index) => {
        const Icon = activityIcons[activity.type] || Award;
        
        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="activity-item flex items-start gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium">{activity.title}</p>
              {activity.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {activity.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>

            {activity.tx_hash && (
              <a
                href={`https://etherscan.io/tx/${activity.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
