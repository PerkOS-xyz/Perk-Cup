"use client";

import React from "react";
import {
  DynamicContextProvider,
  DynamicWidget,
} from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

const DYNAMIC_ENVIRONMENT_ID = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || "";

// Celo Mainnet chain ID
const CELO_CHAIN_ID = 42220;

export function DynamicProvider({ children }: { children: React.ReactNode }) {
  if (!DYNAMIC_ENVIRONMENT_ID) {
    return <>{children}</>;
  }

  return (
    <DynamicContextProvider
      theme="dark"
      settings={{
        environmentId: DYNAMIC_ENVIRONMENT_ID,
        walletConnectors: [EthereumWalletConnectors],
        evmNetworks: [
          {
            chainId: CELO_CHAIN_ID,
            networkId: CELO_CHAIN_ID,
            name: "Celo",
            nativeCurrency: {
              name: "CELO",
              symbol: "CELO",
              decimals: 18,
            },
            rpcUrls: ["https://forno.celo.org"],
            blockExplorerUrls: ["https://celoscan.io"],
            iconUrls: ["https://app.dynamic.xyz/assets/networks/celo.svg"],
          },
        ],
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}

export { DynamicWidget };
