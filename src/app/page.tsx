import { CTASection } from '@/components/landing/cta-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { HeroSection } from '@/components/landing/hero-section';
import { ProfileShowcase } from '@/components/landing/profile-showcase';
import { StatsSection } from '@/components/landing/stats-section';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ProtoVM Profiles | Web3-Native User Profiles',
  description:
    'Create your Web3 identity. Connect your wallet, showcase NFTs, verify on-chain, and build your decentralized reputation.',
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <ProfileShowcase />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
