"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { useWeb3 } from "@/lib/web3/provider";
import { Coins, Loader2, CircleDollarSign, LogOut, Copy, Check } from "lucide-react";
import { useState } from "react";

// Truncate wallet address: first 5 chars + "..." + last 5 chars
function truncateAddress(address: string): string {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
}

export function AuthHeader() {
  const { player, loading, isOnCelo, usdcBalance, disconnect } = useWalletAuth();
  const { address } = useWeb3();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="max-w-2xl mx-auto px-4 py-2.5">
        {/* Main header row */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Logo and user info */}
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <Image
                src="/images/mascot-hero.png"
                alt="Perk"
                width={36}
                height={36}
                className="rounded-full border-2 border-primary/50"
              />
              {isOnCelo && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-foreground">Perk Cup</h1>
                {player && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    Lv.{player.level}
                  </span>
                )}
              </div>
              {/* Wallet address with copy */}
              {address && (
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-mono"
                >
                  {truncateAddress(address)}
                  {copied ? (
                    <Check className="h-2.5 w-2.5 text-green-500" />
                  ) : (
                    <Copy className="h-2.5 w-2.5 opacity-50" />
                  )}
                </button>
              )}
            </div>
          </Link>

          {/* Right: Stats and actions */}
          <div className="flex items-center gap-1.5">
            {/* USDC Balance */}
            {usdcBalance !== null && (
              <div className="flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
                <CircleDollarSign className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400">{usdcBalance}</span>
              </div>
            )}

            {/* Credits Display */}
            {loading ? (
              <div className="px-2 py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              </div>
            ) : player ? (
              <div className="flex items-center gap-1 bg-accent/10 px-2 py-1 rounded-lg border border-accent/20">
                <Coins className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs font-semibold text-accent">{player.credits}</span>
              </div>
            ) : null}

            {/* Disconnect Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnect}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
