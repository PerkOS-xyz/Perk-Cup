"use client";

import { GameWrapper } from "@/components/game/game-wrapper";
import { PerkMatch } from "@/components/game/games/perk-match";

export default function MatchPage() {
  return (
    <GameWrapper slug="match">
      {({ onGameOver, setScore }) => (
        <PerkMatch onGameOver={onGameOver} setScore={setScore} />
      )}
    </GameWrapper>
  );
}
