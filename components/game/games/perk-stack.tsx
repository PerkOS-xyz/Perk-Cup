"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface PerkStackProps {
  onGameOver: (score: number) => void;
  setScore: (score: number | ((prev: number) => number)) => void;
}

interface Block {
  id: number;
  x: number;
  width: number;
  color: string;
}

const COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
];

export function PerkStack({ onGameOver, setScore }: PerkStackProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);
  const [direction, setDirection] = useState(1);
  const [speed, setSpeed] = useState(2);
  const [isDropping, setIsDropping] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const blockIdRef = useRef(0);

  // Initialize with base block
  useEffect(() => {
    const baseBlock: Block = {
      id: blockIdRef.current++,
      x: 50,
      width: 40,
      color: COLORS[0],
    };
    setBlocks([baseBlock]);
    spawnNewBlock(baseBlock.width);
  }, []);

  const spawnNewBlock = useCallback((width: number) => {
    const newBlock: Block = {
      id: blockIdRef.current++,
      x: 0,
      width,
      color: COLORS[blockIdRef.current % COLORS.length],
    };
    setCurrentBlock(newBlock);
    setDirection(1);
    setIsDropping(false);
  }, []);

  const dropBlock = useCallback(() => {
    if (isDropping || !currentBlock) return;
    setIsDropping(true);

    const lastBlock = blocks[blocks.length - 1];
    if (!lastBlock) return;

    // Calculate overlap
    const currentLeft = currentBlock.x - currentBlock.width / 2;
    const currentRight = currentBlock.x + currentBlock.width / 2;
    const lastLeft = lastBlock.x - lastBlock.width / 2;
    const lastRight = lastBlock.x + lastBlock.width / 2;

    const overlapLeft = Math.max(currentLeft, lastLeft);
    const overlapRight = Math.min(currentRight, lastRight);
    const overlapWidth = overlapRight - overlapLeft;

    if (overlapWidth <= 0) {
      // Missed completely - game over
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      onGameOver(blocks.length * 100);
      return;
    }

    // Calculate new block position and width
    const newX = overlapLeft + overlapWidth / 2;
    const perfectBonus = Math.abs(currentBlock.x - lastBlock.x) < 2;

    const newBlock: Block = {
      ...currentBlock,
      x: newX,
      width: perfectBonus ? currentBlock.width : overlapWidth,
    };

    setBlocks((prev) => [...prev, newBlock]);
    
    // Update score
    const baseScore = 100;
    const perfectScore = perfectBonus ? 50 : 0;
    setScore((prev) => prev + baseScore + perfectScore);

    // Increase speed
    setSpeed((prev) => Math.min(prev + 0.1, 8));

    // Spawn new block
    setTimeout(() => {
      if (overlapWidth < 5) {
        // Block too small - game over
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        onGameOver((blocks.length + 1) * 100 + perfectScore);
      } else {
        spawnNewBlock(perfectBonus ? currentBlock.width : overlapWidth);
      }
    }, 200);
  }, [currentBlock, blocks, isDropping, onGameOver, setScore, spawnNewBlock]);

  // Handle tap/click
  useEffect(() => {
    const handleInput = () => dropBlock();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        dropBlock();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dropBlock]);

  // Animate current block
  useEffect(() => {
    if (!currentBlock || isDropping) return;

    const animate = () => {
      setCurrentBlock((prev) => {
        if (!prev) return null;
        
        let newX = prev.x + direction * speed;
        let newDirection = direction;
        
        if (newX + prev.width / 2 >= 100) {
          newX = 100 - prev.width / 2;
          newDirection = -1;
          setDirection(-1);
        } else if (newX - prev.width / 2 <= 0) {
          newX = prev.width / 2;
          newDirection = 1;
          setDirection(1);
        }
        
        return { ...prev, x: newX };
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [direction, speed, isDropping, currentBlock]);

  const visibleBlocks = blocks.slice(-10);
  const stackOffset = Math.max(0, blocks.length - 8) * 8;

  return (
    <div
      ref={gameRef}
      className="relative w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl overflow-hidden select-none"
      onClick={dropBlock}
      onTouchStart={dropBlock}
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }} />
      </div>

      {/* Stack container */}
      <div className="absolute bottom-0 left-0 right-0 h-full flex flex-col-reverse items-center justify-start pb-8">
        {/* Placed blocks */}
        {visibleBlocks.map((block, index) => (
          <div
            key={block.id}
            className={`h-6 rounded-sm ${block.color} shadow-lg transition-all duration-200`}
            style={{
              width: `${block.width}%`,
              marginLeft: `${(block.x - 50)}%`,
              opacity: 1 - (visibleBlocks.length - 1 - index) * 0.05,
            }}
          />
        ))}
      </div>

      {/* Current moving block */}
      {currentBlock && !isDropping && (
        <div
          className={`absolute h-6 rounded-sm ${currentBlock.color} shadow-lg`}
          style={{
            width: `${currentBlock.width}%`,
            left: `${currentBlock.x - currentBlock.width / 2}%`,
            bottom: `${32 + visibleBlocks.length * 24}px`,
          }}
        />
      )}

      {/* Score display */}
      <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full">
        <span className="text-2xl font-bold">{blocks.length}</span>
        <span className="text-sm ml-1 text-white/70">blocks</span>
      </div>

      {/* Perfect indicator */}
      <div className="absolute top-4 right-4 text-xs text-white/50">
        Speed: {speed.toFixed(1)}x
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/50">
        Tap to drop block
      </div>
    </div>
  );
}
