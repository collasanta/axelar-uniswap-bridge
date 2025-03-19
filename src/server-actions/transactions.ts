"use server";

import { fetchAxelarTransactions } from "@/lib/transaction-utils";

// Fetch recent Axelar transactions using the Token Transfer API
export async function getAxelarTransactions(params: { limit?: number; offset?: number; address?: string }) {
  try {
    const { limit = 5, offset = 0, address } = params;

    // Use the utility function to fetch transactions
    const transactions = await fetchAxelarTransactions(limit, offset, address);

    return {
      transactions,
      total: transactions.length,
    };
  } catch (error) {
    console.error("Error fetching Axelar transactions:", error);
    return {
      transactions: [],
      total: 0,
    };
  }
}
