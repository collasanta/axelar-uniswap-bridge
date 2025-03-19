"use client";

import { useWallet } from "@/context/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ExternalLink, Wallet } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { getBridgeFee, getBridgeTime } from "@/server-actions/bridge";

import { BridgeFeeEstimate } from "./BridgeFeeEstimate";
import { BridgeSelection } from "./BridgeSelection";
import { SettingsModal } from "./SettingsModal";

export default function TokenBridge() {
  const { isConnected, connectWallet } = useWallet();
  const [inputAmount, setInputAmount] = useState<string>("10");
  const [sourceChain, setSourceChain] = useState<string>("ethereum");
  const [destinationChain, setDestinationChain] = useState<string>("polygon");

  const [slippage, setSlippage] = useState<string>("0.5");
  const [deadline, setDeadline] = useState<string>("30");

  const {
    data: bridgeFee,
    isLoading: isBridgeFeeLoading,
    error: bridgeFeeError,
  } = useQuery<
    {
      fee: string;
      token: string;
      usd?: number;
      details?: { baseFee: string; executionFee: string; gasMultiplier: number };
    } | null,
    Error
  >({
    queryKey: ["bridgeFee", sourceChain, destinationChain, "USDC"],
    queryFn: () =>
      getBridgeFee({
        sourceChain,
        destinationChain,
        tokenSymbol: "USDC",
        amount: inputAmount,
      }),
    enabled: !!sourceChain && !!destinationChain && sourceChain !== destinationChain,
    staleTime: 60000, // 1 minute
  });

  // Fetch bridge time estimate
  const {
    data: bridgeTime,
    isLoading: isBridgeTimeLoading,
    error: bridgeTimeError,
  } = useQuery({
    queryKey: ["bridgeTime", sourceChain, destinationChain],
    queryFn: () =>
      getBridgeTime({
        sourceChain,
        destinationChain,
      }),
    enabled: !!sourceChain && !!destinationChain && sourceChain !== destinationChain,
    staleTime: 60000, // 5 minutes
  });

  // Handle chain swap
  const handleSwapChains = () => {
    const temp = sourceChain;
    setSourceChain(destinationChain);
    setDestinationChain(temp);
  };

  // Mock function to sign a bridge transaction
  const [isBridgeSigning, setIsBridgeSigning] = useState<boolean>(false);
  const [bridgeSignatureComplete, setBridgeSignatureComplete] = useState<boolean>(false);

  const handleBridgeTransaction = async () => {
    if (!isConnected || !window.ethereum) return;

    setIsBridgeSigning(true);

    try {
      // Create a simple message for the user to sign
      const message = `Mock Bridge Transaction\n\nBridge USDC from ${sourceChain} to ${destinationChain}`;

      // Request the user to sign the message
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, accounts[0]],
      });

      console.log("Bridge signature:", signature);
      setBridgeSignatureComplete(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setBridgeSignatureComplete(false);
      }, 3000);
    } catch (error) {
      console.error("Error signing bridge message:", error);
    } finally {
      setIsBridgeSigning(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border rounded-xl shadow-lg flex flex-col" style={{ minHeight: "550px" }}>
      <CardHeader className="pb-0 !p-2 flex-shrink-0">
        <div className="flex justify-end items-center">
          <SettingsModal slippage={slippage} setSlippage={setSlippage} deadline={deadline} setDeadline={setDeadline} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow overflow-hidden pb-0">
        <div>
          {/* Token Selection */}
          <BridgeSelection
            inputAmount={inputAmount}
            setInputAmount={setInputAmount}
            bridgeFee={bridgeFee || null}
            isBridgeFeeLoading={isBridgeFeeLoading}
          />

          {/* Bridge Fee Estimate */}
          <BridgeFeeEstimate
            sourceChain={sourceChain}
            setSourceChain={setSourceChain}
            destinationChain={destinationChain}
            setDestinationChain={setDestinationChain}
            handleSwapChains={handleSwapChains}
            isBridgeFeeLoading={isBridgeFeeLoading}
            bridgeFee={bridgeFee || null}
            bridgeTime={bridgeTime || null}
          />
        </div>
      </CardContent>
      <CardFooter className="flex-shrink-0 pt-2">
        {isConnected ? (
          <Button
            variant="wallet"
            className="w-full py-6 rounded-xl min-h-[60px] flex items-center justify-center"
            onClick={handleBridgeTransaction}
            disabled={
              isBridgeSigning ||
              isBridgeFeeLoading ||
              isBridgeTimeLoading ||
              !inputAmount ||
              parseFloat(inputAmount) <= 0 ||
              !!bridgeFeeError ||
              !!bridgeTimeError
            }
          >
            <div className="flex items-center justify-center w-full">
              {isBridgeSigning ? (
                <>
                  <svg
                    className="animate-spin mr-3 h-5 w-5 text-white flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Signing Bridge Transaction...</span>
                </>
              ) : bridgeSignatureComplete ? (
                <>
                  <svg
                    className="mr-3 h-5 w-5 text-white flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Bridge Transaction Signed!</span>
                </>
              ) : isBridgeFeeLoading || isBridgeTimeLoading ? (
                <>
                  <svg
                    className="animate-spin mr-3 h-5 w-5 text-white flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Loading Estimates...</span>
                </>
              ) : bridgeFeeError || bridgeTimeError ? (
                <>
                  <AlertCircle className="h-5 w-5 mr-3 text-white flex-shrink-0" />
                  <span>Error Loading Estimates</span>
                </>
              ) : (
                <>
                  <ExternalLink className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>Bridge Tokens</span>
                </>
              )}
            </div>
          </Button>
        ) : (
          <Button
            variant="wallet"
            className="w-full py-6 rounded-xl min-h-[60px] flex items-center justify-center"
            onClick={connectWallet}
          >
            <div className="flex items-center justify-center w-full">
              <Wallet className="h-5 w-5 mr-3 flex-shrink-0" />
              <span>Connect Wallet to Bridge</span>
            </div>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
