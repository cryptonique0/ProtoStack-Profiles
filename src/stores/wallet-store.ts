import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Address } from 'viem';

interface WalletState {
  // Connection state
  isConnected: boolean;
  address: Address | null;
  chainId: number | null;
  ensName: string | null;
  ensAvatar: string | null;

  // Previous connections (for quick reconnect)
  recentAddresses: Address[];

  // Actions
  setConnected: (connected: boolean) => void;
  setAddress: (address: Address | null) => void;
  setChainId: (chainId: number | null) => void;
  setENS: (name: string | null, avatar: string | null) => void;
  addRecentAddress: (address: Address) => void;
  reset: () => void;
}

const initialState = {
  isConnected: false,
  address: null,
  chainId: null,
  ensName: null,
  ensAvatar: null,
  recentAddresses: [],
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      ...initialState,

      setConnected: (isConnected) => set({ isConnected }),
      
      setAddress: (address) =>
        set((state) => {
          if (address && !state.recentAddresses.includes(address)) {
            return {
              address,
              recentAddresses: [address, ...state.recentAddresses].slice(0, 5),
            };
          }
          return { address };
        }),
      
      setChainId: (chainId) => set({ chainId }),
      
      setENS: (ensName, ensAvatar) => set({ ensName, ensAvatar }),
      
      addRecentAddress: (address) =>
        set((state) => ({
          recentAddresses: [
            address,
            ...state.recentAddresses.filter((a) => a !== address),
          ].slice(0, 5),
        })),
      
      reset: () =>
        set((state) => ({
          ...initialState,
          recentAddresses: state.recentAddresses,
        })),
    }),
    {
      name: 'protostack-wallet',
      partialize: (state) => ({
        recentAddresses: state.recentAddresses,
      }),
    }
  )
);
