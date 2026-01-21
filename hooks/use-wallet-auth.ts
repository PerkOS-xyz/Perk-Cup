"use client";

import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "@/lib/web3/provider";
import { createClient } from "@/lib/supabase/client";

interface Player {
  id: string;
  wallet_address: string;
  username: string;
  credits: number;
  level: number;
  total_score: number;
}

export function useWalletAuth() {
  const { address, isConnected, isConnecting, usdcBalance, chainId, isOnCelo, connect, disconnect } = useWeb3();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchOrCreatePlayer = useCallback(async (walletAddress: string) => {
    setLoading(true);
    try {
      // Check if player exists
      const { data: existingPlayer, error: fetchError } = await supabase
        .from("players")
        .select("*")
        .eq("wallet_address", walletAddress.toLowerCase())
        .single();

      if (existingPlayer) {
        setPlayer(existingPlayer);
      } else if (fetchError?.code === "PGRST116") {
        // Player doesn't exist, create new one
        const username = `Perk${walletAddress.slice(2, 8)}`;
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

        if (createError) throw createError;
        setPlayer(newPlayer);
      }
    } catch (err) {
      console.error("Failed to fetch/create player:", err);
      setPlayer(null);
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

    try {
      const { error } = await supabase
        .from("players")
        .update({ credits: player.credits - amount })
        .eq("id", player.id);

      if (error) throw error;
      setPlayer((prev) => prev ? { ...prev, credits: prev.credits - amount } : null);
      return true;
    } catch (err) {
      console.error("Failed to spend credits:", err);
      return false;
    }
  }, [player, supabase]);

  const addScore = useCallback(async (gameId: string, score: number): Promise<void> => {
    if (!player) return;

    try {
      // Update total score
      await supabase
        .from("players")
        .update({
          total_score: player.total_score + score,
          level: Math.floor((player.total_score + score) / 1000) + 1,
        })
        .eq("id", player.id);

      // Record high score
      const { data: existingScore } = await supabase
        .from("high_scores")
        .select("*")
        .eq("player_id", player.id)
        .eq("game_id", gameId)
        .single();

      if (!existingScore || score > existingScore.score) {
        await supabase.from("high_scores").upsert({
          player_id: player.id,
          game_id: gameId,
          score,
        });
      }

      setPlayer((prev) =>
        prev
          ? {
              ...prev,
              total_score: prev.total_score + score,
              level: Math.floor((prev.total_score + score) / 1000) + 1,
            }
          : null
      );
    } catch (err) {
      console.error("Failed to add score:", err);
    }
  }, [player, supabase]);

  return {
    address,
    isConnected,
    isConnecting,
    player,
    loading,
    usdcBalance,
    chainId,
    isOnCelo,
    connect,
    disconnect,
    spendCredits,
    addScore,
    refreshPlayer: () => address && fetchOrCreatePlayer(address),
  };
}
