"use client";

import { Button } from "@/components/ui/button";
import { TOKENS } from "@/lib/constants";
import { ArrowDown } from "lucide-react";
import Image from "next/image";

import { Skeleton } from "@/components/ui/skeleton";

interface BridgeSelectionProps {
  inputAmount: string;
  setInputAmount: (value: string) => void;
  bridgeFee: {
    fee: string;
    token: string;
    usd?: number;
    details?: { baseFee: string; executionFee: string; gasMultiplier: number };
  } | null;
  isBridgeFeeLoading?: boolean;
}

export function BridgeSelection({ inputAmount, setInputAmount, bridgeFee, isBridgeFeeLoading = false }: BridgeSelectionProps) {
  // Calculate the output amount (input amount minus fee)
  const calculateBridgeOutput = () => {
    // Early return for invalid input
    if (!inputAmount || parseFloat(inputAmount) <= 0) return "0";
    
    const inputAmountNum = parseFloat(inputAmount);
    let feeAmount = 0;

    // Calculate fee if available
    if (bridgeFee && bridgeFee.fee) {
      feeAmount = parseFloat(bridgeFee.fee);
    }
    
    // Calculate output (input minus fee)
    const output = Math.max(0, inputAmountNum - feeAmount);
    
    // Format with 6 decimal places for USDC
    return output.toFixed(6);
  };

  return (
    <div>
      {/* Input Token */}
      <div className="pb-4">
        <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
          <input
            type="number"
            value={inputAmount}
            onChange={(e) => {
              const value = e.target.value;
              // Only update if it's a valid number or empty
              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                setInputAmount(value);
              }
            }}
            className="w-1/2 text-3xl font-medium focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="0"
            min="0"
          />
          <div className="w-26 rounded-full border-gray-200 bg-white hover:bg-gray-50 py-2 px-3 flex items-center justify-center border">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100">
                <Image
                  src={TOKENS.USDC.logo}
                  alt={TOKENS.USDC.name}
                  width={20}
                  height={20}
                  className="w-5 h-5"
                  onError={() => {
                    // Fallback handled via CSS
                  }}
                />
              </div>
              <span className="text-sm">USDC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center -my-4 z-10 relative">
        <Button
          variant="ghost"
          size="icon"
          className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors shadow-sm"
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      </div>

      {/* Output Token */}
      <div className="pb-8">
        <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
          <div className="w-1/2 text-3xl font-medium">
            {isBridgeFeeLoading ? <Skeleton className="h-8 w-24" /> : calculateBridgeOutput()}
          </div>
          <div className="w-26 rounded-full border-gray-200 bg-pink-500 text-white hover:bg-pink-600 py-2 px-3 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <Image
                  src={TOKENS.USDC.logo}
                  alt={TOKENS.USDC.name}
                  width={20}
                  height={20}
                  className="w-5 h-5"
                  onError={() => {
                    // Fallback handled via CSS
                  }}
                />
              </div>
              <span className="text-sm">USDC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
