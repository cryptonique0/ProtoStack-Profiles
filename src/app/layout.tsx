import { Toaster } from '@/components/ui/toaster';
import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'ProtoVM Profiles | Web3-Native User Profiles',
    template: '%s | ProtoVM Profiles',
  },
  description:
    'Create and manage your Web3-native user profile. Connect your wallet, showcase your NFTs, verify your identity on-chain, and build your decentralized reputation.',
  keywords: [
    'Web3',
    'Profile',
    'NFT',
    'Blockchain',
    'Ethereum',
    'ENS',
    'Decentralized Identity',
    'DID',
    'Wallet',
    'Crypto',
    'ProtoVM',
  ],
  authors: [{ name: 'ProtoVM', url: 'https://protovm.dev' }],
  creator: 'ProtoVM',
  publisher: 'ProtoVM',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'ProtoVM Profiles',
    title: 'ProtoVM Profiles | Web3-Native User Profiles',
    description:
      'Create and manage your Web3-native user profile. Connect your wallet, showcase your NFTs, verify your identity on-chain.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ProtoVM Profiles',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProtoVM Profiles | Web3-Native User Profiles',
    description:
      'Create and manage your Web3-native user profile. Connect your wallet, showcase your NFTs, verify your identity on-chain.',
    images: ['/og-image.png'],
    creator: '@protovm',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${mono.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
