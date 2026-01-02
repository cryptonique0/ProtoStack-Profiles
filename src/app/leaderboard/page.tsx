import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { LeaderboardContent } from '@/components/leaderboard/leaderboard-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard | ProtoStack Profiles',
  description: 'See the top Web3 profiles ranked by points, badges, and followers',
};

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Profile <span className="gradient-text">Leaderboard</span>
            </h1>
            <p className="text-muted-foreground text-lg">
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
