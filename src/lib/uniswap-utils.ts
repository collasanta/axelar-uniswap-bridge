import { ApolloClient, InMemoryCache, gql } from "@apollo/client";

// Get environment variables for The Graph API
const GRAPH_API_KEY = process.env.NEXT_PUBLIC_GRAPH_API_KEY;
const UNISWAP_V3_SUBGRAPH_ID = process.env.NEXT_PUBLIC_UNISWAP_SUBGRAPH_ID;

// Apollo Client for Uniswap V3 Subgraph using The Graph's decentralized network
export const uniswapEthereumClient = new ApolloClient({
  uri: `https://gateway.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id/${UNISWAP_V3_SUBGRAPH_ID}`,
  cache: new InMemoryCache(),
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

// Define interface for token data in pool response
export interface UniswapToken {
  id: string;
  symbol: string;
  name: string;
  decimals: string;
}

// Define interface for pool data response
export interface UniswapPoolData {
  id: string;
  token0: UniswapToken;
  token1: UniswapToken;
  feeTier: string;
  liquidity: string;
  sqrtPrice: string;
  tick: string;
  volumeUSD: string;
  volumeToken0: string;
  volumeToken1: string;
  txCount: string;
  ethPriceUSD?: string;
}

// Helper function to calculate token price from pool data
export function calculateTokenPrice(poolData: UniswapPoolData | null, tokenSymbol: string): string {
  if (!poolData) return "0";

  try {
    // Extract token information from pool data
    const token0 = poolData.token0;
    const token1 = poolData.token1;

    // Determine which token is the one we're interested in
    const isToken0 = token0.symbol.toUpperCase() === tokenSymbol.toUpperCase();
    const isToken1 = token1.symbol.toUpperCase() === tokenSymbol.toUpperCase();

    if (!isToken0 && !isToken1) {
      console.error("Token not found in pool data");
      return "0";
    }

    // Calculate price based on pool data
    // This is a simplified implementation
    if (isToken0 && token1.symbol.toUpperCase() === "USDC") {
      // If token0 is our token and token1 is USDC, price is directly available
      return (parseFloat(poolData.volumeToken1) / parseFloat(poolData.volumeToken0)).toFixed(6);
    } else if (isToken1 && token0.symbol.toUpperCase() === "USDC") {
      // If token1 is our token and token0 is USDC, price is inversely available
      return (parseFloat(poolData.volumeToken0) / parseFloat(poolData.volumeToken1)).toFixed(6);
    } else if (isToken0 && token1.symbol.toUpperCase() === "ETH" && poolData.ethPriceUSD) {
      // If token0 is our token and token1 is ETH, calculate using ETH price
      const ethPrice = parseFloat(poolData.ethPriceUSD);
      const tokenToEthRate = parseFloat(poolData.volumeToken1) / parseFloat(poolData.volumeToken0);
      return (tokenToEthRate * ethPrice).toFixed(6);
    } else if (isToken1 && token0.symbol.toUpperCase() === "ETH" && poolData.ethPriceUSD) {
      // If token1 is our token and token0 is ETH, calculate using ETH price
      const ethPrice = parseFloat(poolData.ethPriceUSD);
      const tokenToEthRate = parseFloat(poolData.volumeToken0) / parseFloat(poolData.volumeToken1);
      return (tokenToEthRate * ethPrice).toFixed(6);
    }

    return "0";
  } catch (error) {
    console.error("Error calculating token price:", error);
    return "0";
  }
}

// Helper function to calculate swap rate between two tokens
export function calculateSwapRate(poolData: UniswapPoolData | null, inputToken: string, outputToken: string): string {
  if (!poolData) return "0";

  try {
    // For ETH to USDC swap
    if (inputToken === "ETH" && outputToken === "USDC") {
      return poolData.ethPriceUSD || "0";
    }

    // For USDC to ETH swap
    if (inputToken === "USDC" && outputToken === "ETH" && poolData.ethPriceUSD) {
      return (1 / parseFloat(poolData.ethPriceUSD)).toFixed(6);
    }

    // For other token pairs, implement custom logic
    // This is a simplified placeholder
    return "0";
  } catch (error) {
    console.error("Error calculating swap rate:", error);
    return "0";
  }
}
