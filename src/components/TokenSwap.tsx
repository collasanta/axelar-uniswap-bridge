"use client";

import { useWallet } from "@/context/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, BarChart2, Percent, RefreshCw, Wallet } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { SettingsModal } from "./SettingsModal";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchUniswapPoolData, uniswapEthereumClient } from "@/lib/api";
import { CHAINS, POOL_ADDRESSES, TOKENS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface TokenSwapProps {
  showChainSelection?: boolean;
}

export default function TokenSwap({ showChainSelection = true }: TokenSwapProps) {
  const { isConnected, connectWallet } = useWallet();
  const [inputAmount, setInputAmount] = useState<string>("1");
  const [inputToken, setInputToken] = useState<string>("ETH");
  const [outputToken, setOutputToken] = useState<string>("USDC");
  const [sourceChain, setSourceChain] = useState<string>("ethereum");
  const [destinationChain, setDestinationChain] = useState<string>("polygon");

  const [slippage, setSlippage] = useState<string>("0.5");
  const [deadline, setDeadline] = useState<string>("30");
  const [isSwapSigning, setIsSwapSigning] = useState<boolean>(false);
  const [swapSignatureComplete, setSwapSignatureComplete] = useState<boolean>(false);

  // Fetch pool data
  const { data: poolData, isLoading: isPoolDataLoading, error: poolDataError } = useQuery({
    queryKey: ["poolData", sourceChain, inputToken, outputToken],
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
    enabled: !!sourceChain && !!inputToken && !!outputToken && inputToken !== outputToken,
    staleTime: 60000, // 1 minute
    retry: 2, // Retry failed requests up to 2 times
  });

  // Calculate swap rate
  const calculateSwapRate = () => {
    if (!poolData) return "0";

    // Check token symbols from the pool data
    const token0Symbol = poolData.token0?.symbol || "USDC";
    const token1Symbol = poolData.token1?.symbol || "WETH";

    console.log("Token symbols:", token0Symbol, token1Symbol);
    console.log("Input/Output tokens:", inputToken, outputToken);

    // Use the ETH price from the subgraph data
    if ((inputToken === "ETH" || inputToken === "WETH") && outputToken === "USDC") {
      // ETH/WETH to USDC (use ETH price directly)
      return poolData.ethPriceUSD;
    } else if (inputToken === "USDC" && (outputToken === "ETH" || outputToken === "WETH")) {
      // USDC to ETH/WETH (invert ETH price)
      return (1 / parseFloat(poolData.ethPriceUSD)).toFixed(6);
    }

    // Fallback calculation using pool data
    // In Uniswap V3, token0 is USDC and token1 is WETH based on the response
    if (token0Symbol === "USDC" && (token1Symbol === "WETH" || token1Symbol === "ETH")) {
      if (inputToken === "USDC") {
        // USDC to ETH rate (how much ETH for 1 USDC)
        return (parseFloat(poolData.volumeToken1) / parseFloat(poolData.volumeToken0)).toFixed(6);
      } else {
        // ETH to USDC rate (how much USDC for 1 ETH)
        return (parseFloat(poolData.volumeToken0) / parseFloat(poolData.volumeToken1)).toFixed(2);
      }
    }

    // Generic fallback
    return (parseFloat(poolData.volumeUSD) / parseFloat(poolData.volumeToken0)).toFixed(2);
  };

  // Calculate output amount
  const calculateOutputAmount = () => {
    if (areTokensIdentical) return inputAmount; // Same token, same amount
    if (!poolData || !inputAmount) return "0";

    const rate = calculateSwapRate();
    const amount = parseFloat(inputAmount) * parseFloat(rate);

    // Format based on token decimals
    if (outputToken === "USDC") {
      return amount.toFixed(2); // USDC has 6 decimals but we'll show 2 for UI
    } else {
      return amount.toFixed(6); // ETH has 18 decimals but we'll show 6 for UI
    }
  };

  // Handle token swap
  const handleSwapTokens = () => {
    const temp = inputToken;
    setInputToken(outputToken);
    setOutputToken(temp);
  };
  
  // Check if the tokens are identical
  const areTokensIdentical = inputToken === outputToken;

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

  // Handle chain swap
  const handleSwapChains = () => {
    const temp = sourceChain;
    setSourceChain(destinationChain);
    setDestinationChain(temp);
  };

  return (
    <Card className="w-full max-w-md mx-auto border rounded-xl shadow-lg">
      <CardHeader className="pb-0 !p-2">
        <div className="flex justify-end items-center">
          <SettingsModal 
            slippage={slippage}
            setSlippage={setSlippage}
            deadline={deadline}
            setDeadline={setDeadline}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Source Chain - Only shown if showChainSelection is true */}
        {showChainSelection ? (
          <div className="mb-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-500">Source Chain</label>
            </div>
            <Select value={sourceChain} onValueChange={setSourceChain}>
              <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50 hover:bg-gray-100">
                <SelectValue placeholder="Select source chain" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHAINS).map(([id, chain]) => (
                  <SelectItem key={id} value={id}>
                    {chain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          // If chain selection is hidden, we still need to set a default source chain
          <input type="hidden" value={sourceChain} />
        )}

        {/* Input Token */}
        <div>
          <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
            <input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              className="w-1/2 text-3xl font-medium focus:outline-none bg-transparent"
              placeholder="0"
              min="0"
            />
            <Select value={inputToken} onValueChange={setInputToken}>
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
            <Select value={outputToken} onValueChange={setOutputToken}>
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
                  <SelectItem key={symbol} value={symbol} disabled={symbol === inputToken}>
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
            {areTokensIdentical && (
              <div className="absolute inset-x-0 -bottom-6 text-center">
                <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">
                  Input and output tokens must be different
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Destination Chain - Only shown if showChainSelection is true */}
        {showChainSelection && (
          <div className="pt-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-500">Destination Chain</label>
              <Button variant="ghost" size="icon" onClick={handleSwapChains} className="text-gray-500 hover:text-gray-700">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <Select value={destinationChain} onValueChange={setDestinationChain}>
              <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50 hover:bg-gray-100">
                <SelectValue placeholder="Select destination chain" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHAINS).map(([id, chain]) => (
                  <SelectItem key={id} value={id} disabled={id === sourceChain}>
                    {chain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Swap Details */}
        <div className="space-y-1 pt-6 border-t">
          <h3 className="text-sm font-medium text-gray-700">Swap Details</h3>
          {isPoolDataLoading ? (
            <div className="mb-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
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
          ) : areTokensIdentical ? (
            <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 border border-gray-100">
              Please select different input and output tokens
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
            disabled={!poolData || inputAmount === "0" || !inputAmount || isSwapSigning || areTokensIdentical}
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
            ) : (
              <span>Swap</span>
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
