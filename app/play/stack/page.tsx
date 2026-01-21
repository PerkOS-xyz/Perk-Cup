"use client";

import { GameWrapper } from "@/components/game/game-wrapper";
import { PerkStack } from "@/components/game/games/perk-stack";

export default function StackPage() {
  return (
    <GameWrapper slug="stack">
      {({ onGameOver, setScore }) => (
        <PerkStack onGameOver={onGameOver} setScore={setScore} />
      )}
    </GameWrapper>
  );
}
