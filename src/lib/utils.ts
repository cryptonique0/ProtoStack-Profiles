import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidENS(name: string): boolean {
  return /^[a-zA-Z0-9-]+\.eth$/.test(name);
}

export function getIPFSUrl(hash: string): string {
  if (!hash) return '';
  if (hash.startsWith('ipfs://')) {
    hash = hash.replace('ipfs://', '');
  }
  return `${process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'}${hash}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function generateGradient(address: string): string {
  if (!address) return 'from-gray-400 to-gray-600';
  
  const colors = [
    'from-web3-purple to-web3-blue',
    'from-web3-blue to-web3-cyan',
    'from-web3-cyan to-web3-green',
    'from-web3-green to-web3-orange',
    'from-web3-orange to-web3-pink',
    'from-web3-pink to-web3-purple',
  ];
  
  const hash = address.slice(2, 10);
  const index = parseInt(hash, 16) % colors.length;
  return colors[index];
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
