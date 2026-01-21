"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

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
const ERC20_BALANCE_OF_ABI = "0x70a08231";

interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  usdcBalance: string | null;
  chainId: string | null;
  isOnCelo: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshUsdcBalance: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType>({
  address: null,
  isConnected: false,
  isConnecting: false,
  usdcBalance: null,
  chainId: null,
  isOnCelo: false,
  connect: async () => {},
  disconnect: () => {},
  refreshUsdcBalance: async () => {},
});

export const useWeb3 = () => useContext(Web3Context);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);

  const isOnCelo = chainId === "0xa4ec";

  const fetchUsdcBalance = useCallback(async (walletAddress: string) => {
    if (typeof window === "undefined" || !window.ethereum) return;
    
    try {
      const paddedAddress = walletAddress.toLowerCase().replace("0x", "").padStart(64, "0");
      const data = ERC20_BALANCE_OF_ABI + paddedAddress;
      
      const result = await window.ethereum.request({
        method: "eth_call",
        params: [{ to: USDC_CONTRACT_ADDRESS, data }, "latest"],
      }) as string;
      
      const balanceWei = BigInt(result);
      const balanceFormatted = (Number(balanceWei) / Math.pow(10, USDC_DECIMALS)).toFixed(2);
      setUsdcBalance(balanceFormatted);
    } catch (err) {
      console.error("Failed to fetch USDC balance:", err);
      setUsdcBalance(null);
    }
  }, []);

  const refreshUsdcBalance = useCallback(async () => {
    if (address) await fetchUsdcBalance(address);
  }, [address, fetchUsdcBalance]);

  const fetchChainId = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      const id = await window.ethereum.request({ method: "eth_chainId" }) as string;
      setChainId(id);
    } catch (err) {
      console.error("Failed to fetch chain ID:", err);
    }
  }, []);

  const switchToCelo = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CELO_MAINNET.chainId }],
      });
      return true;
    } catch (switchError: unknown) {
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
      return false;
    }
  }, []);

  const isMobile = useCallback(() => {
    if (typeof window === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;
    
    setIsConnecting(true);
    try {
      // On mobile without injected provider, use deep link
      if (isMobile() && !window.ethereum) {
        const currentUrl = window.location.href;
        const metamaskDeepLink = `https://metamask.app.link/dapp/${currentUrl.replace(/^https?:\/\//, "")}`;
        window.location.href = metamaskDeepLink;
        return;
      }

      if (window.ethereum) {
        const accounts = await window.ethereum.request({ 
          method: "eth_requestAccounts" 
        }) as string[];
        
        if (accounts && accounts.length > 0) {
          await switchToCelo();
          setAddress(accounts[0]);
          await fetchChainId();
          await fetchUsdcBalance(accounts[0]);
        }
      } else {
        window.open("https://metamask.io/download/", "_blank");
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    } finally {
      setIsConnecting(false);
    }
  }, [switchToCelo, isMobile, fetchChainId, fetchUsdcBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setUsdcBalance(null);
    setChainId(null);
  }, []);

  // Listen for account and chain changes
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

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
      if (address) fetchUsdcBalance(address);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [address, fetchUsdcBalance]);

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected: !!address,
        isConnecting,
        usdcBalance,
        chainId,
        isOnCelo,
        connect,
        disconnect,
        refreshUsdcBalance,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}
