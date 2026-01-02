import { ExploreContent } from '@/components/explore/explore-content';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Profiles | ProtoVM Profiles',
  description: 'Discover amazing Web3 profiles and connect with the community',
};

export default function ExplorePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h1 className="mb-4 text-4xl font-bold">
              Explore <span className="gradient-text">Profiles</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover amazing Web3 profiles, find new connections, and explore the decentralized
              social graph
            </p>
          </div>
          <ExploreContent />
        </div>
      </main>
      <Footer />
    </div>
  );
}
