"use client";

import { useModal, useAccount, useLogout } from "@getpara/react-sdk";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Player {
  id: string;
  wallet_address: string;
  username: string;
  credits: number;
  total_score: number;
  level: number;
  credits_last_reset: string;
}

export function useParaAuth() {
  const { openModal } = useModal();
  const { address, isConnected } = useAccount();
  const logoutMutation = useLogout();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreatePlayer = useCallback(async (walletAddress: string) => {
    const supabase = createClient();
    
    // Check if player exists
    const { data: existingPlayer } = await supabase
      .from("players")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    if (existingPlayer) {
      // Check if credits need to be reset (monthly)
      const lastReset = new Date(existingPlayer.credits_last_reset);
      const now = new Date();
      const monthDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                        (now.getMonth() - lastReset.getMonth());
      
      if (monthDiff >= 1) {
        // Reset credits
        const { data: updatedPlayer } = await supabase
          .from("players")
          .update({ credits: 200, credits_last_reset: now.toISOString() })
          .eq("id", existingPlayer.id)
          .select()
          .single();
        
        setPlayer(updatedPlayer);
      } else {
        setPlayer(existingPlayer);
      }
    } else {
      // Create new player
      const username = `Perk${walletAddress.slice(-6).toUpperCase()}`;
      const { data: newPlayer } = await supabase
        .from("players")
        .insert({
          wallet_address: walletAddress.toLowerCase(),
          username,
          credits: 200,
        })
        .select()
        .single();
      
      setPlayer(newPlayer);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      fetchOrCreatePlayer(address);
    } else {
      setPlayer(null);
      setLoading(false);
    }
  }, [isConnected, address, fetchOrCreatePlayer]);

  const connect = useCallback(() => {
    openModal();
  }, [openModal]);

  const disconnect = useCallback(() => {
    if (logoutMutation?.logout) {
      logoutMutation.logout();
      setPlayer(null);
    }
  }, [logoutMutation]);

  const refreshPlayer = useCallback(async () => {
    if (address) {
      const supabase = createClient();
      const { data } = await supabase
        .from("players")
        .select("*")
        .eq("wallet_address", address.toLowerCase())
        .single();
      
      if (data) setPlayer(data);
    }
  }, [address]);

  const spendCredits = useCallback(async (amount: number): Promise<boolean> => {
    if (!player || player.credits < amount) return false;
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from("players")
      .update({ credits: player.credits - amount })
      .eq("id", player.id)
      .select()
      .single();
    
    if (error || !data) return false;
    
    setPlayer(data);
    return true;
  }, [player]);

  const addScore = useCallback(async (gameId: string, score: number) => {
    if (!player) return;
    
    const supabase = createClient();
    
    // Save game session
    await supabase.from("game_sessions").insert({
      player_id: player.id,
      game_id: gameId,
      score,
    });
    
    // Update or insert high score
    const { data: existingHighScore } = await supabase
      .from("high_scores")
      .select("*")
      .eq("player_id", player.id)
      .eq("game_id", gameId)
      .single();
    
    if (existingHighScore) {
      if (score > existingHighScore.score) {
        await supabase
          .from("high_scores")
          .update({ score })
          .eq("id", existingHighScore.id);
      }
    } else {
      await supabase.from("high_scores").insert({
        player_id: player.id,
        game_id: gameId,
        score,
      });
    }
    
    // Update total score and level
    const newTotalScore = player.total_score + score;
    const newLevel = Math.floor(newTotalScore / 1000) + 1;
    
    const { data: updatedPlayer } = await supabase
      .from("players")
      .update({ total_score: newTotalScore, level: newLevel })
      .eq("id", player.id)
      .select()
      .single();
    
    if (updatedPlayer) setPlayer(updatedPlayer);
  }, [player]);

  return {
    isConnected,
    address,
    player,
    loading,
    connect,
    disconnect,
    refreshPlayer,
    spendCredits,
    addScore,
  };
}
