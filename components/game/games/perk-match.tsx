"use client";

import React from "react"

import { useEffect, useState, useCallback } from "react";
import { Car, Gamepad2, Heart, Star, Zap, Moon, Sun, Cloud } from "lucide-react";

interface PerkMatchProps {
  onGameOver: (score: number) => void;
  setScore: (score: number | ((prev: number) => number)) => void;
}

interface Card {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ICONS = ["car", "gamepad", "heart", "star", "zap", "moon", "sun", "cloud"];

const iconMap: Record<string, React.ReactNode> = {
  car: <Car className="h-8 w-8" />,
  gamepad: <Gamepad2 className="h-8 w-8" />,
  heart: <Heart className="h-8 w-8" />,
  star: <Star className="h-8 w-8" />,
  zap: <Zap className="h-8 w-8" />,
  moon: <Moon className="h-8 w-8" />,
  sun: <Sun className="h-8 w-8" />,
  cloud: <Cloud className="h-8 w-8" />,
};

export function PerkMatch({ onGameOver, setScore }: PerkMatchProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [combo, setCombo] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [matchedCount, setMatchedCount] = useState(0);

  // Initialize cards
  useEffect(() => {
    const shuffledIcons = [...ICONS, ...ICONS]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledIcons);
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onGameOver(matchedCount * 100 + combo * 10);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, matchedCount, combo, onGameOver]);

  // Check for win
  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.isMatched)) {
      // Bonus for finishing with time remaining
      const timeBonus = timeLeft * 10;
      onGameOver(matchedCount * 100 + combo * 10 + timeBonus);
    }
  }, [cards, matchedCount, combo, timeLeft, onGameOver]);

  const handleCardClick = useCallback((cardId: number) => {
    if (isLocked) return;
    
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    // Flip the card
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c))
    );

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find((c) => c.id === firstId);
      const secondCard = cards.find((c) => c.id === secondId);

      if (firstCard && secondCard && firstCard.icon === secondCard.icon) {
        // Match found!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isMatched: true }
                : c
            )
          );
          setCombo((prev) => prev + 1);
          setMatchedCount((prev) => prev + 1);
          
          // Score with combo multiplier
          const comboMultiplier = Math.min(combo + 1, 5);
          setScore((prev) => prev + 100 * comboMultiplier);
          
          setFlippedCards([]);
          setIsLocked(false);
        }, 300);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setCombo(0);
          setFlippedCards([]);
          setIsLocked(false);
        }, 800);
      }
    }
  }, [cards, flippedCards, isLocked, combo, setScore]);

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-purple-900 to-indigo-900 rounded-xl overflow-hidden p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="bg-black/30 px-3 py-1 rounded-full">
          <span className="text-xl font-bold">{timeLeft}</span>
          <span className="text-sm ml-1 text-white/70">sec</span>
        </div>
        
        {combo > 0 && (
          <div className="bg-yellow-500/30 text-yellow-300 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            {combo}x COMBO!
          </div>
        )}
        
        <div className="bg-black/30 px-3 py-1 rounded-full">
          <span className="text-sm text-white/70">Matched:</span>
          <span className="text-lg font-bold ml-1">{matchedCount}/8</span>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-4 gap-2 aspect-square max-h-[calc(100%-80px)]">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isMatched || card.isFlipped || isLocked}
            className={`
              aspect-square rounded-xl transition-all duration-300 transform
              ${card.isFlipped || card.isMatched
                ? "bg-gradient-to-br from-pink-500 to-purple-500 rotate-0"
                : "bg-gradient-to-br from-slate-600 to-slate-700 hover:scale-105"
              }
              ${card.isMatched ? "opacity-50 scale-95" : ""}
              flex items-center justify-center shadow-lg
            `}
            style={{
              transformStyle: "preserve-3d",
              perspective: "1000px",
            }}
          >
            {(card.isFlipped || card.isMatched) ? (
              <div className="text-white">{iconMap[card.icon]}</div>
            ) : (
              <div className="text-slate-400 text-2xl font-bold">?</div>
            )}
          </button>
        ))}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/50">
        Find all matching pairs!
      </div>
    </div>
  );
}
