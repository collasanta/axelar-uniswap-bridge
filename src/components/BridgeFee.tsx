"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronDown, ChevronUp, Clock, DollarSign, Info, Layers, X, Zap } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getBridgeFee, getBridgeTime } from "@/server-actions/bridge";
import { formatCurrency, formatTimeRange } from "@/lib/utils";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@radix-ui/react-dialog";
import { DialogHeader } from "./ui/dialog";

interface BridgeFeeProps {
  sourceChain: string;
  destinationChain: string;
  token: string;
}

// Define interface for fee details
interface FeeDetails {
  baseFee: string;
  executionFee: string;
  gasMultiplier: number;
}

// Fee Breakdown component for detailed fee information
function FeeBreakdown({ details }: { details: FeeDetails }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-gray-200 pt-2 mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-800"
      >
        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-blue-500" />
          <span>Fee Breakdown</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 pl-6 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Base Fee</span>
            <span>{details.baseFee}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Execution Fee</span>
            <span>{details.executionFee}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Gas Multiplier</span>
            <span>{details.gasMultiplier}x</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
            <Info className="h-3 w-3" />
            <span>Fees vary based on network conditions</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BridgeFee({ sourceChain, destinationChain, token }: BridgeFeeProps) {
  // Fetch bridge fee
  const {
    data: bridgeFee,
    isLoading: isBridgeFeeLoading,
    error: bridgeFeeError,
  } = useQuery({
    queryKey: ["bridgeFee", sourceChain, destinationChain, token],
    queryFn: () => getBridgeFee({ sourceChain, destinationChain, tokenSymbol: token, amount: '1' }),
    enabled: !!sourceChain && !!destinationChain && !!token && sourceChain !== destinationChain,
    staleTime: 60000, // 1 minute
  });

  // Fetch bridge time estimate
  const {
    data: bridgeTime,
    isLoading: isBridgeTimeLoading,
    error: bridgeTimeError,
  } = useQuery({
    queryKey: ["bridgeTime", sourceChain, destinationChain],
    queryFn: () => getBridgeTime({ sourceChain, destinationChain }),
    enabled: !!sourceChain && !!destinationChain && sourceChain !== destinationChain,
    staleTime: 60000, // 1 minute
  });

  return (
    <Card className="border rounded-xl shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Bridge Fee Estimate</CardTitle>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100">
            <Info size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isBridgeFeeLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : bridgeFeeError ? (
          <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center space-x-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span>Error loading fee estimates</span>
            </div>
          </div>
        ) : bridgeFee ? (
          <div className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
            {/* Total Fee Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-pink-500" />
                  <span className="text-gray-700 font-medium">Total Fee</span>
                </div>
                <span className="font-semibold text-base">
                  {bridgeFee.fee} {bridgeFee.token}
                </span>
              </div>
              {bridgeFee.usd && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">USD Equivalent</span>
                  <span className="font-medium">{formatCurrency(bridgeFee.usd)}</span>
                </div>
              )}
            </div>

            {/* Fee Breakdown Section */}
            {bridgeFee.details && <FeeBreakdown details={bridgeFee.details} />}

            {/* Bridge Time Estimate */}
            {bridgeTimeError ? (
              <div className="flex items-center space-x-2 text-sm border-t pt-3 mt-1">
                <Clock className="h-4 w-4 text-pink-500" />
                <span className="text-gray-500">Estimated Time:</span>
                <span className="text-red-500 text-sm">Error loading time</span>
              </div>
            ) : (
              bridgeTime && (
                <div className="flex items-center space-x-2 text-sm border-t pt-3 mt-1">
                  <Clock className="h-4 w-4 text-pink-500" />
                  <span className="text-gray-500">Estimated Time:</span>
                  <span className="font-medium">{formatTimeRange(bridgeTime.min, bridgeTime.max)}</span>

                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="ml-auto text-xs text-blue-500 hover:text-blue-700 flex items-center">
                        <Info className="h-3 w-3 mr-1" />
                        <span>Details</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <div className="flex items-center justify-between">
                          <DialogTitle>Bridging Time Details</DialogTitle>
                          <DialogClose className="rounded-full hover:bg-gray-100 p-1">
                            <X className="h-4 w-4" />
                          </DialogClose>
                        </div>
                        <DialogDescription>Estimated time for cross-chain transactions via Axelar Network</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Estimated Total Time</h4>
                          <div className="flex items-center p-3 bg-pink-50 rounded-lg border border-pink-100">
                            <Clock className="h-5 w-5 text-pink-500 mr-2" />
                            <div>
                              <p className="font-semibold">
                                {bridgeTime.min} - {bridgeTime.max} minutes
                              </p>
                              <p className="text-xs text-gray-500">
                                From {sourceChain} to {destinationChain}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Blockchain Finality Times</h4>
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Blockchain
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Finality Time
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                <tr>
                                  <td className="px-4 py-2 capitalize">{sourceChain}</td>
                                  <td className="px-4 py-2 text-right">
                                    {Math.round(((bridgeTime.min + bridgeTime.max) / 2) * 0.6)} min
                                  </td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 capitalize">{destinationChain}</td>
                                  <td className="px-4 py-2 text-right">
                                    {Math.round(((bridgeTime.min + bridgeTime.max) / 2) * 0.4)} min
                                  </td>
                                </tr>
                                <tr className="bg-gray-50">
                                  <td className="px-4 py-2 font-medium">Axelar Processing</td>
                                  <td className="px-4 py-2 text-right">~2 min</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Note: Actual bridging times may vary based on network conditions. These estimates are based on typical
                            finality times for each blockchain.
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )
            )}

            <Button
              className="w-full mt-6 bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-full font-medium transition-colors"
              disabled={isBridgeFeeLoading || isBridgeTimeLoading || !!bridgeFeeError || !!bridgeTimeError}
            >
              <div className="flex items-center justify-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Bridge Tokens</span>
              </div>
            </Button>
          </div>
        ) : (
          <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 border border-gray-100">
            {sourceChain === destinationChain
              ? "Source and destination chains must be different"
              : "Unable to fetch bridge fee. Please try again later."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
