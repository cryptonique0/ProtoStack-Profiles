'use client';

import { motion } from 'framer-motion';
import {
  Wallet,
  Shield,
  Image,
  Globe,
  Zap,
  Lock,
  Users,
  Trophy,
  Code,
  Database,
  Palette,
  Bell,
} from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'Multi-Wallet Support',
    description:
      'Connect with MetaMask, WalletConnect, Coinbase Wallet, and 100+ other wallets seamlessly.',
    color: 'from-web3-purple to-web3-blue',
  },
  {
    icon: Shield,
    title: 'On-Chain Verification',
    description:
      'Verify your identity on-chain with SIWE (Sign-In with Ethereum) and prove ownership.',
    color: 'from-web3-green to-web3-cyan',
  },
  {
    icon: Image,
    title: 'NFT Avatars',
    description:
      'Use any NFT from your wallet as your profile picture. Supports ENS avatars automatically.',
    color: 'from-web3-orange to-web3-pink',
  },
  {
    icon: Globe,
    title: 'Cross-Chain Profiles',
    description:
      'One profile across Ethereum, Polygon, Arbitrum, Optimism, Base, and more chains.',
    color: 'from-web3-blue to-web3-cyan',
  },
  {
    icon: Zap,
    title: 'Instant Updates',
    description:
      'Real-time profile updates with optimistic UI and background synchronization.',
    color: 'from-web3-purple to-web3-pink',
  },
  {
    icon: Lock,
    title: 'Privacy Controls',
    description:
      'Choose what to show publicly. Hide wallet balances, transaction history, or specific NFTs.',
    color: 'from-web3-green to-web3-blue',
  },
  {
    icon: Users,
    title: 'Social Graph',
    description:
      'Follow other profiles, build your network, and discover connections in the Web3 space.',
    color: 'from-web3-cyan to-web3-purple',
  },
  {
    icon: Trophy,
    title: 'Achievements & Badges',
    description:
      'Earn badges for on-chain activities, contributions, and milestones. Show off your Web3 journey.',
    color: 'from-web3-orange to-web3-green',
  },
  {
    icon: Code,
    title: 'Developer API',
    description:
      'Integrate ProtoStack Profiles into your dApp with our comprehensive REST and GraphQL APIs.',
    color: 'from-web3-blue to-web3-purple',
  },
  {
    icon: Database,
    title: 'IPFS Storage',
    description:
      'Profile data stored on IPFS for censorship resistance and true decentralization.',
    color: 'from-web3-pink to-web3-orange',
  },
  {
    icon: Palette,
    title: 'Custom Themes',
    description:
      'Personalize your profile with custom themes, colors, and layouts. Express yourself.',
    color: 'from-web3-cyan to-web3-green',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description:
      'Get notified about followers, mentions, and on-chain events related to your profile.',
    color: 'from-web3-purple to-web3-cyan',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function FeaturesSection() {
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
            Everything You Need for Your{' '}
            <span className="gradient-text">Web3 Identity</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            A comprehensive profile system built from prototype to production.
            Everything works out of the box.
          </motion.p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:shadow-lg"
            >
              {/* Gradient background on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity group-hover:opacity-5`}
              />
              
              <div
                className={`inline-flex rounded-xl bg-gradient-to-br ${feature.color} p-3 text-white`}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
