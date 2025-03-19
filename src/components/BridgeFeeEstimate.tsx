"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CHAINS } from "@/lib/constants";
import { formatCurrency, formatTimeRange } from "@/lib/utils";
import { Clock, DollarSign, ExternalLink } from "lucide-react";
import Image from "next/image";

interface BridgeFeeEstimateProps {
  sourceChain: string;
  setSourceChain: (value: string) => void;
  destinationChain: string;
  setDestinationChain: (value: string) => void;
  handleSwapChains: () => void;
  isBridgeFeeLoading: boolean;
  bridgeFee: {
    fee: string;
    token: string;
    usd?: number;
    nativeToken?: {
      fee: string;
      token: string;
    };
  } | null;
  bridgeTime: {
    min: number;
    max: number;
  } | null;
}

// Helper function to get the chain icon
function getChainIcon(chainId: string): string {
  const chainIconMap: Record<string, string> = {
    ethereum: "/images/eth.svg",
    polygon: "/images/matic.svg",
    avalanche: "/images/atom.svg", // Using atom as a fallback
    fantom: "/images/atom.svg",    // Using atom as a fallback
    arbitrum: "/images/eth.svg",   // Using eth as a fallback
    optimism: "/images/eth.svg",   // Using eth as a fallback
    binance: "/images/bnb.svg",
  };

  return chainIconMap[chainId] || "/images/atom.svg";
}

export function BridgeFeeEstimate({
  sourceChain,
  setSourceChain,
  destinationChain,
  setDestinationChain,
  handleSwapChains,
  isBridgeFeeLoading,
  bridgeFee,
  bridgeTime,
}: BridgeFeeEstimateProps) {
  // Handle source chain change with automatic swap if same chain is selected
  const handleSourceChainChange = (value: string) => {
    // If the selected source chain is the same as the destination chain
    if (value === destinationChain) {
      // Set source chain to the new value
      setSourceChain(value);
      // Set destination chain to the previous source chain (swap them)
      setDestinationChain(sourceChain);
    } else {
      // Normal case - just update the source chain
      setSourceChain(value);
    }
  };

  // Handle destination chain change with automatic swap if same chain is selected
  const handleDestinationChainChange = (value: string) => {
    // If the selected destination chain is the same as the source chain
    if (value === sourceChain) {
      // Set destination chain to the new value
      setDestinationChain(value);
      // Set source chain to the previous destination chain (swap them)
      setSourceChain(destinationChain);
    } else {
      // Normal case - just update the destination chain
      setDestinationChain(value);
    }
  };
  return (
    <div className="space-y-1 pt-1 border-t">
      {/* Source Chain */}
      <div className="mb-2 mt-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-500 pl-2">Source Chain</label>
        </div>
        <Select value={sourceChain} onValueChange={handleSourceChainChange}>
          <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50 hover:bg-gray-100">
            <SelectValue placeholder="Select source chain">
              {sourceChain && (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden">
                    <Image 
                      src={getChainIcon(sourceChain)} 
                      alt={CHAINS[sourceChain as keyof typeof CHAINS]?.name || sourceChain}
                      width={20}
                      height={20}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span>{CHAINS[sourceChain as keyof typeof CHAINS]?.name}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CHAINS).map(([id, chain]) => (
              <SelectItem key={id} value={id}>
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden">
                    <Image 
                      src={getChainIcon(id)} 
                      alt={chain.name}
                      width={20}
                      height={20}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span>{chain.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Destination Chain */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-500 pl-2">Destination Chain</label>
          <Button variant="ghost" size="icon" onClick={handleSwapChains} className="text-gray-500 hover:text-gray-700"></Button>
        </div>
        <Select value={destinationChain} onValueChange={handleDestinationChainChange}>
          <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50 hover:bg-gray-100">
            <SelectValue placeholder="Select destination chain">
              {destinationChain && (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden">
                    <Image 
                      src={getChainIcon(destinationChain)} 
                      alt={CHAINS[destinationChain as keyof typeof CHAINS]?.name || destinationChain}
                      width={20}
                      height={20}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span>{CHAINS[destinationChain as keyof typeof CHAINS]?.name}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CHAINS).map(([id, chain]) => (
              <SelectItem key={id} value={id} disabled={id === sourceChain}>
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden">
                    <Image 
                      src={getChainIcon(id)} 
                      alt={chain.name}
                      width={20}
                      height={20}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span>{chain.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isBridgeFeeLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : bridgeFee ? (
        <div className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4 text-blue-500" />
                <span className="text-gray-700">Gas Fee</span>
              </div>
              <span className="font-medium">
                {bridgeFee.fee} {bridgeFee.token}
              </span>
            </div>
            {/* Display native token fee if available */}
            {bridgeFee.nativeToken && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">Native Fee</span>
                </div>
                <span className="font-medium">
                  {bridgeFee.nativeToken.fee} {bridgeFee.nativeToken.token}
                </span>
              </div>
            )}
            {bridgeFee.usd && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700">USD Equivalent</span>
                </div>
                <span className="font-medium">{formatCurrency(bridgeFee.usd)}</span>
              </div>
            )}
          </div>

          {/* Bridge Time Estimate */}
          {bridgeTime && (
            <div className="flex items-center justify-between text-sm border-t pt-3 mt-1">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-pink-500" />
                <span className="text-gray-700">Estimated Time</span>
              </div>
              <span className="font-medium">
                {formatTimeRange(bridgeTime.min, bridgeTime.max)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 border border-gray-100">
          {sourceChain === destinationChain
            ? "Source and destination chains must be different"
            : "Unable to fetch bridge fee. Please try again later."}
        </div>
      )}
    </div>
  );
}
