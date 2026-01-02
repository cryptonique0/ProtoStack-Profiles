'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { generateGradient, shortenAddress } from '@/lib/utils';
import type { ProfileStats } from '@/types';
import type { Profile } from '@/types/database.types';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { BadgeCheck, Calendar, Copy, ExternalLink, MapPin } from 'lucide-react';

interface ProfileHeaderProps {
  profile: Profile;
  stats: ProfileStats;
}

export function ProfileHeader({ profile, stats }: ProfileHeaderProps) {
  const [copyState, copy] = useCopyToClipboard();
  const gradient = generateGradient(profile.address);

  return (
    <div className="relative">
      {/* Cover image */}
      <div className="h-48 sm:h-64 w-full">
        {profile.cover_url ? (
          <img
            src={profile.cover_url}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${gradient}`} />
        )}
      </div>

      <div className="container">
        <div className="relative -mt-16 sm:-mt-20 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            {/* Avatar and basic info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div className="rounded-full border-4 border-background bg-background">
                  <Avatar className="h-28 w-28 sm:h-36 sm:w-36">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white text-3xl`}>
                      {profile.display_name?.[0] || profile.address.slice(2, 4)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {profile.is_verified && (
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-1">
                    <BadgeCheck className="h-6 w-6 text-web3-blue" />
                  </div>
                )}
              </motion.div>

              {/* Name and address */}
              <div className="text-center sm:text-left pb-2">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {profile.display_name || profile.ens_name || shortenAddress(profile.address)}
                  </h1>
                  {profile.is_premium && (
                    <span className="badge-premium">PRO</span>
                  )}
                </div>
                
                {profile.ens_name && profile.display_name && (
                  <p className="text-muted-foreground">{profile.ens_name}</p>
                )}

                <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
                  <code className="text-sm text-muted-foreground">
                    {shortenAddress(profile.address, 6)}
                  </code>
                  <button
                    onClick={() => copy(profile.address)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    href={`https://etherscan.io/address/${profile.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                {/* Location and join date */}
                <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {format(new Date(profile.created_at), 'MMM yyyy')}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center sm:justify-end gap-3">
              <Button variant="outline">Message</Button>
              <Button variant="gradient">Follow</Button>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-4 max-w-2xl text-muted-foreground"
            >
              {profile.bio}
            </motion.p>
          )}

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex flex-wrap gap-6"
          >
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.followers}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.following}</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.badges}</div>
              <div className="text-sm text-muted-foreground">Badges</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text">{stats.points}</div>
              <div className="text-sm text-muted-foreground">Points</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
