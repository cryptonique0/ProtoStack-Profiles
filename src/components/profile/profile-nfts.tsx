'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ProfileNFTsProps {
  address: string;
}

export function ProfileNFTs({ address }: ProfileNFTsProps) {
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Note: In production, you'd fetch NFTs from an indexer like Alchemy, Moralis, or OpenSea
  // This is a placeholder implementation

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square rounded-xl overflow-hidden">
            <Skeleton className="h-full w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <span className="text-2xl">🖼️</span>
        </div>
        <p className="text-muted-foreground">No NFTs found</p>
        <p className="text-sm text-muted-foreground mt-1">
          NFTs owned by this address will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {nfts.map((nft, index) => (
        <motion.div
          key={nft.tokenId}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="group relative aspect-square rounded-xl overflow-hidden border bg-muted cursor-pointer"
        >
          <img
            src={nft.image}
            alt={nft.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white font-medium truncate">{nft.name}</p>
              <p className="text-white/70 text-sm truncate">{nft.collection.name}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
