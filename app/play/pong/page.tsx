"use client";

import { GameWrapper } from "@/components/game/game-wrapper";
import { PerkPong } from "@/components/game/games/perk-pong";

export default function PongPage() {
  return (
    <GameWrapper slug="pong">
      {({ onGameOver, setScore }) => (
        <PerkPong onGameOver={onGameOver} setScore={setScore} />
      )}
    </GameWrapper>
  );
}
