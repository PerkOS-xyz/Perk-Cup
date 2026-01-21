"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { LogOut, Coins, Loader2, Wallet } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { isConnected, player, loading, disconnect, connect } = useWalletAuth();
  
  // Hide header on landing page when not connected
  const isLandingPage = pathname === "/";
  if (isLandingPage && !isConnected && !loading) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/mascot-hero.png"
            alt="Perk Mascot"
            width={40}
            height={40}
            className="rounded-full border-2 border-primary"
          />
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Perk Olympics
            </h1>
            {player && (
              <p className="text-xs text-muted-foreground">
                Level {player.level}
              </p>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : isConnected ? (
            <>
              {player && (
                <div className="flex items-center gap-1 text-sm bg-card/50 px-3 py-1.5 rounded-full border border-border">
                  <Coins className="h-4 w-4 text-accent" />
                  <span className="font-medium">{player.credits}</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnect()}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Disconnect</span>
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
