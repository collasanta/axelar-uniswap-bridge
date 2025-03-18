'use client';

import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ExternalLink, ArrowRightLeft, Info, Clock, DollarSign, ChevronDown } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchAxelarTransactions } from '@/lib/api';
import { shortenTxHash, shortenAddress, formatTimeAgo } from '@/lib/utils';
import { TRANSACTION_STATUS } from '@/lib/constants';

interface Transaction {
  id: string;
  txHash: string;
  sourceChain: string;
  destinationChain: string;
  status: string;
  amount: number;
  denom: string;
  senderAddress: string;
  recipientAddress: string;
  createdAt: number;
  timeSpent: number;
}

export default function Transactions() {
  // Add styles to prevent flickering on scroll
  React.useEffect(() => {
    // Add a style to prevent content jumping when scrollbar appears/disappears
    const style = document.createElement('style');
    style.textContent = `
      html {
        overflow-y: scroll;
      }
      
      /* Ensure consistent width even when scrollbar appears/disappears */
      body {
        overflow-x: visible;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch recent transactions with infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['transactions'],
    queryFn: ({ pageParam }) => fetchAxelarTransactions(10, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If we got fewer results than requested, we've reached the end
      if (lastPage.length < 10) return undefined;
      return allPages.length * 10; // Next offset
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000 // Refetch every 30 seconds
  });
  
  // Flatten all pages of transactions
  const transactions = data?.pages.flat() || [];

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <Card className="border rounded-xl shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Recent Axelar Transactions</h3>
          <button className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100">
            <Info size={16} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="border rounded-xl p-3 space-y-2">
                {/* Transaction header with hash and amount */}
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-16" />
                </div>
                
                {/* Chain info and status */}
                <div className="flex justify-between mt-2">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                
                {/* From/To addresses and time */}
                <div className="flex justify-between mt-2">
                  <Skeleton className="h-3 w-3/5" />
                  <Skeleton className="h-3 w-1/5" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((tx: Transaction) => (
              <div key={tx.id || tx.txHash} className="border rounded-xl p-3 text-sm hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="font-medium flex items-center">
                    {shortenTxHash(tx.txHash)}
                    {tx.amount > 0 && (
                      <span className="ml-2 flex items-center text-xs text-gray-500">
                        <DollarSign className="h-3 w-3 mr-0.5" />
                        {tx.amount} {tx.denom.toUpperCase().substring(0, 6)}
                      </span>
                    )}
                  </div>
                  <a
                    href={`https://axelarscan.io/transfer/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </a>
                </div>
                
                <div className="flex justify-between mt-2 text-gray-500">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 capitalize">{tx.sourceChain}</span>
                    <ArrowRightLeft size={14} className="mx-1 text-pink-500" />
                    <span className="font-medium text-gray-700 capitalize">{tx.destinationChain}</span>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(tx.status)}`}>
                    {(TRANSACTION_STATUS as Record<string, string>)[tx.status] || tx.status}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between mt-2 text-xs text-gray-500 gap-1">
                  <div className="flex items-center truncate">
                    <span className="truncate">From: {shortenAddress(tx.senderAddress)}</span>
                    <span className="mx-1 flex-shrink-0">•</span>
                    <span className="truncate">To: {shortenAddress(tx.recipientAddress)}</span>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="whitespace-nowrap">{formatTimeAgo(tx.createdAt)}</span>
                    {tx.timeSpent > 0 && tx.status === 'executed' && (
                      <span className="ml-1 whitespace-nowrap">(in {tx.timeSpent}s)</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Load more button */}
            {hasNextPage && (
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  {isFetchingNextPage ? 'Loading more...' : 'Load more'}
                  {!isFetchingNextPage && <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-xl border border-gray-100">
            No recent transactions found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
