"use client";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import CharacterCreator from "@/components/CharacterCreator";
import GameShell from "@/components/GameShell";
import type { Character } from "@/game/character";
export default function Play() {
  const [c, setC] = useState<Character | null>(null);
  const reduced = useReducedMotion();
  return (
    <div className={`town-root ${c ? "town-playing play-page" : ""}`}>
      <header className="town-nav">
        <Link href="/play/" className="town-brand" aria-label="Career Town">
          <img src="/assets/game/house-about.png" alt="" />
          <span>
            Career Town<small>A SMALL WORLD BY JALAL GRINI</small>
          </span>
        </Link>
        <Link href="/portfolio/" className="town-back">
          ← <span>Back to portfolio</span>
        </Link>
      </header>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          className="town-experience"
          key={c ? "game" : "creator"}
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : -12 }}
          transition={{
            duration: reduced ? 0 : 0.28,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        >
          {c ? (
            <GameShell character={c} onCustomize={() => setC(null)} />
          ) : (
            <CharacterCreator onStart={setC} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
