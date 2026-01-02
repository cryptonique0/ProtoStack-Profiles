'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Wallet, Shield, Sparkles, Globe } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const { isConnected, address } = useAccount();
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-web3-purple/10 via-transparent to-web3-cyan/10" />
        <div className="absolute left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-web3-purple/20 to-transparent blur-3xl" />
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[10%] top-[20%] h-24 w-24 rounded-2xl bg-gradient-to-br from-web3-purple to-web3-blue opacity-20 blur-xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-[15%] top-[30%] h-32 w-32 rounded-full bg-gradient-to-br from-web3-cyan to-web3-green opacity-20 blur-xl"
        />
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[20%] left-[20%] h-20 w-20 rounded-full bg-gradient-to-br from-web3-orange to-web3-pink opacity-20 blur-xl"
        />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-web3-purple/20 bg-web3-purple/10 px-4 py-2 text-sm text-web3-purple"
          >
            <Sparkles className="h-4 w-4" />
            <span>Now with ENS integration & NFT avatars</span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
          >
            Your{' '}
            <span className="gradient-text">Web3 Identity</span>
            <br />
            Starts Here
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Create your decentralized profile. Connect your wallet, showcase your NFTs,
            verify your identity on-chain, and build your Web3 reputation across the ecosystem.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            {isConnected ? (
              <Button
                size="lg"
                className="wallet-button group"
                asChild
              >
                <Link href={`/profile/${address}`}>
                  <Wallet className="mr-2 h-5 w-5" />
                  View My Profile
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <Button
                    size="lg"
                    className="wallet-button group"
                    onClick={openConnectModal}
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect Wallet
                  </Button>
                )}
              </ConnectButton.Custom>
            )}
            <Button variant="outline" size="lg" asChild>
              <Link href="/explore">
                <Globe className="mr-2 h-5 w-5" />
                Explore Profiles
              </Link>
            </Button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-web3-green" />
              <span>On-chain Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-web3-blue" />
              <span>Multi-chain Support</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-web3-purple" />
              <span>NFT Avatars</span>
            </div>
          </motion.div>
        </div>

        {/* Hero image/mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="gradient-border rounded-2xl p-1">
            <div className="rounded-xl bg-background/95 p-4 backdrop-blur">
              <div className="aspect-[16/9] rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-gradient-to-br from-web3-purple to-web3-blue" />
                  <div className="h-4 w-32 mx-auto rounded bg-muted-foreground/20 mb-2" />
                  <div className="h-3 w-48 mx-auto rounded bg-muted-foreground/10" />
                  <div className="mt-6 flex justify-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-muted-foreground/10" />
                    <div className="h-8 w-8 rounded-lg bg-muted-foreground/10" />
                    <div className="h-8 w-8 rounded-lg bg-muted-foreground/10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow effect */}
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-web3-purple/20 via-web3-blue/20 to-web3-cyan/20 blur-2xl" />
        </motion.div>
      </div>
    </section>
  );
}
