"use client";

import { GameWrapper } from "@/components/game/game-wrapper";
import { PerkSnake } from "@/components/game/games/perk-snake";

export default function SnakePage() {
  return (
    <GameWrapper slug="snake">
      {({ onGameOver, setScore }) => (
        <PerkSnake onGameOver={onGameOver} setScore={setScore} />
      )}
    </GameWrapper>
  );
}
