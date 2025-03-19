import { ApolloClient, InMemoryCache, NormalizedCacheObject, gql } from "@apollo/client";
import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";
import axios from "axios";

const GRAPH_API_KEY = process.env.NEXT_PUBLIC_GRAPH_API_KEY;

const UNISWAP_V3_SUBGRAPH_ID = process.env.NEXT_PUBLIC_UNISWAP_SUBGRAPH_ID;

// Apollo Client for Uniswap V3 Subgraph using The Graph's decentralized network
export const uniswapEthereumClient = new ApolloClient({
  uri: `https://gateway.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id/${UNISWAP_V3_SUBGRAPH_ID}`,
  cache: new InMemoryCache(),
});

// Apollo Client for Uniswap V3 Polygon Subgraph (for bonus feature)
export const uniswapPolygonClient = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon",
  cache: new InMemoryCache(),
});

// AxelarScan API
const axelarScanBaseUrl = "https://api.axelarscan.io";

// Initialize Axelar Query API
export const axelarQueryApi = new AxelarQueryAPI({
  environment: Environment.MAINNET,
});

// Combined GraphQL query to fetch both pool data and ETH price
export const COMBINED_QUERY = gql`
  query getCombinedData($poolAddress: String!) {
    bundles(first: 1) {
      id
      ethPriceUSD
    }
    pool(id: $poolAddress) {
      id
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      feeTier
      liquidity
      sqrtPrice
      tick
      volumeUSD
      volumeToken0
      volumeToken1
      txCount
    }
  }
`;

// GraphQL query for just ETH price (used as fallback)
export const ETH_PRICE_QUERY = gql`
  query getEthPrice {
    bundles(first: 1) {
      id
      ethPriceUSD
    }
  }
`;

// Fetch ETH-USDC pool data from Uniswap V3 subgraph
export async function fetchUniswapPoolData(poolAddress: string, client: ApolloClient<NormalizedCacheObject>) {
  try {
    console.log("Fetching pool data for address:", poolAddress);

    if (!poolAddress) {
      console.error("No pool address provided");
      // Fetch just the ETH price
      const ethPriceResponse = await client.query({
        query: ETH_PRICE_QUERY,
        fetchPolicy: "network-only",
      });

      const ethPriceUSD = ethPriceResponse.data.bundles[0]?.ethPriceUSD || "0";
      console.log("ETH Price:", ethPriceUSD);

      // Return a fallback object that matches the structure of the real response
      return {
        id: "unknown",
        token0: {
          id: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          symbol: "USDC",
          name: "USD Coin",
          decimals: "6",
        },
        token1: {
          id: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
          symbol: "WETH",
          name: "Wrapped Ether",
          decimals: "18",
        },
        feeTier: "3000",
        liquidity: "0",
        sqrtPrice: "0",
        tick: "0",
        volumeUSD: "0",
        volumeToken0: "0",
        volumeToken1: "0",
        txCount: "0",
        ethPriceUSD,
      };
    }

    // Use the combined query to fetch both pool data and ETH price in one request
    const { data } = await client.query({
      query: COMBINED_QUERY,
      variables: { poolAddress },
      fetchPolicy: "network-only", // Don't use cache for this query
    });

    console.log("Response data:", data);

    const ethPriceUSD = data.bundles[0]?.ethPriceUSD || "0";

    return {
      ...data.pool,
      ethPriceUSD,
    };
  } catch (error) {
    console.error("Error fetching Uniswap pool data:", error);
    // Return a fallback object with the ETH price if possible
    return {
      id: "error",
      token0: {
        id: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        symbol: "USDC",
        name: "USD Coin",
        decimals: "6",
      },
      token1: {
        id: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        symbol: "WETH",
        name: "Wrapped Ether",
        decimals: "18",
      },
      feeTier: "3000",
      liquidity: "0",
      sqrtPrice: "0",
      tick: "0",
      volumeUSD: "0",
      volumeToken0: "0",
      volumeToken1: "0",
      txCount: "0",
      ethPriceUSD: "1904.22", // Reasonable fallback ETH price
    };
  }
}

