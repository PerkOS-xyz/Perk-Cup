"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { LogOut, Coins, Loader2 } from "lucide-react";

export function AuthHeader() {
  const { player, loading, disconnect } = useWalletAuth();

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

        <div className="flex items-center gap-4">
          {/* Credits Display */}
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : player ? (
            <div className="flex items-center gap-1.5 bg-accent/10 px-3 py-1.5 rounded-full">
              <Coins className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">{player.credits}</span>
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
