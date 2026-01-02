'use client';

import { PostHogProvider } from '@/lib/posthog';
import { wagmiConfig } from '@/lib/wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState, type ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Prevent SSR issues with Web3 providers
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {mounted ? (
            <WagmiProvider config={wagmiConfig}>
              <RainbowKitProvider
                theme={{
                  lightMode: lightTheme({
                    accentColor: '#3B82F6',
                    accentColorForeground: 'white',
                    borderRadius: 'large',
                    fontStack: 'system',
                  }),
                  darkMode: darkTheme({
                    accentColor: '#3B82F6',
                    accentColorForeground: 'white',
                    borderRadius: 'large',
                    fontStack: 'system',
                  }),
                }}
                modalSize="compact"
                appInfo={{
                  appName: 'ProtoVM Profiles',
                  learnMoreUrl: 'https://protovm.dev/profiles',
                }}
              >
                <PostHogProvider>{children}</PostHogProvider>
              </RainbowKitProvider>
              <ReactQueryDevtools initialIsOpen={false} />
            </WagmiProvider>
          ) : (
            <PostHogProvider>{children}</PostHogProvider>
          )}
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
