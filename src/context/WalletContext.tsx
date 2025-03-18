'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { CHAINS } from '@/lib/constants';

// Add Ethereum provider to window type
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (arg: unknown) => void) => void;
      removeListener: (event: string, callback: (arg: unknown) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

interface WalletContextType {
  account: string | null;
  address: string | null; // Alias for account for better semantic understanding
  chainId: number | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  isConnecting: boolean;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<boolean>;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize provider from window.ethereum if available
  useEffect(() => {
    const initProvider = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // Check if already connected
          const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await ethProvider.listAccounts();
          
          if (accounts.length > 0) {
            const network = await ethProvider.getNetwork();
            const ethSigner = ethProvider.getSigner();
            
            setAccount(accounts[0]);
            setChainId(network.chainId);
            setProvider(ethProvider);
            setSigner(ethSigner);
            setIsConnected(true);
          }
        } catch (err) {
          console.error('Failed to initialize wallet provider:', err);
        }
      }
    };

    initProvider();
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: unknown) => {
        if (Array.isArray(accounts)) {
          if (accounts.length === 0) {
            // User disconnected their wallet
            disconnectWallet();
          } else if (accounts[0] !== account) {
            setAccount(accounts[0]);
          }
        }
      };

      const handleChainChanged = (chainIdHex: unknown) => {
        if (typeof chainIdHex === 'string') {
          const newChainId = parseInt(chainIdHex, 16);
          setChainId(newChainId);
        }
      };

      const handleDisconnect = (error: unknown) => {
        console.log('Wallet disconnected', error);
        disconnectWallet();
      };

      const ethereum = window.ethereum;
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);
      ethereum.on('disconnect', handleDisconnect);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
        ethereum.removeListener('disconnect', handleDisconnect);
      };
    }
  }, [account]);

  const connectWallet = async () => {
    setError(null);
    
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to connect your wallet.');
      return;
    }

    setIsConnecting(true);

    try {
      const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await ethProvider.send('eth_requestAccounts', []);
      const network = await ethProvider.getNetwork();
      const ethSigner = ethProvider.getSigner();
      
      setAccount(accounts[0]);
      setChainId(network.chainId);
      setProvider(ethProvider);
      setSigner(ethSigner);
      setIsConnected(true);
      
      // Switch to Ethereum if not on it
      if (network.chainId !== CHAINS.ethereum.id) {
        await switchNetwork(CHAINS.ethereum.id);
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
  };

  const switchNetwork = async (targetChainId: number): Promise<boolean> => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return false;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      return true;
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError && typeof switchError === 'object' && 'code' in switchError && switchError.code === 4902) {
        try {
          const chain = Object.values(CHAINS).find(c => c.id === targetChainId);
          if (!chain) {
            throw new Error(`Chain with ID ${targetChainId} not found in constants`);
          }

          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: chain.name,
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: [chain.rpcUrl],
                blockExplorerUrls: [chain.blockExplorer],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Error adding chain:', addError);
          setError('Failed to add network to MetaMask');
          return false;
        }
      }
      console.error('Error switching chain:', switchError);
      setError('Failed to switch network');
      return false;
    }
  };

  const value = {
    account,
    address: account, // Provide address as an alias for account
    chainId,
    provider,
    signer,
    isConnecting,
    isConnected,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    error,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
