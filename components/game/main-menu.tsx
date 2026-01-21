"use client";

import React from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MascotSlideshow } from "@/components/game/mascot-slideshow";
import { PublicHeader } from "@/components/game/public-header";
import { AuthHeader } from "@/components/game/auth-header";
import { useDynamicAuth } from "@/hooks/use-dynamic-auth";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { GAMES } from "@/lib/game-types";
import {
  Car,
  ArrowUp,
  Layers,
  Grid3X3,
  Target,
  Snail,
  Coins,
  Trophy,
  Wallet,
  Loader2,
} from "lucide-react";
const iconMap: Record<string, React.ReactNode> = {
  car: <Car className="h-6 w-6" />,
  "arrow-up": <ArrowUp className="h-6 w-6" />,
  layers: <Layers className="h-6 w-6" />,
  grid: <Grid3X3 className="h-6 w-6" />,
  target: <Target className="h-6 w-6" />,
  move: <Snail className="h-6 w-6" />,
};

export function MainMenu() {
  const { isConnected, player, loading, openConnectModal } = useDynamicAuth();
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isConnected ? <AuthHeader /> : <PublicHeader />}
      <div className="min-h-[calc(100vh-60px)] bg-background overflow-hidden">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-md mx-auto px-4 py-6 min-h-[calc(100vh-60px)] flex flex-col">
          {/* Stats Bar */}
          {player && (
            <Card className="p-4 mb-6 bg-card/50 backdrop-blur border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-accent" />
                  <span className="font-bold text-lg">{player.credits}</span>
                  <span className="text-sm text-muted-foreground">credits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="font-bold text-lg">
                    {player.total_score.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">pts</span>
                </div>
              </div>
            </Card>
          )}

          {/* Games Grid */}
          {!isConnected ? (
            <Card className="p-8 text-center bg-card/50 backdrop-blur border-primary/20 flex-1 flex flex-col items-center justify-center">
              <MascotSlideshow />
              <h2 className="text-2xl font-bold mb-2">Welcome to Perk Cup!</h2>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to start playing and competing!
              </p>
              <DynamicWidget />
            </Card>
          ) : (
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-4">Choose Your Game</h2>
              <div className="grid grid-cols-2 gap-3">
                {GAMES.map((game) => {
                  const canAfford = player && player.credits >= game.credit_cost;
                  const isHovered = hoveredGame === game.id;

                  return (
                    <Link
                      key={game.id}
                      href={canAfford ? `/play/${game.slug}` : "#"}
                      onClick={(e) => !canAfford && e.preventDefault()}
                    >
                      <Card
                        className={`p-4 h-full transition-all duration-300 cursor-pointer ${
                          canAfford
                            ? "hover:scale-105 hover:border-primary/50 bg-card/50 backdrop-blur"
                            : "opacity-50 cursor-not-allowed bg-card/30"
                        } ${isHovered ? "border-primary" : "border-border"}`}
                        onMouseEnter={() => setHoveredGame(game.id)}
                        onMouseLeave={() => setHoveredGame(null)}
                        onTouchStart={() => setHoveredGame(game.id)}
                        onTouchEnd={() => setHoveredGame(null)}
                      >
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-3 text-white`}
                        >
                          {iconMap[game.icon]}
                        </div>
                        <h3 className="font-semibold text-sm mb-1">{game.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {game.description}
                        </p>
                        <div className="flex items-center gap-1 text-xs">
                          <Coins className="h-3 w-3 text-accent" />
                          <span
                            className={
                              canAfford ? "text-accent" : "text-destructive"
                            }
                          >
                            {game.credit_cost}
                          </span>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              200 credits refresh monthly
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
