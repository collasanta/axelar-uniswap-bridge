import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
 * Formats a time range in minutes to a human-readable string
 * @param min Minimum time in minutes
 * @param max Maximum time in minutes
 * @returns A formatted time string
 */
export function formatTimeRange(min: number, max: number): string {
  // Helper function to format a single time value
  const formatTime = (minutes: number): string => {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)} seconds`;
    } else if (minutes < 60) {
      const mins = Math.floor(minutes);
      const seconds = Math.round((minutes - mins) * 60);
      return mins > 0 
        ? `${mins} min${mins !== 1 ? 's' : ''}${seconds > 0 ? ` ${seconds} sec` : ''}` 
        : `${seconds} seconds`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours} hr${hours !== 1 ? 's' : ''}${mins > 0 ? ` ${mins} min` : ''}`;
    }
  };
  
  // If min and max are close, just show one value
  if (max - min <= 2) {
    const avg = (min + max) / 2;
    return formatTime(avg);
  }
  
  // Otherwise show the range
  return `${formatTime(min)} - ${formatTime(max)}`;
}
