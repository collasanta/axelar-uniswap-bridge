"use client";

import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/WalletContext";
import { CHAINS } from "@/lib/constants";
import { shortenAddress } from "@/lib/utils";
import { Loader2, Wallet } from "lucide-react";

export function WalletButton() {
  const { account, chainId, isConnecting, isConnected, connectWallet, disconnectWallet, switchNetwork } = useWallet();

  const handleConnect = async () => {
    await connectWallet();
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const handleSwitchToEthereum = async () => {
    if (chainId !== CHAINS.ethereum.id) {
      await switchNetwork(CHAINS.ethereum.id);
    }
  };

  // If connected but not on Ethereum, show switch network button
  if (isConnected && chainId !== CHAINS.ethereum.id) {
    return (
      <Button onClick={handleSwitchToEthereum} variant="wallet">
        Switch to Ethereum
      </Button>
    );
  }

  // If connecting, show loading state
  if (isConnecting) {
    return (
      <Button disabled variant="wallet" className="opacity-70 gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  // If connected, show address and disconnect option
  if (isConnected && account) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="wallet" onClick={handleDisconnect}>
          <Wallet className="h-4 w-4 mr-2" />
          {shortenAddress(account)}
        </Button>
      </div>
    );
  }

  // Default: not connected
  return (
    <Button onClick={handleConnect} variant="wallet" className="gap-2">
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
