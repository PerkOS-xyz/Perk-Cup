"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// Celo Mainnet configuration
const CELO_MAINNET = {
  chainId: "0xa4ec", // 42220 in hex
  chainName: "Celo Mainnet",
  nativeCurrency: {
    name: "CELO",
    symbol: "CELO",
    decimals: 18,
  },
  rpcUrls: ["https://forno.celo.org"],
  blockExplorerUrls: ["https://celoscan.io"],
};

// Circle USDC on Celo Mainnet
const USDC_CONTRACT_ADDRESS = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const USDC_DECIMALS = 6;

// ERC20 balanceOf ABI
const ERC20_BALANCE_OF_ABI = "0x70a08231";

interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  hasCheckedConnection: boolean;
  usdcBalance: string | null;
  chainId: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshUsdcBalance: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType>({
  address: null,
  isConnected: false,
  isConnecting: false,
  hasCheckedConnection: false,
  usdcBalance: null,
  chainId: null,
  connect: async () => {},
  disconnect: () => {},
  refreshUsdcBalance: async () => {},
});

export const useWeb3 = () => useContext(Web3Context);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasCheckedConnection, setHasCheckedConnection] = useState(true);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  
  // Fetch USDC balance
  const fetchUsdcBalance = useCallback(async (walletAddress: string) => {
    if (!window.ethereum) return;
    
    try {
      // Pad address to 32 bytes
      const paddedAddress = walletAddress.toLowerCase().replace("0x", "").padStart(64, "0");
      const data = ERC20_BALANCE_OF_ABI + paddedAddress;
      
      const result = await window.ethereum.request({
        method: "eth_call",
        params: [
          {
            to: USDC_CONTRACT_ADDRESS,
            data: data,
          },
          "latest",
        ],
      }) as string;
      
      // Convert hex to decimal and format
      const balanceWei = BigInt(result);
      const balanceFormatted = (Number(balanceWei) / Math.pow(10, USDC_DECIMALS)).toFixed(2);
      setUsdcBalance(balanceFormatted);
    } catch (err) {
      console.error("Failed to fetch USDC balance:", err);
      setUsdcBalance(null);
    }
  }, []);

  const refreshUsdcBalance = useCallback(async () => {
    if (address) {
      await fetchUsdcBalance(address);
    }
  }, [address, fetchUsdcBalance]);

  // Fetch chain ID
  const fetchChainId = useCallback(async () => {
    if (!window.ethereum) return;
    
    try {
      const id = await window.ethereum.request({ method: "eth_chainId" }) as string;
      setChainId(id);
    } catch (err) {
      console.error("Failed to fetch chain ID:", err);
    }
  }, []);

  // No auto-check - wait for user to explicitly connect

  // Listen for account and chain changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAddress(null);
          setUsdcBalance(null);
        } else {
          setAddress(accounts[0]);
          fetchUsdcBalance(accounts[0]);
        }
      };

      const handleChainChanged = (newChainId: string) => {
        setChainId(newChainId);
        if (address) {
          fetchUsdcBalance(address);
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [address, fetchUsdcBalance]);

  const switchToCelo = useCallback(async () => {
    if (!window.ethereum) return false;
    
    try {
      // Try to switch to Celo
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CELO_MAINNET.chainId }],
      });
      return true;
    } catch (switchError: unknown) {
      // Chain not added, try to add it
      if (switchError && typeof switchError === "object" && "code" in switchError && switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [CELO_MAINNET],
          });
          return true;
        } catch (addError) {
          console.error("Failed to add Celo network:", addError);
          return false;
        }
      }
      console.error("Failed to switch to Celo:", switchError);
      return false;
    }
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;
    
    setIsConnecting(true);
    try {
      if (window.ethereum) {
        // First request accounts
        const accounts = await window.ethereum.request({ 
          method: "eth_requestAccounts" 
        }) as string[];
        
        if (accounts && accounts.length > 0) {
          // Then switch to Celo network
          const switched = await switchToCelo();
          setAddress(accounts[0]);
          
          // Fetch chain ID and USDC balance
          await fetchChainId();
          await fetchUsdcBalance(accounts[0]);
          
          if (!switched) {
            console.warn("Connected but not on Celo network");
          }
        }
      } else {
        // Open MetaMask install page if not available
        window.open("https://metamask.io/download/", "_blank");
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    } finally {
      setIsConnecting(false);
    }
  }, [switchToCelo]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setUsdcBalance(null);
    setChainId(null);
  }, []);

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected: !!address,
        isConnecting,
        hasCheckedConnection,
        usdcBalance,
        chainId,
        connect,
        disconnect,
        refreshUsdcBalance,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}
