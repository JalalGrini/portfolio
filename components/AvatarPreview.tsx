"use client";
import { useEffect, useRef, useState } from "react";
import { Character, composeCharacter } from "@/game/character";
export default function AvatarPreview({
  character,
  animated = true,
  direction = 2,
  focus,
}: {
  character: Character;
  animated?: boolean;
  direction?: number;
  focus?: "full" | "head" | "torso" | "legs" | "feet";
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let dead = false,
      raf = 0;
    setError(false);
    composeCharacter(character, false, !!focus)
      .then((sheet) => {
        if (dead) return;
        const ctx = canvas.current?.getContext("2d");
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;
        const draw = (t: number) => {
          const frame = animated ? Math.floor(t / 130) % 9 : 0;
          ctx.clearRect(0, 0, 64, 64);
          const crop =
            focus === "head"
              ? [16, 4, 32, 34]
              : focus === "torso"
                ? [16, 25, 32, 32]
                : focus === "legs"
                  ? [16, 35, 32, 29]
                  : focus === "feet"
                    ? [16, 43, 32, 21]
                    : [0, 0, 64, 64];
          ctx.drawImage(
            sheet,
            (focus ? 0 : frame * 64) + crop[0],
            (focus ? 0 : direction * 64) + crop[1],
            crop[2],
            crop[3],
            0,
            0,
            64,
            64,
          );
          if (animated && !focus) raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
      })
      .catch(() => {
        if (!dead) setError(true);
      });
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
    };
  }, [character, animated, direction, focus]);
  return error ? (
    <p role="status">Preview unavailable. Try a different outfit.</p>
  ) : (
    <canvas
      ref={canvas}
      width={64}
      height={64}
      className="avatar-canvas"
      aria-label="Preview of your custom pixel character"
      role="img"
    />
  );
}
