"use client";

import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "@/lib/web3/provider";
import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/lib/game-types";

export function useWalletAuth() {
  const { 
    address, 
    isConnected, 
    isConnecting, 
    usdcBalance, 
    isOnCelo, 
    connect, 
    disconnect 
  } = useWeb3();
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchOrCreatePlayer = useCallback(async (walletAddress: string) => {
    setLoading(true);
    try {
      const { data: existingPlayer, error: fetchError } = await supabase
        .from("players")
        .select("*")
        .eq("wallet_address", walletAddress.toLowerCase())
        .single();

      if (existingPlayer && !fetchError) {
        setPlayer(existingPlayer);
      } else {
        const username = `Perk_${walletAddress.slice(2, 8)}`;
        const { data: newPlayer, error: createError } = await supabase
          .from("players")
          .insert({
            wallet_address: walletAddress.toLowerCase(),
            username,
            credits: 200,
            level: 1,
            total_score: 0,
          })
          .select()
          .single();

        if (createError) {
          console.error("Failed to create player:", createError);
        } else {
          setPlayer(newPlayer);
        }
      }
    } catch (err) {
      console.error("Error fetching/creating player:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (isConnected && address) {
      fetchOrCreatePlayer(address);
    } else {
      setPlayer(null);
      setLoading(false);
    }
  }, [isConnected, address, fetchOrCreatePlayer]);

  const spendCredits = useCallback(async (amount: number): Promise<boolean> => {
    if (!player || player.credits < amount) return false;

    const { error } = await supabase
      .from("players")
      .update({ credits: player.credits - amount })
      .eq("id", player.id);

    if (error) {
      console.error("Failed to spend credits:", error);
      return false;
    }

    setPlayer((prev) => prev ? { ...prev, credits: prev.credits - amount } : null);
    return true;
  }, [player, supabase]);

  const addScore = useCallback(async (gameId: string, score: number): Promise<void> => {
    if (!player) return;

    // Update total score
    const newTotalScore = player.total_score + score;
    const newLevel = Math.floor(newTotalScore / 1000) + 1;

    await supabase
      .from("players")
      .update({ total_score: newTotalScore, level: newLevel })
      .eq("id", player.id);

    // Check and update high score
    const { data: existingHighScore } = await supabase
      .from("high_scores")
      .select("*")
      .eq("player_id", player.id)
      .eq("game_id", gameId)
      .single();

    if (!existingHighScore || score > existingHighScore.score) {
      await supabase
        .from("high_scores")
        .upsert({
          player_id: player.id,
          game_id: gameId,
          score,
        });
    }

    setPlayer((prev) => prev ? { ...prev, total_score: newTotalScore, level: newLevel } : null);
  }, [player, supabase]);

  return {
    isConnected,
    isConnecting,
    player,
    loading,
    usdcBalance,
    isOnCelo,
    connect,
    disconnect,
    spendCredits,
    addScore,
    refreshPlayer: () => address && fetchOrCreatePlayer(address),
  };
}
