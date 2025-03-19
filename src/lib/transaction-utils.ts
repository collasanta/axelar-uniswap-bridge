import axios from "axios";

// Define the Axelar API URL
export const AXELAR_API_URL = "https://api.axelarscan.io";

// Define interface for transaction data
export interface AxelarTransaction {
  id: string;
  txHash: string;
  status: string;
  sourceChain: string;
  destinationChain: string;
  amount: number;
  denom: string;
  senderAddress: string;
  recipientAddress: string;
  createdAt: number;
  timeSpent: number;
  asset?: string;
  fee?: string;
  confirmations?: number;
  link?: string;
}

// Define interface for raw transaction data from API
export interface RawAxelarTransaction {
  id?: string;
  tx_hash?: string;
  status?: string;
  source_chain?: string;
  destination_chain?: string;
  asset?: string;
  amount?: string;
  fee?: string;
  created_at?: number;
  sender?: string;
  recipient?: string;
  confirmations?: number;
  time_spent?: { total: number };
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
    sender_address?: string;
    recipient_address?: string;
    created_at?: { ms: number };
  };
}

// Helper function to format transaction data
export function formatAxelarTransaction(transaction: RawAxelarTransaction): AxelarTransaction {
  return {
    id: transaction.id || transaction.tx_hash || "",
    txHash: transaction.tx_hash || "",
    status: transaction.status || "pending",
    sourceChain: transaction.source_chain || "",
    destinationChain: transaction.destination_chain || "",
    amount: parseFloat(transaction.amount || "0"),
    denom: transaction.asset || "unknown",
    senderAddress: transaction.sender || "",
    recipientAddress: transaction.recipient || "",
    createdAt: transaction.created_at || Date.now(),
    timeSpent: typeof transaction.time_spent === 'object' ? transaction.time_spent.total : 0,
    fee: transaction.fee || "0",
    confirmations: transaction.confirmations || 0,
    link: `https://axelarscan.io/transfer/${transaction.id || transaction.tx_hash}`,
  };
}

// Helper function to fetch transactions from Axelar API
export async function fetchAxelarTransactions(
  limit: number = 5,
  offset: number = 0,
  address?: string
): Promise<AxelarTransaction[]> {
  try {
    // Using the searchTransfers endpoint from the Token Transfer API
    const response = await axios.post(`https://api.axelarscan.io/token/searchTransfers`, {
      // Get transactions from the last 30 days
      fromTime: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
      toTime: Math.floor(Date.now() / 1000),
      size: limit,
      from: offset, // Pagination offset
      ...(address ? { address } : {}),
    });

    // Process the data to match our UI requirements
    const transactions = response.data?.data?.map((tx: RawAxelarTransaction) => {
      // Use optional chaining to safely access properties
      const sourceChain = tx.send?.source_chain ?? tx.link?.source_chain ?? "unknown";
      const destinationChain = tx.send?.destination_chain ?? tx.link?.destination_chain ?? "unknown";
      
      return {
        id: tx.id || "",
        txHash: tx.send?.txhash ?? "",
        sourceChain: sourceChain,
        destinationChain: destinationChain,
        amount: tx.send?.amount ?? 0,
        denom: tx.send?.denom ?? "unknown",
        senderAddress: tx.send?.sender_address ?? tx.link?.sender_address ?? "",
        recipientAddress: tx.send?.recipient_address ?? tx.link?.recipient_address ?? "",
        status: tx.status || "unknown",
        createdAt: tx.send?.created_at?.ms ?? tx.link?.created_at?.ms ?? Date.now(),
        timeSpent: tx.time_spent?.total ?? 0,
      };
    }) || [];

    return transactions;
  } catch (error) {
    console.error("Error fetching Axelar transactions:", error);
    // Return empty array in case of error
    return [];
  }
}

// Helper function to format transaction status
export function formatTransactionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    completed: "Completed",
    pending: "Pending",
    failed: "Failed",
    confirming: "Confirming",
    confirmed: "Confirmed",
    executing: "Executing",
  };

  return statusMap[status.toLowerCase()] || status;
}

// Helper function to format transaction time
export function formatTransactionTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}
