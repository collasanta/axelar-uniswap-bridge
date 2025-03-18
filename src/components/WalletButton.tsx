'use client';

import React from 'react';
import { Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/context/WalletContext';
import { shortenAddress } from '@/lib/utils';
import { CHAINS } from '@/lib/constants';

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
      <Button 
        onClick={handleSwitchToEthereum} 
        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium transition-colors"
      >
        Switch to Ethereum
      </Button>
    );
  }

  // If connecting, show loading state
  if (isConnecting) {
    return (
      <Button disabled className="bg-gradient-to-r from-pink-500/70 to-purple-600/70 text-white font-medium transition-colors gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  // If connected, show address and disconnect option
  if (isConnected && account) {
    return (
      <div className="flex items-center gap-2">
        <Button 
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium transition-colors"
          onClick={handleDisconnect}
        >
          <Wallet className="h-4 w-4 mr-2" />
          {shortenAddress(account)}
        </Button>
      </div>
    );
  }

  // Default: not connected
  return (
    <Button 
      onClick={handleConnect} 
      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium transition-colors gap-2"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
