"use client";

import React from "react"

import { useEffect, useRef, useState, useCallback } from "react";

interface PerkSnakeProps {
  onGameOver: (score: number) => void;
  setScore: (score: number | ((prev: number) => number)) => void;
}

interface Position {
  x: number;
  y: number;
}

type Direction = "up" | "down" | "left" | "right";

const GRID_SIZE = 20;
const CELL_COUNT = 15;

export function PerkSnake({ onGameOver, setScore }: PerkSnakeProps) {
  const [snake, setSnake] = useState<Position[]>([{ x: 7, y: 7 }]);
  const [food, setFood] = useState<Position>({ x: 10, y: 10 });
  const [direction, setDirection] = useState<Direction>("right");
  const [speed, setSpeed] = useState(150);
  const [isPaused, setIsPaused] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const directionRef = useRef<Direction>("right");
  const lastDirectionRef = useRef<Direction>("right");
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const spawnFood = useCallback((currentSnake: Position[]) => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * CELL_COUNT),
        y: Math.floor(Math.random() * CELL_COUNT),
      };
    } while (currentSnake.some((s) => s.x === newFood.x && s.y === newFood.y));
    return newFood;
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const currentDir = lastDirectionRef.current;
      
      if ((key === "ArrowUp" || key === "w") && currentDir !== "down") {
        directionRef.current = "up";
      } else if ((key === "ArrowDown" || key === "s") && currentDir !== "up") {
        directionRef.current = "down";
      } else if ((key === "ArrowLeft" || key === "a") && currentDir !== "right") {
        directionRef.current = "left";
      } else if ((key === "ArrowRight" || key === "d") && currentDir !== "left") {
        directionRef.current = "right";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle touch input
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const currentDir = lastDirectionRef.current;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 30 && currentDir !== "left") {
        directionRef.current = "right";
      } else if (dx < -30 && currentDir !== "right") {
        directionRef.current = "left";
      }
    } else {
      // Vertical swipe
      if (dy > 30 && currentDir !== "up") {
        directionRef.current = "down";
      } else if (dy < -30 && currentDir !== "down") {
        directionRef.current = "up";
      }
    }
    
    touchStartRef.current = null;
  }, []);

  // Game loop
  useEffect(() => {
    if (isPaused) return;

    const gameLoop = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        const currentDirection = directionRef.current;
        lastDirectionRef.current = currentDirection;
        setDirection(currentDirection);

        // Move head
        switch (currentDirection) {
          case "up":
            head.y -= 1;
            break;
          case "down":
            head.y += 1;
            break;
          case "left":
            head.x -= 1;
            break;
          case "right":
            head.x += 1;
            break;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= CELL_COUNT || head.y < 0 || head.y >= CELL_COUNT) {
          clearInterval(gameLoop);
          onGameOver((prevSnake.length - 1) * 100);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some((s) => s.x === head.x && s.y === head.y)) {
          clearInterval(gameLoop);
          onGameOver((prevSnake.length - 1) * 100);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          // Ate food - don't remove tail
          setFood(spawnFood(newSnake));
          setScore((prev) => prev + 100);
          
          // Increase speed every 5 food eaten
          if (newSnake.length % 5 === 0) {
            setSpeed((prev) => Math.max(50, prev - 10));
          }
          
          return newSnake;
        }

        // Remove tail
        newSnake.pop();
        return newSnake;
      });
    }, speed);

    return () => clearInterval(gameLoop);
  }, [speed, food, isPaused, spawnFood, onGameOver, setScore]);

  return (
    <div
      ref={gameRef}
      className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden select-none flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Game grid */}
      <div
        className="relative bg-slate-800 rounded-lg"
        style={{
          width: CELL_COUNT * GRID_SIZE,
          height: CELL_COUNT * GRID_SIZE,
        }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(CELL_COUNT)].map((_, i) => (
            <div key={`h-${i}`}>
              <div
                className="absolute w-full h-px bg-white"
                style={{ top: i * GRID_SIZE }}
              />
              <div
                className="absolute h-full w-px bg-white"
                style={{ left: i * GRID_SIZE }}
              />
            </div>
          ))}
        </div>

        {/* Food */}
        <div
          className="absolute w-4 h-4 bg-red-500 rounded-full shadow-lg shadow-red-500/50 animate-pulse"
          style={{
            left: food.x * GRID_SIZE + (GRID_SIZE - 16) / 2,
            top: food.y * GRID_SIZE + (GRID_SIZE - 16) / 2,
          }}
        />

        {/* Snake */}
        {snake.map((segment, index) => (
          <div
            key={index}
            className={`absolute rounded-sm transition-all duration-75 ${
              index === 0
                ? "bg-gradient-to-br from-teal-400 to-green-500 z-10"
                : "bg-gradient-to-br from-teal-500 to-green-600"
            }`}
            style={{
              left: segment.x * GRID_SIZE + 1,
              top: segment.y * GRID_SIZE + 1,
              width: GRID_SIZE - 2,
              height: GRID_SIZE - 2,
              opacity: 1 - index * 0.02,
            }}
          >
            {/* Eyes on head */}
            {index === 0 && (
              <>
                <div
                  className="absolute w-2 h-2 bg-white rounded-full"
                  style={{
                    top: 3,
                    left: direction === "left" ? 2 : direction === "right" ? 10 : 3,
                  }}
                >
                  <div className="absolute w-1 h-1 bg-black rounded-full top-0.5 left-0.5" />
                </div>
                <div
                  className="absolute w-2 h-2 bg-white rounded-full"
                  style={{
                    top: 3,
                    left: direction === "left" ? 2 : direction === "right" ? 10 : 10,
                  }}
                >
                  <div className="absolute w-1 h-1 bg-black rounded-full top-0.5 left-0.5" />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full">
        <span className="text-lg font-bold">{snake.length - 1}</span>
        <span className="text-sm ml-1 text-white/70">length</span>
      </div>

      <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-sm">
        Speed: {Math.round((200 - speed) / 15)}
      </div>

      {/* Direction buttons for mobile */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <button
          className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center active:bg-white/20"
          onTouchStart={() => {
            if (lastDirectionRef.current !== "down") directionRef.current = "up";
          }}
        >
          <span className="text-white/70">^</span>
        </button>
        <div className="flex gap-1">
          <button
            className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center active:bg-white/20"
            onTouchStart={() => {
              if (lastDirectionRef.current !== "right") directionRef.current = "left";
            }}
          >
            <span className="text-white/70">{"<"}</span>
          </button>
          <button
            className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center active:bg-white/20"
            onTouchStart={() => {
              if (lastDirectionRef.current !== "up") directionRef.current = "down";
            }}
          >
            <span className="text-white/70">v</span>
          </button>
          <button
            className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center active:bg-white/20"
            onTouchStart={() => {
              if (lastDirectionRef.current !== "left") directionRef.current = "right";
            }}
          >
            <span className="text-white/70">{">"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
