"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  hasCheckedConnection: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const Web3Context = createContext<Web3ContextType>({
  address: null,
  isConnected: false,
  isConnecting: false,
  hasCheckedConnection: false,
  connect: async () => {},
  disconnect: () => {},
});

export const useWeb3 = () => useContext(Web3Context);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasCheckedConnection, setHasCheckedConnection] = useState(true);
  
  // No auto-check - wait for user to explicitly connect

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAddress(null);
        } else {
          setAddress(accounts[0]);
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;
    
    setIsConnecting(true);
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ 
          method: "eth_requestAccounts" 
        });
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
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
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected: !!address,
        isConnecting,
        hasCheckedConnection,
        connect,
        disconnect,
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
