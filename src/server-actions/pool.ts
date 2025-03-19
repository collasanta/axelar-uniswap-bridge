"use server";

import { ApolloClient, InMemoryCache, gql } from "@apollo/client";

const GRAPH_API_KEY = process.env.NEXT_PUBLIC_GRAPH_API_KEY;
const UNISWAP_V3_SUBGRAPH_ID = process.env.NEXT_PUBLIC_UNISWAP_SUBGRAPH_ID;

// Apollo Client for Uniswap V3 Subgraph using The Graph's decentralized network
const uniswapEthereumClient = new ApolloClient({
  uri: `https://gateway.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id/${UNISWAP_V3_SUBGRAPH_ID}`,
  cache: new InMemoryCache(),
});

// Apollo Client for Uniswap V3 Polygon Subgraph (for bonus feature)
const uniswapPolygonClient = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon",
  cache: new InMemoryCache(),
});

// Combined GraphQL query to fetch both pool data and ETH price
const COMBINED_QUERY = gql`
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

// Server action to fetch Uniswap pool data
export async function getUniswapPoolData(params: {
  poolAddress: string;
  network?: string;
}) {
  try {
    const { poolAddress, network = "ethereum" } = params;
    
    // Select the appropriate client based on the network
    const client = network === "polygon" ? uniswapPolygonClient : uniswapEthereumClient;

    // If the pool address is not provided, return a fallback response
    if (!poolAddress) {
      console.error("Pool address is required");
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
