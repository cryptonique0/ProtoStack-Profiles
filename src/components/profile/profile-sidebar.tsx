'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProfileStats } from '@/types';
import type { Profile } from '@/types/database.types';
import { Github, Globe, Mail, MessageCircle, Send, Twitter } from 'lucide-react';

interface ProfileSidebarProps {
  profile: Profile;
  stats: ProfileStats;
}

const socialLinks = [
  { key: 'website', icon: Globe, prefix: '' },
  { key: 'twitter', icon: Twitter, prefix: 'https://twitter.com/' },
  { key: 'github', icon: Github, prefix: 'https://github.com/' },
  { key: 'discord', icon: MessageCircle, prefix: '' },
  { key: 'telegram', icon: Send, prefix: 'https://t.me/' },
  { key: 'email', icon: Mail, prefix: 'mailto:' },
];

export function ProfileSidebar({ profile, stats }: ProfileSidebarProps) {
  const hasSocialLinks = socialLinks.some(
    (link) => profile[link.key as keyof Profile]
  );

  return (
    <div className="space-y-6">
      {/* Social links */}
      {hasSocialLinks && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {socialLinks.map((link) => {
              const value = profile[link.key as keyof Profile] as string;
              if (!value) return null;

              const href = link.prefix
                ? `${link.prefix}${value}`
                : value.startsWith('http')
                ? value
                : `https://${value}`;

              return (
                <a
                  key={link.key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <link.icon className="h-4 w-4" />
                  <span className="text-sm truncate">
                    {value.replace(/^https?:\/\//, '')}
                  </span>
                </a>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{stats.nfts}</div>
              <div className="text-xs text-muted-foreground">NFTs</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{stats.activities}</div>
              <div className="text-xs text-muted-foreground">Activities</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Address</span>
            <code className="text-xs">
              {profile.address.slice(0, 6)}...{profile.address.slice(-4)}
            </code>
          </div>
          {profile.ens_name && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ENS</span>
              <span className="text-sm font-medium">{profile.ens_name}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification status */}
      {profile.is_verified && (
        <Card className="border-web3-blue/20 bg-web3-blue/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-web3-blue/10 flex items-center justify-center">
                <span className="text-web3-blue text-lg">✓</span>
              </div>
              <div>
                <p className="font-medium">Verified Profile</p>
                <p className="text-sm text-muted-foreground">
                  This profile has been verified on-chain
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
