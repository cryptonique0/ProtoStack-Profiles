import { ExploreContent } from '@/components/explore/explore-content';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Profiles | ProtoStack Profiles',
  description: 'Discover amazing Web3 profiles and connect with the community',
};

export default function ExplorePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Explore <span className="gradient-text">Profiles</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover amazing Web3 profiles, find new connections, and explore
              the decentralized social graph
            </p>
          </div>
          <ExploreContent />
        </div>
      </main>
      <Footer />
    </div>
  );
}
