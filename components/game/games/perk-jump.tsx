"use client";

import React from "react"

import { useEffect, useRef, useCallback, useState } from "react";
import Image from "next/image";

interface PerkJumpProps {
  onGameOver: (score: number) => void;
  setScore: (score: number | ((prev: number) => number)) => void;
}

interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  type: "normal" | "moving" | "breaking";
  direction?: number;
}

export function PerkJump({ onGameOver, setScore }: PerkJumpProps) {
  const [playerX, setPlayerX] = useState(50);
  const [playerY, setPlayerY] = useState(70);
  const [velocityY, setVelocityY] = useState(0);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [cameraY, setCameraY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const platformIdRef = useRef(0);
  const lastTimeRef = useRef<number>(0);
  const highestYRef = useRef(0);

  // Initialize platforms
  useEffect(() => {
    const initialPlatforms: Platform[] = [];
    for (let i = 0; i < 10; i++) {
      initialPlatforms.push({
        id: platformIdRef.current++,
        x: Math.random() * 80 + 10,
        y: 90 - i * 15,
        width: 20,
        type: i < 3 ? "normal" : Math.random() < 0.2 ? "moving" : "normal",
        direction: Math.random() > 0.5 ? 1 : -1,
      });
    }
    setPlatforms(initialPlatforms);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!gameRef.current) return;
    const rect = gameRef.current.getBoundingClientRect();
    const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    setPlayerX(Math.max(5, Math.min(95, x)));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!gameRef.current) return;
    const rect = gameRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setPlayerX(Math.max(5, Math.min(95, x)));
  }, []);

  const handleTap = useCallback(() => {
    if (!isJumping) {
      setVelocityY(-12);
      setIsJumping(true);
    }
  }, [isJumping]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        setPlayerX((prev) => Math.max(5, prev - 5));
      } else if (e.key === "ArrowRight" || e.key === "d") {
        setPlayerX((prev) => Math.min(95, prev + 5));
      } else if (e.key === " " && !isJumping) {
        setVelocityY(-12);
        setIsJumping(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isJumping]);

  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 16;
      lastTimeRef.current = timestamp;

      // Apply gravity
      setVelocityY((prev) => Math.min(prev + 0.5 * delta, 15));

      // Update player position
      setPlayerY((prevY) => {
        const newY = prevY + velocityY * delta;

        // Check platform collisions when falling
        if (velocityY > 0) {
          for (const platform of platforms) {
            const platformScreenY = platform.y - cameraY;
            const playerBottom = newY + 5;
            const prevPlayerBottom = prevY + 5;

            if (
              playerX > platform.x - platform.width / 2 &&
              playerX < platform.x + platform.width / 2 &&
              playerBottom >= platformScreenY &&
              prevPlayerBottom < platformScreenY
            ) {
              // Landed on platform
              setVelocityY(-12);
              setIsJumping(true);
              
              // Breaking platform
              if (platform.type === "breaking") {
                setPlatforms((prev) => prev.filter((p) => p.id !== platform.id));
              }
              
              return platformScreenY - 5;
            }
          }
        }

        return newY;
      });

      // Move camera up if player goes above center
      setPlayerY((currentY) => {
        if (currentY < 40) {
          const diff = 40 - currentY;
          setCameraY((prev) => prev + diff);
          
          // Update score based on height
          const newHeight = cameraY + diff;
          if (newHeight > highestYRef.current) {
            highestYRef.current = newHeight;
            setScore(Math.floor(newHeight * 10));
          }
          
          return 40;
        }
        return currentY;
      });

      // Move moving platforms
      setPlatforms((prev) =>
        prev.map((p) => {
          if (p.type === "moving") {
            let newX = p.x + (p.direction || 1) * 0.5 * delta;
            let newDir = p.direction || 1;
            if (newX < 15 || newX > 85) {
              newDir = -newDir;
              newX = Math.max(15, Math.min(85, newX));
            }
            return { ...p, x: newX, direction: newDir };
          }
          return p;
        })
      );

      // Generate new platforms as we go up
      setPlatforms((prev) => {
        const highestPlatform = Math.min(...prev.map((p) => p.y));
        const newPlatforms = [...prev];
        
        while (highestPlatform > cameraY - 20) {
          const newY = highestPlatform - 15 - Math.random() * 10;
          newPlatforms.push({
            id: platformIdRef.current++,
            x: Math.random() * 70 + 15,
            y: newY,
            width: 15 + Math.random() * 10,
            type: Math.random() < 0.15 ? "moving" : Math.random() < 0.1 ? "breaking" : "normal",
            direction: Math.random() > 0.5 ? 1 : -1,
          });
          break;
        }
        
        // Remove platforms that are too far below
        return newPlatforms.filter((p) => p.y < cameraY + 120);
      });

      // Check for game over (fell too far)
      if (playerY > 110) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        onGameOver(Math.floor(highestYRef.current * 10));
        return;
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [velocityY, playerX, platforms, cameraY, onGameOver, setScore]);

  return (
    <div
      ref={gameRef}
      className="relative w-full h-full bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200 rounded-xl overflow-hidden select-none cursor-none"
      onTouchMove={handleTouchMove}
      onMouseMove={handleMouseMove}
      onClick={handleTap}
      onTouchStart={handleTap}
    >
      {/* Background clouds */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: `${40 + Math.random() * 40}px`,
              height: `${20 + Math.random() * 20}px`,
              left: `${Math.random() * 100}%`,
              top: `${(i * 20 + (cameraY * 0.1) % 100)}%`,
            }}
          />
        ))}
      </div>

      {/* Platforms */}
      {platforms.map((platform) => {
        const screenY = platform.y - cameraY;
        if (screenY < -10 || screenY > 110) return null;
        
        return (
          <div
            key={platform.id}
            className={`absolute h-3 rounded-full transition-colors ${
              platform.type === "normal"
                ? "bg-green-500 border-2 border-green-600"
                : platform.type === "moving"
                ? "bg-blue-500 border-2 border-blue-600"
                : "bg-orange-400 border-2 border-orange-500"
            }`}
            style={{
              left: `${platform.x}%`,
              top: `${screenY}%`,
              width: `${platform.width}%`,
              transform: "translateX(-50%)",
            }}
          />
        );
      })}

      {/* Player */}
      <div
        className="absolute w-12 h-12 transition-transform"
        style={{
          left: `${playerX}%`,
          top: `${playerY}%`,
          transform: `translateX(-50%) translateY(-50%) scaleY(${velocityY < 0 ? 1.1 : 0.9})`,
        }}
      >
        <Image
          src="/images/mascot.png"
          alt="Perk"
          fill
          className="object-contain drop-shadow-lg"
        />
      </div>

      {/* Height indicator */}
      <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full text-sm font-mono text-white">
        {Math.floor(cameraY)}m
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-black/50">
        Move to control, tap to boost jump
      </div>
    </div>
  );
}
