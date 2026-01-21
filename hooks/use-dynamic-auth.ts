"use client";

import { useState, useEffect, useCallback } from "react";
import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { createClient } from "@/lib/supabase/client";

// Circle USDC on Celo Mainnet
const USDC_CONTRACT_ADDRESS = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const USDC_DECIMALS = 6;
const CELO_CHAIN_ID = 42220;

interface Player {
  id: string;
  wallet_address: string;
  username: string;
  credits: number;
  level: number;
  total_score: number;
  created_at: string;
}

export function useDynamicAuth() {
  const { primaryWallet, network, setShowAuthFlow } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);

  const address = primaryWallet?.address || null;
  const isConnected = isLoggedIn && !!address;
  const chainId = network ? Number(network) : null;
  const isOnCelo = chainId === CELO_CHAIN_ID;

  // Fetch USDC balance
  const fetchUsdcBalance = useCallback(async (walletAddress: string) => {
    if (!primaryWallet) return;
    
    try {
      const provider = await primaryWallet.getWalletClient();
      if (!provider) return;
      
      // Use eth_call to get balance
      const paddedAddress = walletAddress.toLowerCase().replace("0x", "").padStart(64, "0");
      const data = "0x70a08231" + paddedAddress;
      
      const result = await provider.request({
        method: "eth_call",
        params: [{ to: USDC_CONTRACT_ADDRESS, data }, "latest"],
      });
      
      if (!result || result === "0x" || result === "0x0") {
        setUsdcBalance("0.00");
        return;
      }
      
      const balanceWei = BigInt(result as string);
      const balanceFormatted = (Number(balanceWei) / Math.pow(10, USDC_DECIMALS)).toFixed(2);
      setUsdcBalance(balanceFormatted);
    } catch (err) {
      console.error("Failed to fetch USDC balance:", err);
      setUsdcBalance("0.00");
    }
  }, [primaryWallet]);

  // Fetch or create player
  const fetchOrCreatePlayer = useCallback(async (walletAddress: string) => {
    const supabase = createClient();
    setLoading(true);

    try {
      // Try to get existing player
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
      const username = `Perk${walletAddress.slice(2, 6).toUpperCase()}`;
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
    } catch (err) {
      console.error("Failed to fetch/create player:", err);
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Spend credits
  const spendCredits = useCallback(async (amount: number): Promise<boolean> => {
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

    setPlayer((prev) => prev ? { ...prev, credits: prev.credits - amount } : null);
    return true;
  }, [player]);

  // Add score
  const addScore = useCallback(async (gameId: string, score: number): Promise<void> => {
    if (!player) return;

    const supabase = createClient();

    // Update total score and level
    const newTotalScore = player.total_score + score;
    const newLevel = Math.floor(newTotalScore / 1000) + 1;

    await supabase
      .from("players")
      .update({ total_score: newTotalScore, level: newLevel })
      .eq("id", player.id);

    // Save high score if applicable
    const { data: existingScore } = await supabase
      .from("high_scores")
      .select("score")
      .eq("player_id", player.id)
      .eq("game_id", gameId)
      .single();

    if (!existingScore || score > existingScore.score) {
      await supabase
        .from("high_scores")
        .upsert({
          player_id: player.id,
          game_id: gameId,
          score,
        }, { onConflict: "player_id,game_id" });
    }

    setPlayer((prev) => prev ? { ...prev, total_score: newTotalScore, level: newLevel } : null);
  }, [player]);

  // Open connect modal
  const openConnectModal = useCallback(() => {
    setShowAuthFlow?.(true);
  }, [setShowAuthFlow]);

  // Effect to handle wallet connection
  useEffect(() => {
    if (isConnected && address) {
      fetchOrCreatePlayer(address);
      fetchUsdcBalance(address);
    } else {
      setPlayer(null);
      setUsdcBalance(null);
      setLoading(false);
    }
  }, [isConnected, address, fetchOrCreatePlayer, fetchUsdcBalance]);

  return {
    address,
    isConnected,
    isConnecting: false,
    loading,
    player,
    usdcBalance,
    chainId,
    isOnCelo,
    openConnectModal,
    spendCredits,
    addScore,
  };
}
