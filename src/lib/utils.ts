import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BLOCKCHAIN_FINALITY_TIMES } from "./constants";

/**
 * Combines Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as a currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount);
}

/**
 * Shortens a blockchain address for display
 */
export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Shortens a transaction hash for display
 */
export function shortenTxHash(hash: string): string {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

/**
 * Formats a timestamp as a human-readable time ago string
 */
export function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return 'Unknown time';
  
  const now = Date.now();
  const secondsAgo = Math.floor((now - timestamp) / 1000);
  
  if (secondsAgo < 60) {
    return `${secondsAgo} seconds ago`;
  }
  
  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) {
    return `${minutesAgo} ${minutesAgo === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) {
    return `${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 30) {
    return `${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`;
  }
  
  const monthsAgo = Math.floor(daysAgo / 30);
  return `${monthsAgo} ${monthsAgo === 1 ? 'month' : 'months'} ago`;
}

/**
 * Estimates the time it takes to bridge assets between two chains using Axelar
 * @param sourceChain The source chain name (e.g., 'ethereum', 'polygon')
 * @param destinationChain The destination chain name (e.g., 'avalanche', 'fantom')
 * @returns An object with estimated time in minutes and a formatted string
 */
export function estimateBridgingTime(sourceChain: string, destinationChain: string): { minutes: number; formatted: string } {
  // Normalize chain names to lowercase
  const source = sourceChain.toLowerCase();
  const destination = destinationChain.toLowerCase();
  
  // Get finality times for both chains
  const sourceTime = BLOCKCHAIN_FINALITY_TIMES[source as keyof typeof BLOCKCHAIN_FINALITY_TIMES] || 5; // Default to 5 minutes if chain not found
  const destTime = BLOCKCHAIN_FINALITY_TIMES[destination as keyof typeof BLOCKCHAIN_FINALITY_TIMES] || 5;
  
  // Total estimated time is the sum of both chains' finality times
  // Plus a small buffer for Axelar network processing (2 minutes)
  const totalMinutes = sourceTime + destTime + 2;
  
  // Format the time string
  let formatted: string;
  if (totalMinutes < 1) {
    formatted = `${Math.round(totalMinutes * 60)} seconds`;
  } else if (totalMinutes < 60) {
    const minutes = Math.floor(totalMinutes);
    const seconds = Math.round((totalMinutes - minutes) * 60);
    formatted = minutes > 0 
      ? `${minutes} min${minutes !== 1 ? 's' : ''}${seconds > 0 ? ` ${seconds} sec` : ''}` 
      : `${seconds} seconds`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    formatted = `${hours} hr${hours !== 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} min` : ''}`;
  }
  
  return {
    minutes: totalMinutes,
    formatted
  };
}
