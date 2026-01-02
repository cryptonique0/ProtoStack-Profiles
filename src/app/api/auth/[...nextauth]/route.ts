import NextAuth, { type DefaultSession, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import DiscordProvider from 'next-auth/providers/discord';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import TwitterProvider from 'next-auth/providers/twitter';
import { SiweMessage } from 'siwe';

// Extend the session type
declare module 'next-auth' {
  interface Session extends DefaultSession {
    address?: string;
    chainId?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    address?: string;
    chainId?: number;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // SIWE (Sign-In with Ethereum) Provider
    CredentialsProvider({
      id: 'siwe',
      name: 'Ethereum',
      credentials: {
        message: { label: 'Message', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.message || !credentials?.signature) {
            throw new Error('Missing credentials');
          }

          const siwe = new SiweMessage(JSON.parse(credentials.message));
          const result = await siwe.verify({
            signature: credentials.signature,
            domain: process.env.NEXTAUTH_URL
              ? new URL(process.env.NEXTAUTH_URL).host
              : 'localhost:3000',
          });

          if (result.success) {
            return {
              id: siwe.address,
              address: siwe.address,
              chainId: siwe.chainId,
            };
          }

          return null;
        } catch (error) {
          console.error('SIWE verification error:', error);
          return null;
        }
      },
    }),

    // GitHub OAuth
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || '',
      clientSecret: process.env.GOOGLE_SECRET || '',
    }),

    // Twitter OAuth
    TwitterProvider({
      clientId: process.env.TWITTER_ID || '',
      clientSecret: process.env.TWITTER_SECRET || '',
      version: '2.0',
    }),

    // Discord OAuth
    DiscordProvider({
      clientId: process.env.DISCORD_ID || '',
      clientSecret: process.env.DISCORD_SECRET || '',
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.address = (user as any).address;
        token.chainId = (user as any).chainId;
      }

      // Link OAuth accounts
      if (account && account.provider !== 'siwe') {
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }

      return token;
    },

    async session({ session, token }) {
      if (token.address) {
        session.address = token.address as string;
        session.chainId = token.chainId as number;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
