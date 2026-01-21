"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { useWeb3 } from "@/lib/web3/provider";
import { LogOut, Coins, Loader2, CircleDollarSign } from "lucide-react";

export function AuthHeader() {
  const { player, loading, disconnect } = useWalletAuth();
  const { usdcBalance, chainId } = useWeb3();
  
  // Check if on Celo Mainnet (0xa4ec = 42220)
  const isOnCelo = chainId === "0xa4ec";

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/mascot-hero.png"
            alt="Perk"
            width={40}
            height={40}
            className="rounded-full border-2 border-primary"
          />
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Perk Cup
            </h1>
            {player && (
              <p className="text-xs text-muted-foreground">
                Level {player.level}
              </p>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {/* Celo Chain Badge */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isOnCelo 
              ? "bg-green-500/10 text-green-500 border border-green-500/20" 
              : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
          }`}>
            <div className={`w-2 h-2 rounded-full ${isOnCelo ? "bg-green-500" : "bg-yellow-500"}`} />
            <span className="hidden sm:inline">{isOnCelo ? "Celo" : "Wrong Network"}</span>
          </div>

          {/* USDC Balance */}
          {usdcBalance !== null && (
            <div className="flex items-center gap-1.5 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
              <CircleDollarSign className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-medium text-blue-500">{usdcBalance}</span>
            </div>
          )}

          {/* Credits Display */}
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : player ? (
            <div className="flex items-center gap-1.5 bg-accent/10 px-2.5 py-1 rounded-full">
              <Coins className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-medium">{player.credits}</span>
            </div>
          ) : null}

          {/* Disconnect Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => disconnect()}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Disconnect</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
