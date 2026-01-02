'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { generateGradient, shortenAddress } from '@/lib/utils';
import type { Profile } from '@/types/database.types';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import Link from 'next/link';

interface ProfileCardProps {
  profile: Profile;
  index: number;
}

export function ProfileCard({ profile, index }: ProfileCardProps) {
  const gradient = generateGradient(profile.address);
  const displayName =
    profile.display_name || profile.ens_name || shortenAddress(profile.address);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link
        href={`/profile/${profile.username || profile.address}`}
        className="block"
      >
        <div className="group relative rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all hover:border-primary/50">
          {/* Cover */}
          <div className="h-20">
            {profile.cover_url ? (
              <img
                src={profile.cover_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className={`h-full w-full bg-gradient-to-br ${gradient} opacity-50`} />
            )}
          </div>

          {/* Content */}
          <div className="p-4 pt-0">
            {/* Avatar */}
            <div className="relative -mt-8 mb-3">
              <Avatar className="h-14 w-14 border-4 border-card">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback
                  className={`bg-gradient-to-br ${gradient} text-white`}
                >
                  {displayName[0]}
                </AvatarFallback>
              </Avatar>
              {profile.is_verified && (
                <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-0.5">
                  <BadgeCheck className="h-4 w-4 text-web3-blue" />
                </div>
              )}
            </div>

            {/* Name and address */}
            <div className="mb-2">
              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                {displayName}
              </h3>
              {profile.ens_name && profile.display_name && (
                <p className="text-sm text-muted-foreground truncate">
                  {profile.ens_name}
                </p>
              )}
              {!profile.ens_name && (
                <p className="text-xs text-muted-foreground font-mono">
                  {shortenAddress(profile.address, 4)}
                </p>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {profile.bio}
              </p>
            )}

            {/* Tags/badges */}
            <div className="flex flex-wrap gap-1">
              {profile.is_premium && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-web3-purple to-web3-pink text-white">
                  PRO
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
