"use client";

import React from "react"

import { useEffect, useRef, useCallback, useState } from "react";


interface PerkRacerProps {
  onGameOver: (score: number) => void;
  setScore: (score: number | ((prev: number) => number)) => void;
}

interface Obstacle {
  id: number;
  lane: number;
  y: number;
  type: "rock" | "cone" | "barrier";
}

interface Coin {
  id: number;
  lane: number;
  y: number;
}

const LANES = [0, 1, 2];
const LANE_WIDTH = 33.33;

export function PerkRacer({ onGameOver, setScore }: PerkRacerProps) {
  const [playerLane, setPlayerLane] = useState(1);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(5);
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const obstacleIdRef = useRef(0);
  const coinIdRef = useRef(0);
  const touchStartRef = useRef<number | null>(null);

  const moveLeft = useCallback(() => {
    setPlayerLane((prev) => Math.max(0, prev - 1));
  }, []);

  const moveRight = useCallback(() => {
    setPlayerLane((prev) => Math.min(2, prev + 1));
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchEnd - touchStartRef.current;
    
    if (Math.abs(diff) > 30) {
      if (diff > 0) {
        moveRight();
      } else {
        moveLeft();
      }
    }
    
    touchStartRef.current = null;
  }, [moveLeft, moveRight]);

  const handleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!gameRef.current) return;
    
    const rect = gameRef.current.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const relativeX = x - rect.left;
    const tapLane = Math.floor((relativeX / rect.width) * 3);
    
    if (tapLane < playerLane) {
      moveLeft();
    } else if (tapLane > playerLane) {
      moveRight();
    }
  }, [playerLane, moveLeft, moveRight]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        moveLeft();
      } else if (e.key === "ArrowRight" || e.key === "d") {
        moveRight();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveLeft, moveRight]);

  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      
      if (delta > 16) {
        lastTimeRef.current = timestamp;
        
        // Update distance and speed
        setDistance((prev) => {
          const newDist = prev + speed * 0.1;
          setScore(Math.floor(newDist));
          return newDist;
        });
        
        // Increase speed over time
        setSpeed((prev) => Math.min(15, prev + 0.001));
        
        // Move obstacles down
        setObstacles((prev) => {
          const moved = prev.map((o) => ({ ...o, y: o.y + speed }));
          return moved.filter((o) => o.y < 110);
        });
        
        // Move coins down
        setCoins((prev) => {
          const moved = prev.map((c) => ({ ...c, y: c.y + speed }));
          return moved.filter((c) => c.y < 110);
        });
        
        // Spawn obstacles
        if (Math.random() < 0.02 + speed * 0.002) {
          const lane = LANES[Math.floor(Math.random() * LANES.length)];
          setObstacles((prev) => [
            ...prev,
            {
              id: obstacleIdRef.current++,
              lane,
              y: -10,
              type: ["rock", "cone", "barrier"][Math.floor(Math.random() * 3)] as Obstacle["type"],
            },
          ]);
        }
        
        // Spawn coins
        if (Math.random() < 0.03) {
          const lane = LANES[Math.floor(Math.random() * LANES.length)];
          setCoins((prev) => [
            ...prev,
            { id: coinIdRef.current++, lane, y: -10 },
          ]);
        }
      }
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, setScore]);

  // Collision detection
  useEffect(() => {
    // Check obstacle collisions
    const playerY = 75;
    const hitObstacle = obstacles.find(
      (o) => o.lane === playerLane && Math.abs(o.y - playerY) < 8
    );
    
    if (hitObstacle) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      onGameOver(Math.floor(distance));
    }
    
    // Check coin collection
    const collectedCoin = coins.find(
      (c) => c.lane === playerLane && Math.abs(c.y - playerY) < 10
    );
    
    if (collectedCoin) {
      setCoins((prev) => prev.filter((c) => c.id !== collectedCoin.id));
      setScore((prev) => prev + 50);
    }
  }, [obstacles, coins, playerLane, distance, onGameOver, setScore]);

  return (
    <div
      ref={gameRef}
      className="relative w-full h-full bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleTap}
    >
      {/* Road markings */}
      <div className="absolute inset-0 flex">
        {LANES.map((lane) => (
          <div
            key={lane}
            className="flex-1 border-x border-dashed border-yellow-500/30"
          />
        ))}
      </div>
      
      {/* Moving road lines */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, white 40px, white 60px)",
          backgroundSize: "100% 100px",
          animation: `scroll ${1 / speed * 5}s linear infinite`,
        }}
      />
      
      {/* Obstacles */}
      {obstacles.map((obstacle) => (
        <div
          key={obstacle.id}
          className="absolute w-12 h-12 flex items-center justify-center transition-transform"
          style={{
            left: `${obstacle.lane * LANE_WIDTH + LANE_WIDTH / 2}%`,
            top: `${obstacle.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className={`w-10 h-10 rounded-lg ${
            obstacle.type === "rock" ? "bg-gray-500" :
            obstacle.type === "cone" ? "bg-orange-500" : "bg-red-500"
          } shadow-lg`} />
        </div>
      ))}
      
      {/* Coins */}
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="absolute w-8 h-8 flex items-center justify-center"
          style={{
            left: `${coin.lane * LANE_WIDTH + LANE_WIDTH / 2}%`,
            top: `${coin.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="w-6 h-6 rounded-full bg-yellow-400 shadow-lg animate-coin-spin border-2 border-yellow-300" />
        </div>
      ))}
      
      {/* Player */}
      <div
        className="absolute w-16 h-20 transition-all duration-150 ease-out"
        style={{
          left: `${playerLane * LANE_WIDTH + LANE_WIDTH / 2}%`,
          bottom: "15%",
          transform: "translateX(-50%)",
        }}
      >
        <img
          src="/images/mascot.png"
          alt="Perk"
          className="w-full h-full object-contain drop-shadow-lg"
        />
      </div>
      
      {/* Speed indicator */}
      <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-sm font-mono">
        {Math.floor(speed * 10)} km/h
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/50">
        Swipe or tap lanes to move
      </div>
      
      <style jsx>{`
        @keyframes scroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 100px; }
        }
      `}</style>
    </div>
  );
}
