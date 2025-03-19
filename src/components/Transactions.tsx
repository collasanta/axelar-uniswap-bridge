"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRightLeft, ChevronDown, Clock, DollarSign, ExternalLink, Info, Loader, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TRANSACTION_STATUS } from "@/lib/constants";
import { type AxelarTransaction } from "@/lib/transaction-utils";
import { formatTimeAgo, shortenAddress, shortenTxHash } from "@/lib/utils";
import { getAxelarTransactions } from "@/server-actions/transactions";

// Use the AxelarTransaction type from transaction-utils.ts
type Transaction = AxelarTransaction;

export default function Transactions() {
  // Fetch recent transactions with infinite query - 5 items per page
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } = useInfiniteQuery({
    queryKey: ["transactions"],
    queryFn: ({ pageParam }) => getAxelarTransactions({ limit: 5, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If we got fewer results than requested, we've reached the end
      if (lastPage.transactions.length < 5) return undefined;
      return allPages.length * 5; // Next offset
    },
  });

  // Flatten all pages of transactions
  const transactions = data?.pages.flatMap((page) => page.transactions) || [];

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "executed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  return (
    <Card className="border rounded-xl shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Recent Axelar Transactions</h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-50"
              title="Refresh transactions"
            >
              <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} />
            </button>
            <button className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100">
              <Info size={16} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <>
            <div className="flex items-center justify-center mb-4 text-sm text-gray-500">
              <Loader className="h-4 w-4 mr-2 animate-spin text-pink-500" />
              <span>Loading transactions...</span>
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
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
          </>
        ) : isRefetching && (!transactions || transactions.length === 0) ? (
          <>
            <div className="flex items-center justify-center mb-4 text-sm text-gray-500">
              <Loader className="h-4 w-4 mr-2 animate-spin text-pink-500" />
              <span>Refreshing transactions...</span>
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-16" />
                  </div>

                  <div className="flex justify-between mt-2">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>

                  <div className="flex justify-between mt-2">
                    <Skeleton className="h-3 w-3/5" />
                    <Skeleton className="h-3 w-1/5" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : transactions && transactions.length > 0 ? (
          <>
            {isRefetching && (
              <div className="flex items-center justify-center mb-4 text-xs text-gray-500 bg-gray-50 py-1 rounded-lg">
                <Loader className="h-3 w-3 mr-1 animate-spin text-pink-500" />
                <span>Refreshing...</span>
              </div>
            )}
            <div className="space-y-3">
              {transactions.map((tx: Transaction) => (
                <div key={tx.id || tx.txHash} className="border rounded-xl p-3 text-sm hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="font-medium flex items-center">
                      {shortenTxHash(tx.txHash)}
                      {tx.amount > 0 && (
                        <span className="ml-2 flex items-center text-xs text-gray-500">
                          <DollarSign className="h-3 w-3 mr-0.5" />
                          {tx.amount.toFixed(2)} {tx.denom.toUpperCase().substring(0, 6)}
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
                      {tx.timeSpent > 0 && tx.status === "executed" && (
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
                    {isFetchingNextPage ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      <>
                        Load 5 more
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex flex-col items-center justify-center space-y-2">
              <AlertCircle className="h-5 w-5 text-gray-400" />
              <span>No recent transactions found</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
