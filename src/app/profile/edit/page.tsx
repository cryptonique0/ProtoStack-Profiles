'use client';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { ProfileEditForm } from '@/components/profile/profile-edit-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useAccount } from 'wagmi';

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const { address, isConnected } = useAccount();

  // Require authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-2xl mx-auto space-y-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (status === 'unauthenticated' || !isConnected) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
          <ProfileEditForm address={address!} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
