"use client";

import { useCallback, useEffect, useState } from "react";
import { useActiveAccount, useActiveWalletChain, useWalletBalance } from "thirdweb/react";
import { celo } from "thirdweb/chains";
import { client } from "@/lib/thirdweb/client";
import { createClient } from "@/lib/supabase/client";

// Circle USDC on Celo Mainnet
const USDC_CONTRACT_ADDRESS = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";

interface Player {
  id: string;
  wallet_address: string;
  username: string;
  credits: number;
  level: number;
  total_score: number;
}

export function useThirdwebAuth() {
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const address = account?.address || null;
  const isConnected = !!account;
  const isOnCelo = chain?.id === celo.id;

  // Get USDC balance on Celo
  const { data: usdcBalanceData } = useWalletBalance({
    client,
    chain: celo,
    address: address || undefined,
    tokenAddress: USDC_CONTRACT_ADDRESS,
  });

  const usdcBalance = usdcBalanceData ? usdcBalanceData.displayValue : null;

  // Fetch or create player
  const fetchOrCreatePlayer = useCallback(async (walletAddress: string) => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Check if player exists
      const { data: existingPlayer, error: fetchError } = await supabase
        .from("players")
        .select("*")
        .eq("wallet_address", walletAddress.toLowerCase())
        .single();

      if (existingPlayer && !fetchError) {
        setPlayer(existingPlayer);
        setLoading(false);
        return;
      }

      // Create new player
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
        setPlayer(null);
      } else {
        setPlayer(newPlayer);
      }
    } catch (err) {
      console.error("Error in fetchOrCreatePlayer:", err);
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to fetch player when address changes
  useEffect(() => {
    if (isConnected && address) {
      fetchOrCreatePlayer(address);
    } else {
      setPlayer(null);
      setLoading(false);
    }
  }, [isConnected, address, fetchOrCreatePlayer]);

  // Spend credits
  const spendCredits = useCallback(
    async (amount: number): Promise<boolean> => {
      if (!player || player.credits < amount) return false;

      const supabase = createClient();
      const { error } = await supabase
        .from("players")
        .update({ credits: player.credits - amount })
        .eq("id", player.id);

      if (error) {
        console.error("Failed to spend credits:", error);
        return false;
      }

      setPlayer((prev) => (prev ? { ...prev, credits: prev.credits - amount } : null));
      return true;
    },
    [player]
  );

  // Add score
  const addScore = useCallback(
    async (gameId: string, score: number): Promise<boolean> => {
      if (!player) return false;

      const supabase = createClient();

      // Update total score and level
      const newTotalScore = player.total_score + score;
      const newLevel = Math.floor(newTotalScore / 1000) + 1;

      const { error: updateError } = await supabase
        .from("players")
        .update({ total_score: newTotalScore, level: newLevel })
        .eq("id", player.id);

      if (updateError) {
        console.error("Failed to update score:", updateError);
        return false;
      }

      // Save high score if better
      const { data: existingHighScore } = await supabase
        .from("high_scores")
        .select("score")
        .eq("player_id", player.id)
        .eq("game_id", gameId)
        .single();

      if (!existingHighScore || score > existingHighScore.score) {
        await supabase.from("high_scores").upsert({
          player_id: player.id,
          game_id: gameId,
          score,
        });
      }

      setPlayer((prev) =>
        prev ? { ...prev, total_score: newTotalScore, level: newLevel } : null
      );
      return true;
    },
    [player]
  );

  // Refresh player data
  const refreshPlayer = useCallback(async () => {
    if (address) {
      await fetchOrCreatePlayer(address);
    }
  }, [address, fetchOrCreatePlayer]);

  return {
    address,
    isConnected,
    isOnCelo,
    chainId: chain?.id || null,
    usdcBalance,
    player,
    loading,
    spendCredits,
    addScore,
    refreshPlayer,
  };
}
