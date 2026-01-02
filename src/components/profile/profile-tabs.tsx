'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Profile } from '@/types/database.types';
import { ProfileActivity } from './profile-activity';
import { ProfileBadges } from './profile-badges';
import { ProfileNFTs } from './profile-nfts';

interface ProfileTabsProps {
  profile: Profile;
}

export function ProfileTabs({ profile }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="activity" className="w-full">
      <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
        <TabsTrigger
          value="activity"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          Activity
        </TabsTrigger>
        {profile.show_nfts && (
          <TabsTrigger
            value="nfts"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            NFTs
          </TabsTrigger>
        )}
        {profile.show_badges && (
          <TabsTrigger
            value="badges"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Badges
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="activity" className="mt-6">
        <ProfileActivity address={profile.address} />
      </TabsContent>

      {profile.show_nfts && (
        <TabsContent value="nfts" className="mt-6">
          <ProfileNFTs address={profile.address} />
        </TabsContent>
      )}

      {profile.show_badges && (
        <TabsContent value="badges" className="mt-6">
          <ProfileBadges address={profile.address} />
        </TabsContent>
      )}
    </Tabs>
  );
}
