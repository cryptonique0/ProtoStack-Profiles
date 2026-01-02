'use client';

import { useAccount, useEnsName, useEnsAvatar, useBalance, useChainId } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import type { Web3Profile } from '@/types';

export function useWeb3Profile(): Web3Profile | null {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id,
  });

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ?? undefined,
    chainId: mainnet.id,
  });

  const { data: balance } = useBalance({
    address,
  });

  if (!isConnected || !address) {
    return null;
  }

  return {
    address,
    ensName,
    ensAvatar,
    balance: balance?.formatted,
    chainId,
  };
}
