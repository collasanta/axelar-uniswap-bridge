"use server";

import { uniswapEthereumClient, COMBINED_QUERY } from "@/lib/uniswap-utils";

// Server action to fetch Uniswap pool data
export async function getUniswapPoolData(params: {
  poolAddress: string;
}) {
  try {
    const { poolAddress } = params;
    
    if (!poolAddress) {
      console.error("Pool address is required");
      return null;
    }

    // Use the combined query to fetch both pool data and ETH price in one request
    const { data } = await uniswapEthereumClient.query({
      query: COMBINED_QUERY,
      variables: { poolAddress },
      fetchPolicy: "network-only", // Don't use cache for this query
    });

    const ethPriceUSD = data.bundles[0]?.ethPriceUSD || "0";

    return {
      ...data.pool,
      ethPriceUSD,
    };
  } catch (error) {
    console.error("Error fetching Uniswap pool data:", error);
    return null;
  }
}
