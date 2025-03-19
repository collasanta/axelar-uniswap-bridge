"use server";

import {
  calculateTotalFee,
  convertToUSD,
  estimateBridgingTime,
  formatAxelarFee,
  getNativeToken,
  mapToAxelarChainName,
  mapTokenToDenom,
} from "@/lib/axelar-utils";
import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";

// Initialize Axelar Query API
const axelarQueryApi = new AxelarQueryAPI({
  environment: Environment.MAINNET,
});

// Server action to fetch bridge fee
export async function getBridgeFee(params: {
  sourceChain: string;
  destinationChain: string;
  tokenSymbol: string;
  amount: string;
}) {
  try {
    const { sourceChain, destinationChain, tokenSymbol } = params;
    const token = tokenSymbol;

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

    console.log({ feeData });

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
        token: getNativeToken(params.sourceChain),
      },
    };
  }
}

// Server action to estimate bridging time
export async function getBridgeTime(params: { sourceChain: string; destinationChain: string }) {
  try {
    const { sourceChain, destinationChain } = params;

    // Map chain names to Axelar chain names
    const axelarSourceChain = mapToAxelarChainName(sourceChain);
    const axelarDestChain = mapToAxelarChainName(destinationChain);

    // Use the utility function to get time estimates
    return estimateBridgingTime(axelarSourceChain, axelarDestChain);
  } catch (error) {
    console.error("Error estimating bridge time:", error);
    // Return a default fallback time estimate
    return { min: 15, max: 30 };
  }
}
