"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import CharacterCreator from "@/components/CharacterCreator";
import GameShell from "@/components/GameShell";
import type { Character } from "@/game/character";
export default function Play() {
  const [c, setC] = useState<Character | null>(null);
  return (
    <div className={c ? "play-page" : ""}>
      <Nav game />
      {c ? (
        <GameShell character={c} onCustomize={() => setC(null)} />
      ) : (
        <CharacterCreator onStart={setC} />
      )}
    </div>
  );
}
