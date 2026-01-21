"use client";

import { GameWrapper } from "@/components/game/game-wrapper";
import { PerkRacer } from "@/components/game/games/perk-racer";

export default function RacerPage() {
  return (
    <GameWrapper slug="racer">
      {({ onGameOver, setScore }) => (
        <PerkRacer onGameOver={onGameOver} setScore={setScore} />
      )}
    </GameWrapper>
  );
}
