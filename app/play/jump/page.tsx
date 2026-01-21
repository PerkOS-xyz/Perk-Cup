"use client";

import { GameWrapper } from "@/components/game/game-wrapper";
import { PerkJump } from "@/components/game/games/perk-jump";

export default function JumpPage() {
  return (
    <GameWrapper slug="jump">
      {({ onGameOver, setScore }) => (
        <PerkJump onGameOver={onGameOver} setScore={setScore} />
      )}
    </GameWrapper>
  );
}
