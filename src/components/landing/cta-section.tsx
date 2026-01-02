'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Github, Rocket } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-web3-purple/10 via-web3-blue/10 to-web3-cyan/10" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background to-background" />

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Ready to Build Your{' '}
            <span className="gradient-text">Web3 Identity</span>?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Join thousands of builders, creators, and collectors who trust ProtoStack Profiles
            for their decentralized identity.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="wallet-button group" asChild>
              <Link href="/profile/create">
                <Rocket className="mr-2 h-5 w-5" />
                Create Your Profile
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link
                href="https://github.com/cryptonique0/ProtoStack-Profiles"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </Link>
            </Button>
          </div>

          {/* Tech stack */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-16"
          >
            <p className="mb-4 text-sm text-muted-foreground">
              Built with the ProtoStack
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              {[
                'Next.js 14',
                'Tailwind CSS',
                'Wagmi',
                'RainbowKit',
                'Supabase',
                'IPFS',
                'Zustand',
                'TypeScript',
              ].map((tech) => (
                <span key={tech} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-web3-purple to-web3-blue" />
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