// Fetch Axelar bridge fee estimate using the AxelarJS SDK
export async function fetchAxelarBridgeFee(sourceChain: string, destinationChain: string, token: string) {
  try {
    // Map our chain names to Axelar chain names if needed
    const axelarSourceChain = mapToAxelarChainName(sourceChain);
    const axelarDestChain = mapToAxelarChainName(destinationChain);

    // First try to get the denom from the symbol
    let assetDenom: string;
    try {
      const denomResult = await axelarQueryApi.getDenomFromSymbol(token, axelarSourceChain);
      if (!denomResult) {
        throw new Error(`Failed to get denom for ${token} on ${axelarSourceChain}`);
      }
      assetDenom = denomResult;
      console.log(`Denom for ${token} on ${axelarSourceChain}: ${assetDenom}`);
    } catch (error) {
      console.error(`Error getting denom for ${token} on ${axelarSourceChain}:`, error);
      // If we can't get the denom, use a default mapping
      assetDenom = mapTokenToDenom(token);
      console.log(`Using mapped denom for ${token}: ${assetDenom}`);
    }

    // Get the transfer fee
    const transferFeeResponse = await axelarQueryApi.getTransferFee(
      axelarSourceChain,
      axelarDestChain,
      assetDenom,
      1 // Amount in denom units, we're just getting the base fee
    );

    console.log("Axelar transfer fee response:", transferFeeResponse);

    // Get gas fee estimate for the transaction
    const gasLimit = 300000; // Default gas limit for a simple transfer
    const gasResponse = await axelarQueryApi.estimateGasFee(
      axelarSourceChain,
      axelarDestChain,
      gasLimit,
      "auto", // Use the default gas multiplier
      undefined, // Use the default gas token
      "0", // Min gas price
      undefined, // No execution data
      {
        showDetailedFees: true,
        tokenSymbol: token,
        sourceContractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum USDC
        destinationContractAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon USDC
      }
    );

    console.log("Axelar gas fee response:", gasResponse);

    // Format the response to match our UI needs
    let feeData;
    if (typeof gasResponse === "string") {
      // Simple fee response
      const nativeToken = getNativeToken(sourceChain);
      const feeInNativeToken = formatAxelarFee(gasResponse);
      const feeInUSD = await convertToUSD(gasResponse, nativeToken);

      // Convert the fee to USDC (1:1 with USD)
      feeData = {
        fee: feeInUSD.toFixed(2),
        token: "USDC", // Always return fee in USDC
        usd: feeInUSD,
        nativeToken: {
          fee: feeInNativeToken,
          token: nativeToken,
        },
      };
    } else {
      // Detailed fee response
      const totalFee = calculateTotalFee(gasResponse, axelarDestChain);
      const nativeToken = getNativeToken(sourceChain);
      const feeInNativeToken = formatAxelarFee(totalFee);
      const feeInUSD = await convertToUSD(totalFee, nativeToken);

      // Convert the fee to USDC (1:1 with USD)
      feeData = {
        fee: feeInUSD.toFixed(2),
        token: "USDC", // Always return fee in USDC
        usd: feeInUSD,
        nativeToken: {
          fee: feeInNativeToken,
          token: nativeToken,
        },
        details: {
          baseFee: formatAxelarFee(gasResponse.baseFee),
          executionFee: formatAxelarFee(gasResponse.executionFeeWithMultiplier),
          gasMultiplier: gasResponse.gasMultiplier,
        },
      };
    }

    return feeData;
  } catch (error) {
    console.error("Error fetching Axelar bridge fee:", error);
    // Return fallback data with USDC as the token
    return {
      fee: "1.50", // Fallback fee in USDC
      token: "USDC", // Always USDC
      usd: 1.5,
      nativeToken: {
        fee: "0.005",
        token: getNativeToken(sourceChain),
      },
    };
  }
}

