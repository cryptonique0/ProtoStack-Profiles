'use client';

import { motion } from 'framer-motion';
import { BadgeCheck, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const showcaseProfiles = [
  {
    name: 'vitalik.eth',
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    avatar: '/avatars/demo-1.svg',
    bio: 'Ethereum co-founder',
    verified: true,
    badges: ['OG', 'Builder', 'Whale'],
    followers: 125000,
  },
  {
    name: 'punk6529.eth',
    address: '0xc6b0562605D35eE710138402B878ffe6F2E23807',
    avatar: '/avatars/demo-2.svg',
    bio: 'NFT collector & thought leader',
    verified: true,
    badges: ['Collector', 'Whale'],
    followers: 89000,
  },
  {
    name: 'sassal.eth',
    address: '0x648aA14e4424e0825A5cE739C8C68610e143FB79',
    avatar: '/avatars/demo-3.svg',
    bio: 'Daily Gwei & EthHub',
    verified: true,
    badges: ['Educator', 'Builder'],
    followers: 67000,
  },
  {
    name: 'cobie.eth',
    address: '0x4e5B2e1dc63F6b91cb6Cd759936495434C7e972F',
    avatar: '/avatars/demo-4.svg',
    bio: 'UpOnly Podcast',
    verified: true,
    badges: ['Influencer', 'Trader'],
    followers: 234000,
  },
];

export function ProfileShowcase() {
  return (
    <section className="py-20 sm:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Join the <span className="gradient-text">Community</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Thousands of Web3 builders, collectors, and enthusiasts already using ProtoStack Profiles.
          </motion.p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {showcaseProfiles.map((profile, index) => (
            <motion.div
              key={profile.address}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group profile-card card-hover"
            >
              {/* Background gradient */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-web3-purple/5 via-transparent to-web3-cyan/5 opacity-0 transition-opacity group-hover:opacity-100" />

              {/* Avatar */}
              <div className="relative mx-auto h-20 w-20">
                <div className="nft-frame h-full w-full">
                  <div className="nft-frame-inner flex h-full w-full items-center justify-center overflow-hidden rounded-full">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-web3-purple to-web3-blue" />
                  </div>
                </div>
                {profile.verified && (
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
                    <BadgeCheck className="h-5 w-5 text-web3-blue" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="mt-4 text-center">
                <h3 className="font-semibold">{profile.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                  {profile.bio}
                </p>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap justify-center gap-1">
                  {profile.badges.slice(0, 2).map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs"
                    >
                      {badge}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="mt-4 text-sm text-muted-foreground">
                  {(profile.followers / 1000).toFixed(0)}K followers
                </div>
              </div>

              {/* Hover link */}
              <Link
                href={`/profile/${profile.name}`}
                className="absolute inset-0 z-10"
              >
                <span className="sr-only">View profile</span>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            Explore all profiles
            <ExternalLink className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
