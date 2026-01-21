"use client";

import React from "react"

import { useEffect, useRef, useState, useCallback } from "react";

interface PerkPongProps {
  onGameOver: (score: number) => void;
  setScore: (score: number | ((prev: number) => number)) => void;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isActive: boolean;
}

interface Cup {
  id: number;
  x: number;
  y: number;
  isHit: boolean;
  points: number;
}

export function PerkPong({ onGameOver, setScore }: PerkPongProps) {
  const [ball, setBall] = useState<Ball | null>(null);
  const [cups, setCups] = useState<Cup[]>([]);
  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(50);
  const [isAiming, setIsAiming] = useState(true);
  const [ballsLeft, setBallsLeft] = useState(10);
  const [totalScore, setTotalScore] = useState(0);
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize cups in triangle formation (like beer pong)
  useEffect(() => {
    const newCups: Cup[] = [];
    const rows = 4;
    let cupId = 0;
    
    for (let row = 0; row < rows; row++) {
      const cupsInRow = row + 1;
      const startX = 50 - (cupsInRow - 1) * 8;
      
      for (let i = 0; i < cupsInRow; i++) {
        newCups.push({
          id: cupId++,
          x: startX + i * 16,
          y: 15 + row * 12,
          isHit: false,
          points: (rows - row) * 50, // Higher cups = more points
        });
      }
    }
    
    setCups(newCups);
  }, []);

  const throwBall = useCallback(() => {
    if (!isAiming || ballsLeft <= 0) return;
    
    setIsAiming(false);
    setBallsLeft((prev) => prev - 1);
    
    // Calculate initial velocity based on angle and power
    const radians = (aimAngle * Math.PI) / 180;
    const velocityMultiplier = power / 50;
    
    setBall({
      x: 50,
      y: 90,
      vx: Math.sin(radians) * 3 * velocityMultiplier,
      vy: -4 * velocityMultiplier,
      isActive: true,
    });
  }, [isAiming, ballsLeft, aimAngle, power]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!gameRef.current) return;
    const rect = gameRef.current.getBoundingClientRect();
    touchStartRef.current = {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !gameRef.current || !isAiming) return;
    
    const rect = gameRef.current.getBoundingClientRect();
    const currentX = e.touches[0].clientX - rect.left;
    const currentY = e.touches[0].clientY - rect.top;
    
    // Calculate angle based on drag
    const dx = currentX - touchStartRef.current.x;
    const dy = touchStartRef.current.y - currentY;
    
    const angle = Math.atan2(dx, dy) * (180 / Math.PI);
    setAimAngle(Math.max(-45, Math.min(45, angle)));
    
    // Calculate power based on drag distance
    const distance = Math.sqrt(dx * dx + dy * dy);
    setPower(Math.min(100, Math.max(20, distance / 2)));
  }, [isAiming]);

  const handleTouchEnd = useCallback(() => {
    if (touchStartRef.current && isAiming) {
      throwBall();
    }
    touchStartRef.current = null;
  }, [isAiming, throwBall]);

  // Ball physics
  useEffect(() => {
    if (!ball || !ball.isActive) return;

    const animate = () => {
      setBall((prev) => {
        if (!prev || !prev.isActive) return prev;

        let newX = prev.x + prev.vx;
        let newY = prev.y + prev.vy;
        let newVx = prev.vx;
        let newVy = prev.vy + 0.15; // Gravity

        // Bounce off walls
        if (newX < 5 || newX > 95) {
          newVx = -newVx * 0.8;
          newX = newX < 5 ? 5 : 95;
        }

        // Check cup collisions
        let hitCup = false;
        cups.forEach((cup) => {
          if (cup.isHit) return;
          
          const dx = newX - cup.x;
          const dy = newY - cup.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 8) {
            // Ball landed in cup!
            setCups((prevCups) =>
              prevCups.map((c) =>
                c.id === cup.id ? { ...c, isHit: true } : c
              )
            );
            setTotalScore((prevScore) => {
              const newScore = prevScore + cup.points;
              setScore(newScore);
              return newScore;
            });
            hitCup = true;
          }
        });

        // Ball fell off bottom or hit cup
        if (newY > 100 || hitCup) {
          // Check if game should continue
          setTimeout(() => {
            const remainingCups = cups.filter((c) => !c.isHit).length;
            
            if (remainingCups === 0 || ballsLeft <= 0) {
              // Game over
              onGameOver(totalScore + (hitCup ? cups.find((c) => !c.isHit)?.points || 0 : 0));
            } else {
              setIsAiming(true);
              setBall(null);
            }
          }, 300);
          
          return { ...prev, isActive: false };
        }

        return { ...prev, x: newX, y: newY, vx: newVx, vy: newVy };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [ball, cups, ballsLeft, totalScore, onGameOver, setScore]);

  // Check win/lose condition after cup state changes
  useEffect(() => {
    const remainingCups = cups.filter((c) => !c.isHit).length;
    if (cups.length > 0 && remainingCups === 0) {
      // Won! All cups hit
      const bonusScore = ballsLeft * 100;
      onGameOver(totalScore + bonusScore);
    } else if (ballsLeft === 0 && !ball?.isActive && isAiming) {
      // Lost - no balls left
      onGameOver(totalScore);
    }
  }, [cups, ballsLeft, ball, isAiming, totalScore, onGameOver]);

  return (
    <div
      ref={gameRef}
      className="relative w-full h-full bg-gradient-to-b from-amber-900 to-amber-950 rounded-xl overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => isAiming && throwBall()}
    >
      {/* Table surface */}
      <div className="absolute inset-x-4 top-4 bottom-20 bg-amber-800/50 rounded-xl border-4 border-amber-700" />
      
      {/* Cups */}
      {cups.map((cup) => (
        <div
          key={cup.id}
          className={`absolute w-12 h-12 transition-all duration-300 ${
            cup.isHit ? "scale-0 opacity-0" : "scale-100"
          }`}
          style={{
            left: `${cup.x}%`,
            top: `${cup.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Cup shape */}
          <div className="relative w-full h-full">
            <div className="absolute bottom-0 w-full h-10 bg-gradient-to-b from-red-500 to-red-700 rounded-b-lg" />
            <div className="absolute top-0 w-full h-4 bg-red-400 rounded-t-sm" style={{
              clipPath: "ellipse(50% 100% at 50% 0%)"
            }} />
            {/* Beer */}
            <div className="absolute top-2 left-1 right-1 h-3 bg-yellow-400/80 rounded-full" />
          </div>
          {/* Points label */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold text-yellow-400">
            {cup.points}
          </div>
        </div>
      ))}
      
      {/* Ball */}
      {ball && (
        <div
          className="absolute w-6 h-6 bg-white rounded-full shadow-lg"
          style={{
            left: `${ball.x}%`,
            top: `${ball.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
      
      {/* Aiming indicator */}
      {isAiming && !ball && (
        <div
          className="absolute bottom-16 left-1/2 origin-bottom"
          style={{
            transform: `translateX(-50%) rotate(${aimAngle}deg)`,
            height: `${power}px`,
          }}
        >
          <div className="w-1 h-full bg-gradient-to-t from-yellow-500 to-transparent rounded-full" />
          <div className="absolute -top-2 -left-1.5 w-4 h-4 bg-yellow-500 rounded-full" />
        </div>
      )}
      
      {/* Launch zone */}
      {isAiming && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-8 h-8 bg-white rounded-full shadow-lg animate-pulse" />
        </div>
      )}

      {/* Stats */}
      <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full">
        <span className="text-lg font-bold">{ballsLeft}</span>
        <span className="text-sm ml-1 text-white/70">balls</span>
      </div>
      
      <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full">
        <span className="text-sm text-white/70">Cups:</span>
        <span className="text-lg font-bold ml-1">
          {cups.filter((c) => c.isHit).length}/{cups.length}
        </span>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/50 text-center">
        {isAiming ? "Drag to aim, release to throw" : "Watch the ball..."}
      </div>
    </div>
  );
}
