"use client";

import React from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { getGameBySlug, type Game } from "@/lib/game-types";
import { AuthHeader } from "@/components/game/auth-header";
import { ArrowLeft, Coins, Play, Trophy, RotateCcw, Home } from "lucide-react";
interface GameWrapperProps {
  slug: string;
  children: (props: {
    gameState: "idle" | "playing" | "finished";
    score: number;
    setScore: (score: number | ((prev: number) => number)) => void;
    onGameOver: (finalScore: number) => void;
    startGame: () => void;
  }) => React.ReactNode;
}

export function GameWrapper({ slug, children }: GameWrapperProps) {
  const router = useRouter();
  const { player, spendCredits, addScore, isConnected, loading } = useWalletAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    const g = getGameBySlug(slug);
    if (g) {
      setGame(g);
      setCanPlay(player ? player.credits >= g.credit_cost : false);
    }
  }, [slug, player]);

  // Only redirect if we've finished loading AND confirmed not connected
  // Add a small delay to prevent race conditions with wallet state
  useEffect(() => {
    if (!loading && !isConnected && !player) {
      const timeout = setTimeout(() => {
        router.push("/");
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [loading, isConnected, player, router]);

  const startGame = useCallback(async () => {
    if (!game || !player) return;
    
    const success = await spendCredits(game.credit_cost);
    if (success) {
      setScore(0);
      setGameState("playing");
    }
  }, [game, player, spendCredits]);

  const onGameOver = useCallback(async (finalScore: number) => {
    setGameState("finished");
    setScore(finalScore);
    
    if (finalScore > highScore) {
      setHighScore(finalScore);
    }
    
    if (game) {
      await addScore(game.id, finalScore);
    }
  }, [game, highScore, addScore]);

  const playAgain = useCallback(() => {
    if (player && game && player.credits >= game.credit_cost) {
      setGameState("idle");
    }
  }, [player, game]);

  if (loading || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <AuthHeader />
      <div className="min-h-[calc(100vh-60px)] bg-background flex flex-col">
        {/* Game Sub-Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className={`font-bold bg-gradient-to-r ${game.color} bg-clip-text text-transparent`}>
            {game.name}
          </h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Game Area */}
        <div className="flex-1 flex flex-col p-4">
          {gameState === "idle" && (
            <Card className="flex-1 flex flex-col items-center justify-center p-6 bg-card/50 backdrop-blur">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-6`}>
                <Play className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">{game.name}</h2>
              <p className="text-muted-foreground text-center mb-6 max-w-xs">
                {game.description}
              </p>
              {highScore > 0 && (
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span>Best: {highScore.toLocaleString()}</span>
                </div>
              )}
              <Button
                size="lg"
                onClick={startGame}
                disabled={!canPlay}
                className={`gap-2 ${canPlay ? "animate-pulse-glow" : ""}`}
              >
                <Coins className="h-5 w-5" />
                Play ({game.credit_cost} credits)
              </Button>
              {!canPlay && (
                <p className="text-destructive text-sm mt-2">Not enough credits!</p>
              )}
            </Card>
          )}

          {gameState === "playing" && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl font-bold">{score.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">pts</div>
              </div>
              <div className="flex-1 game-canvas">
                {children({ gameState, score, setScore, onGameOver, startGame })}
              </div>
            </div>
          )}

          {gameState === "finished" && (
            <Card className="flex-1 flex flex-col items-center justify-center p-6 bg-card/50 backdrop-blur">
              <Trophy className="h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
              <p className="text-4xl font-bold text-primary mb-2">
                {score.toLocaleString()}
              </p>
              <p className="text-muted-foreground mb-6">points</p>
              
              {score >= highScore && score > 0 && (
                <div className="bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  New High Score!
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.push("/")}>
                  <Home className="h-4 w-4 mr-2" />
                  Menu
                </Button>
                <Button
                  onClick={playAgain}
                  disabled={!player || player.credits < game.credit_cost}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Again ({game.credit_cost})
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
