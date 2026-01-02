import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { LeaderboardContent } from '@/components/leaderboard/leaderboard-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard | ProtoVM Profiles',
  description: 'See the top Web3 profiles ranked by points, badges, and followers',
};

export default function LeaderboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h1 className="mb-4 text-4xl font-bold">
              Profile <span className="gradient-text">Leaderboard</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover the most active and engaged members of the community
            </p>
          </div>
          <LeaderboardContent />
        </div>
      </main>
      <Footer />
    </div>
  );
}
