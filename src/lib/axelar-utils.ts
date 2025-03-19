// Helper function to map our chain names to Axelar chain names
export function mapToAxelarChainName(chainName: string): string {
  const chainMap: Record<string, string> = {
    ethereum: "ethereum",
    polygon: "polygon",
    avalanche: "avalanche",
    fantom: "fantom",
    arbitrum: "arbitrum",
    optimism: "optimism",
    binance: "binance",
  };

  return chainMap[chainName] || chainName;
}

// Helper function to map token symbols to denoms
export function mapTokenToDenom(token: string): string {
  const denomMap: Record<string, string> = {
    USDC: "uusdc",
    USDT: "uusdt",
    ETH: "weth-wei",
    BTC: "wbtc-satoshi",
    DAI: "dai-wei",
    WETH: "weth-wei",
    WBTC: "wbtc-satoshi",
  };

  return denomMap[token] || "uusdc"; // Default to USDC if not found
}

// Helper function to get the native token for a chain
export function getNativeToken(chainName: string): string {
  const tokenMap: Record<string, string> = {
    ethereum: "ETH",
    polygon: "MATIC",
    avalanche: "AVAX",
    fantom: "FTM",
    arbitrum: "ETH",
    optimism: "ETH",
    binance: "BNB",
  };

  return tokenMap[chainName] || "ETH";
}

// Helper function to format Axelar fee (convert from wei to ETH)
export function formatAxelarFee(fee: string): string {
  // Convert from wei to ETH (or the respective native token)
  const feeInEth = parseFloat(fee) / 1e18;
  return feeInEth.toFixed(6);
}

// Define interface for fee response
export interface AxelarFeeResponse {
  baseFee: string;
  executionFee: string;
  executionFeeWithMultiplier: string;
  l1ExecutionFeeWithMultiplier?: string;
  gasMultiplier: number;
}

// Helper function to calculate total fee from detailed response
export function calculateTotalFee(response: AxelarFeeResponse, destinationChain: string): string {
  let totalFee = BigInt(response.baseFee) + BigInt(response.executionFeeWithMultiplier);

  // Add L1 execution fee for L2 chains
  if (isL2Chain(destinationChain) && response.l1ExecutionFeeWithMultiplier) {
    totalFee += BigInt(response.l1ExecutionFeeWithMultiplier);
  }

  return totalFee.toString();
}

// Helper function to check if a chain is an L2
export function isL2Chain(chainName: string): boolean {
  const l2Chains = ["arbitrum", "optimism", "polygon"];
  return l2Chains.includes(chainName.toLowerCase());
}

// Helper function to convert fee to USD
export async function convertToUSD(fee: string, token: string): Promise<number> {
  try {
    // This is a simplified implementation
    // In a real app, you would use a price oracle or API
    const tokenPrices: Record<string, number> = {
      ETH: 1900,
      MATIC: 0.21,
      AVAX: 18,
      FTM: 0.5,
      BNB: 617,
    };

    const feeInToken = parseFloat(fee) / 1e18;
    const tokenPrice = tokenPrices[token] || 0;
    return feeInToken * tokenPrice;
  } catch (error) {
    console.error("Error converting to USD:", error);
    return 0;
  }
}

// Helper function to estimate bridging time between chains
export async function estimateBridgingTime(sourceChain: string, destinationChain: string) {
  try {
    // Normalize chain names
    const source = sourceChain.toLowerCase();
    const destination = destinationChain.toLowerCase();

    // Axelar finality times in minutes for each blockchain
    // Data from https://docs.axelar.dev/learn/txduration/#what-is-blockchain-finality
    const axelarFinalityTimes: Record<string, number> = {
      ethereum: 16, // 16 minutes (200 blocks)
      avalanche: 0.05, // 3 seconds (1 block)
      polygon: 4.7, // 4:42 minutes (128 blocks)
      binance: 0.77, // 46 seconds (15 blocks)
      bnb: 0.77, // Alternative name for Binance chain
      fantom: 0.05, // 3 seconds (1 block)
      kava: 0.75, // 45 seconds (1 block)
      cometbft: 0.02, // Instant
      cosmos: 0.02, // Cosmos SDK chains using CometBFT
      osmosis: 0.02, // CometBFT chain
      optimism: 30, // 30 minutes (1000000 blocks)
      linea: 81, // 81 minutes (400 blocks)
      filecoin: 52, // 52 minutes (100 blocks)
      moonbeam: 0.42, // 25 seconds (1 block)
      celo: 0.2, // 12 seconds (1 block)
      arbitrum: 19.1, // 19:06 minutes (1000000 blocks)
      base: 24, // 24 minutes (1000000 blocks)
    };

    // Destination execution times in minutes
    // These are estimates for the time to execute the proven transaction
    // Generally much faster than waiting for full finality
    // We could get this from Axelar API later
    const destinationExecutionTimes: Record<string, number> = {
      ethereum: 0.75, // ~45 seconds for transaction inclusion
      avalanche: 0.05, // 3 seconds
      polygon: 0.2, // ~12 seconds
      binance: 0.1, // ~6 seconds
      bnb: 0.1, // Alternative name
      fantom: 0.05, // 3 seconds
      kava: 0.1, // ~6 seconds
      cometbft: 0.02, // Instant
      cosmos: 0.02, // Instant
      osmosis: 0.02, // Instant
      optimism: 0.1, // ~6 seconds
      linea: 0.1, // ~6 seconds
      filecoin: 0.5, // ~30 seconds
      moonbeam: 0.1, // ~6 seconds
      celo: 0.1, // ~6 seconds
      arbitrum: 0.1, // ~6 seconds
      base: 0.1, // ~6 seconds
    };

    // Axelar processing time varies based on network conditions
    // Generally takes 1-5 minutes
    const baseAxelarProcessingTime = 2; // 2 minutes base time

    // Add congestion factors
    // Higher finality chains often have more validator coordination overhead
    const sourceTime = axelarFinalityTimes[source] || 15; // Default if chain not found
    const destExecTime = destinationExecutionTimes[destination] || 0.5;

    // Calculate Axelar processing with slight adjustment for complexity
    // More complex chains might need more validation time
    const complexityFactor = sourceTime > 10 ? 1.2 : 1.0;
    const axelarProcessingTime = baseAxelarProcessingTime * complexityFactor;

    // Calculate total time: source finality + axelar processing + destination execution
    const totalTime = sourceTime + axelarProcessingTime + destExecTime;

    // Create min-max range with variable ranges based on chain reliability
    // Chains with longer finality often have more variance
    const sourceVariance = sourceTime > 10 ? 0.3 : 0.2; // 30% variance for slower chains
    const min = Math.max(1, Math.floor(totalTime * (1 - sourceVariance)));
    const max = Math.ceil(totalTime * (1 + sourceVariance));

    return { min, max };
  } catch (error) {
    console.error("Error estimating bridging time:", error);
    return { min: 15, max: 30 }; // Default fallback
  }
}
