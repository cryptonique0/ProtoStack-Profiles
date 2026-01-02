import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileSidebar } from '@/components/profile/profile-sidebar';
import { ProfileTabs } from '@/components/profile/profile-tabs';
import { ProfileService } from '@/services/profile-service';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface ProfilePageProps {
  params: { identifier: string };
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { identifier } = params;

  // Try to fetch profile by address or username/ENS
  let profile;
  if (identifier.startsWith('0x')) {
    profile = await ProfileService.getByAddress(identifier);
  } else {
    profile = await ProfileService.getByUsername(identifier);
  }

  if (!profile) {
    return {
      title: 'Profile Not Found',
    };
  }

  const displayName = profile.display_name || profile.ens_name || profile.address.slice(0, 10);

  return {
    title: `${displayName} | ProtoVM Profiles`,
    description: profile.bio || `View ${displayName}'s Web3 profile on ProtoVM`,
    openGraph: {
      title: `${displayName} | ProtoVM Profiles`,
      description: profile.bio || `View ${displayName}'s Web3 profile on ProtoVM`,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { identifier } = params;

  // Try to fetch profile by address or username/ENS
  let profile;
  if (identifier.startsWith('0x')) {
    profile = await ProfileService.getByAddress(identifier);
  } else {
    profile = await ProfileService.getByUsername(identifier);
  }

  if (!profile) {
    notFound();
  }

  const stats = await ProfileService.getStats(profile.address);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <ProfileHeader profile={profile} stats={stats} />
        <div className="container py-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <ProfileTabs profile={profile} />
            <ProfileSidebar profile={profile} stats={stats} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
