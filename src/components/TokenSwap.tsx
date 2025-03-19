"use client";

import { useWallet } from "@/context/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowDown, ArrowRightLeft, BarChart2, Percent, Wallet } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SettingsModal } from "./SettingsModal";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { fetchUniswapPoolData, uniswapEthereumClient } from "@/lib/api";
import { CHAINS, POOL_ADDRESSES, TOKENS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export default function TokenSwap() {
  const { isConnected, connectWallet, chainId, switchNetwork } = useWallet();
  const { toast } = useToast();
  const [inputAmount, setInputAmount] = useState<string>("1");
  const [inputToken, setInputToken] = useState<string>("ETH");
  const [outputToken, setOutputToken] = useState<string>("USDC");
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(true);

  const [slippage, setSlippage] = useState<string>("0.5");
  const [deadline, setDeadline] = useState<string>("30");
  const [isSwapSigning, setIsSwapSigning] = useState<boolean>(false);
  const [swapSignatureComplete, setSwapSignatureComplete] = useState<boolean>(false);

  // Check if user is on Ethereum mainnet
  useEffect(() => {
    if (chainId && chainId !== CHAINS.ethereum.id) {
      setIsCorrectNetwork(false);
    } else {
      setIsCorrectNetwork(true);
    }
  }, [chainId]);

  // Handle network switch
  const handleSwitchToEthereum = async () => {
    if (!isConnected) {
      await connectWallet();
    } else {
      const success = await switchNetwork(CHAINS.ethereum.id);
      if (success) {
        setIsCorrectNetwork(true);
        toast({
          title: "Network Changed",
          description: "Successfully switched to Ethereum Mainnet",
          variant: "success",
          className: "bg-green-50 border border-green-100 shadow-md",
        });
      }
    }
  };

  // Fetch pool data
  const {
    data: poolData,
    isLoading: isPoolDataLoading,
    error: poolDataError,
  } = useQuery({
    queryKey: ["poolData", "ethereum", inputToken, outputToken],
    queryFn: () => {
      // Create the pool key based on the tokens
      let poolKey;

      // Check if we have a direct match for the pool
      if (inputToken === "ETH" && outputToken === "USDC") {
        poolKey = "ethereum-eth-usdc";
      } else if (inputToken === "USDC" && outputToken === "ETH") {
        poolKey = "ethereum-eth-usdc"; // Same pool, just swap direction
      } else {
        // For other token pairs, we'll use a fallback
        console.log("Using fallback for token pair:", inputToken, outputToken);
        return fetchUniswapPoolData("", uniswapEthereumClient);
      }

      console.log("Using pool key:", poolKey);
      const poolAddress = POOL_ADDRESSES[poolKey as keyof typeof POOL_ADDRESSES];
      return fetchUniswapPoolData(poolAddress, uniswapEthereumClient);
    },
    enabled: !!inputToken && !!outputToken && inputToken !== outputToken && isCorrectNetwork,
    staleTime: 60000, // 1 minute
    refetchInterval: 5000, // 5 seconds
    retry: 2, // Retry failed requests up to 2 times
  });

  // Calculate swap rate - optimized for better performance
  const calculateSwapRate = () => {
    if (!poolData) return "0";

    // Use the ETH price from the subgraph data
    if ((inputToken === "ETH" || inputToken === "WETH") && outputToken === "USDC") {
      // ETH/WETH to USDC (use ETH price directly)
      return poolData.ethPriceUSD;
    } else if (inputToken === "USDC" && (outputToken === "ETH" || outputToken === "WETH")) {
      // USDC to ETH/WETH (invert ETH price)
      return (1 / parseFloat(poolData.ethPriceUSD)).toFixed(6);
    }

    return "0";
  };

  // Calculate output amount - optimized for better performance
  const calculateOutputAmount = () => {
    // Early return for invalid inputs
    if (!poolData || !inputAmount || parseFloat(inputAmount) <= 0) return "0";

    const rate = calculateSwapRate();
    const inputAmountNum = parseFloat(inputAmount);
    const rateNum = parseFloat(rate);
    const amount = inputAmountNum * rateNum;

    // Format based on token decimals
    return outputToken === "USDC" ? amount.toFixed(2) : amount.toFixed(6);
  };

  // Handle token swap
  const handleSwapTokens = () => {
    // Check if tokens are identical
    if (inputToken === outputToken) {
      // Show toast message instead of swapping
      toast({
        title: "Cannot Swap Identical Tokens",
        description: "Please select different tokens for input and output",
        variant: "warning",
        className: "bg-pink-50 border border-pink-100 shadow-md",
      });
      return;
    }

    // Proceed with swap if tokens are different - use React state updater pattern
    setInputToken(outputToken);
    setOutputToken(inputToken);
  };

  // Mock function to sign a swap transaction
  const handleSwapTransaction = async () => {
    if (!isConnected || !window.ethereum) return;

    setIsSwapSigning(true);

    try {
      // Create a simple message for the user to sign
      const message = `Mock Swap Transaction\n\nSwap ${inputAmount} ${inputToken} for ${outputToken}`;

      // Request the user to sign the message
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, accounts[0]],
      });

      console.log("Swap signature:", signature);
      setSwapSignatureComplete(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setSwapSignatureComplete(false);
      }, 3000);
    } catch (error) {
      console.error("Error signing swap message:", error);
    } finally {
      setIsSwapSigning(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border rounded-xl shadow-lg">
      <CardHeader className="pb-0 !p-2">
        <div className="flex justify-between items-center">
          {isCorrectNetwork ? (
            <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md ml-4">
              <Image src="/images/eth.svg" alt="Ethereum" width={16} height={16} />
              <span>Ethereum</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwitchToEthereum}
              className="text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100 flex items-center gap-1"
            >
              <Image src="/images/eth.svg" alt="Ethereum" width={16} height={16} />
              <span>Switch to Ethereum</span>
            </Button>
          )}
          <SettingsModal slippage={slippage} setSlippage={setSlippage} deadline={deadline} setDeadline={setDeadline} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Token */}
        <div>
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
            <Select
              value={inputToken}
              onValueChange={(value) => {
                // Check if the new input token is the same as the output token
                if (value === outputToken) {
                  // Show toast message
                  toast({
                    title: "Cannot Select Identical Tokens",
                    description: "Please select different tokens for input and output",
                    variant: "warning",
                    className: "bg-pink-50 border border-pink-100 shadow-md",
                  });
                  return;
                }
                setInputToken(value);
              }}
            >
              <SelectTrigger className="w-32 rounded-full border-gray-200 bg-white hover:bg-gray-50">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100">
                    <Image
                      src={TOKENS[inputToken as keyof typeof TOKENS].logo}
                      alt={TOKENS[inputToken as keyof typeof TOKENS].name}
                      width={20}
                      height={20}
                      className="w-5 h-5"
                      onError={() => {
                        // Fallback handled via CSS
                      }}
                    />
                  </div>
                  <span>{inputToken}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TOKENS).map(([symbol, token]) => (
                  <SelectItem key={symbol} value={symbol}>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100">
                        <Image
                          src={token.logo}
                          alt={token.name}
                          width={20}
                          height={20}
                          className="w-5 h-5"
                          onError={() => {
                            // Fallback handled via CSS
                          }}
                        />
                      </div>
                      <span>{token.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-4 z-10 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwapTokens}
            className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors shadow-sm"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>

        {/* Output Token */}
        <div className="pb-4">
          <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
            <div className="w-1/2 text-3xl font-medium">
              {isPoolDataLoading ? <Skeleton className="h-8 w-24" /> : calculateOutputAmount()}
            </div>
            <Select
              value={outputToken}
              onValueChange={(value) => {
                // Check if the new output token is the same as the input token
                if (value === inputToken) {
                  // Show toast message
                  toast({
                    title: "Cannot Select Identical Tokens",
                    description: "Please select different tokens for input and output",
                    variant: "warning",
                    className: "bg-pink-50 border border-pink-100 shadow-md",
                  });
                  return;
                }
                setOutputToken(value);
              }}
            >
              <SelectTrigger className="w-32 rounded-full border-gray-200 bg-pink-500 text-white hover:bg-pink-600">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                    <Image
                      src={TOKENS[outputToken as keyof typeof TOKENS].logo}
                      alt={TOKENS[outputToken as keyof typeof TOKENS].name}
                      width={20}
                      height={20}
                      className="w-5 h-5"
                      onError={() => {
                        // Fallback handled via CSS
                      }}
                    />
                  </div>
                  <span>{outputToken}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TOKENS).map(([symbol, token]) => (
                  <SelectItem key={symbol} value={symbol}>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100">
                        <Image
                          src={token.logo}
                          alt={token.name}
                          width={20}
                          height={20}
                          className="w-5 h-5"
                          onError={() => {
                            // Fallback handled via CSS
                          }}
                        />
                      </div>
                      <span>{token.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Details */}
        <div className="space-y-1 pt-6 border-t">
          <h3 className="text-sm font-medium text-gray-700">Swap Details</h3>
          {isPoolDataLoading ? (
            <div className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Percent className="h-4 w-4 text-purple-500" />
                    <span className="text-gray-700">Swap Fee</span>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <BarChart2 className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-700">24h Volume</span>
                  </div>
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </div>
          ) : poolData ? (
            <div className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Percent className="h-4 w-4 text-purple-500" />
                    <span className="text-gray-700">Swap Fee</span>
                  </div>
                  <span className="font-medium">{parseFloat(poolData.feeTier) / 10000}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <BarChart2 className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-700">24h Volume</span>
                  </div>
                  <span className="font-medium">{formatCurrency(parseFloat(poolData.volumeUSD))}</span>
                </div>
              </div>
            </div>
          ) : inputToken === outputToken ? (
            <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 border border-gray-100">
              No pool data available for identical tokens
            </div>
          ) : poolDataError ? (
            <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 border border-gray-100">
              Error fetching pool data. Please try again later.
            </div>
          ) : (
            <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 border border-gray-100">
              No pool data available for selected tokens
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {isConnected ? (
          <Button
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-6 rounded-xl font-medium transition-colors"
            disabled={
              !poolData ||
              inputAmount === "0" ||
              !inputAmount ||
              isSwapSigning ||
              inputToken === outputToken ||
              isPoolDataLoading ||
              !!poolDataError ||
              !isCorrectNetwork
            }
            onClick={handleSwapTransaction}
          >
            {isSwapSigning ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Signing Swap Transaction...
              </span>
            ) : swapSignatureComplete ? (
              <span className="flex items-center">
                <svg
                  className="-ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Swap Transaction Signed!
              </span>
            ) : isPoolDataLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Loading Swap Rates...
              </span>
            ) : poolDataError ? (
              <span className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-white" />
                Error Loading Rates
              </span>
            ) : (
              <span className="flex items-center">
                <ArrowRightLeft className="h-5 w-5 mr-2" />
                Swap
              </span>
            )}
          </Button>
        ) : (
          <Button
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-6 rounded-xl font-medium transition-colors"
            onClick={connectWallet}
          >
            <Wallet className="h-5 w-5 mr-2" />
            Connect Wallet to Swap
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