// Helper function to map our chain names to Axelar chain names
function mapToAxelarChainName(chainName: string): string {
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
function mapTokenToDenom(token: string): string {
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
function getNativeToken(chainName: string): string {
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
function formatAxelarFee(fee: string): string {
  // Convert from wei to ETH (or the respective native token)
  const feeInEth = parseFloat(fee) / 1e18;
  return feeInEth.toFixed(6);
}

// Define interface for fee response
interface AxelarFeeResponse {
  baseFee: string;
  executionFee: string;
  executionFeeWithMultiplier: string;
  l1ExecutionFeeWithMultiplier?: string;
  gasMultiplier: number;
}

// Helper function to calculate total fee from detailed response
function calculateTotalFee(response: AxelarFeeResponse, destinationChain: string): string {
  let totalFee = BigInt(response.baseFee) + BigInt(response.executionFeeWithMultiplier);

  // Add L1 execution fee for L2 chains
  if (isL2Chain(destinationChain) && response.l1ExecutionFeeWithMultiplier) {
    totalFee += BigInt(response.l1ExecutionFeeWithMultiplier);
  }

  return totalFee.toString();
}

// Helper function to check if a chain is an L2
function isL2Chain(chainName: string): boolean {
  const l2Chains = ["arbitrum", "optimism", "polygon"];
  return l2Chains.includes(chainName.toLowerCase());
}

// Helper function to convert fee to USD
async function convertToUSD(fee: string, token: string): Promise<number> {
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

// Fetch recent Axelar transactions using the Token Transfer API
// Default limit changed from 10 to 5 for initial loading
export async function fetchAxelarTransactions(limit = 5, offset = 0) {
  try {
    // Using the searchTransfers endpoint from the Token Transfer API
    const response = await axios.post(`${axelarScanBaseUrl}/token/searchTransfers`, {
      // Get transactions from the last 30 days
      fromTime: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
      toTime: Math.floor(Date.now() / 1000),
      size: limit,
      from: offset, // Pagination offset
    });

    // Define interface for Axelar transaction data
    interface AxelarTransactionData {
      id: string;
      send?: {
        txhash: string;
        source_chain: string;
        destination_chain: string;
        amount: number;
        denom: string;
        sender_address: string;
        recipient_address: string;
        created_at: { ms: number };
      };
      link?: {
        source_chain: string;
        destination_chain: string;
        sender_address: string;
        recipient_address: string;
        created_at: { ms: number };
      };
      status: string;
      simplified_status: string;
      time_spent?: { total: number };
    }

    // Map the response to a more usable format for our UI
    const transactions = response.data.data.map((tx: AxelarTransactionData) => ({
      id: tx.id,
      txHash: tx.send?.txhash || "",
      sourceChain: tx.send?.source_chain || tx.link?.source_chain || "",
      destinationChain: tx.send?.destination_chain || tx.link?.destination_chain || "",
      status: tx.status || "pending",
      simplifiedStatus: tx.simplified_status || "",
      amount: tx.send?.amount || 0,
      denom: tx.send?.denom || "",
      senderAddress: tx.send?.sender_address || tx.link?.sender_address || "",
      recipientAddress: tx.send?.recipient_address || tx.link?.recipient_address || "",
      createdAt: tx.send?.created_at?.ms || tx.link?.created_at?.ms || Date.now(),
      timeSpent: tx.time_spent?.total || 0,
    }));

    console.log("Fetched Axelar transactions:", transactions);
    return transactions;
  } catch (error) {
    console.error("Error fetching Axelar transactions:", error);
    // Return mock data in case of error
    return generateMockTransactions(limit);
  }
}

// Generate mock transaction data for testing or when API fails
// Default count changed from 10 to 5 for initial loading
function generateMockTransactions(count = 5) {
  const chains = ["ethereum", "polygon", "avalanche", "fantom", "arbitrum", "optimism", "binance"];
  const statuses = ["executed", "pending", "failed"];
  const tokens = ["USDC", "USDT", "ETH", "WBTC", "DAI"];

  return Array.from({ length: count }, (_, i) => {
    const sourceChain = chains[Math.floor(Math.random() * chains.length)];
    let destinationChain;
    do {
      destinationChain = chains[Math.floor(Math.random() * chains.length)];
    } while (destinationChain === sourceChain);

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = (Math.random() * 1000).toFixed(2);
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    const timeAgo = Math.floor(Math.random() * 24 * 60); // Random minutes ago within 24 hours

    return {
      id: `mock-tx-${i}`,
      txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      sourceChain,
      destinationChain,
      status,
      simplifiedStatus: status === "executed" ? "received" : status === "pending" ? "pending" : "failed",
      amount: parseFloat(amount),
      denom: token.toLowerCase(),
      senderAddress: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      recipientAddress: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      createdAt: Date.now() - timeAgo * 60 * 1000,
      timeSpent: status === "executed" ? Math.floor(Math.random() * 300) : 0,
    };
  });
}

/**
 * Estimates bridging time between two chains using Axelar network data
 * Based on Axelar's official finality time documentation
 * @see https://docs.axelar.dev/learn/txduration
 */
export async function estimateBridgingTime(sourceChain: string, destinationChain: string): Promise<{ min: number; max: number }> {
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

    // For L2 rollups, offer both optimistic and final settlement times
    const isL2Rollup =
      ["optimism", "arbitrum", "base", "linea"].includes(source) ||
      ["optimism", "arbitrum", "base", "linea"].includes(destination);

    if (isL2Rollup) {
      return {
        min: Math.max(10, min),
        max: Math.max(max, sourceTime + 25), // Full L1 settlement can take 20-30+ minutes
      };
    }

    return { min, max };
  } catch (error) {
    console.error("Error estimating bridging time:", error);
    return { min: 15, max: 30 }; // Default fallback
  }
}
