"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { dialoguePages } from "@/game/dialogue";
import { defaultCharacter } from "@/game/character";
import type { Dialogue } from "@/game/bus";
import AvatarPreview from "./AvatarPreview";
import Modal from "./Modal";
export default function GameDialogue({
  dialogue,
  instant,
  onChoice,
  onClose,
}: {
  dialogue: Dialogue;
  instant: boolean;
  onChoice: (id: string) => void;
  onClose: () => void;
}) {
  const pages = useMemo(() => dialoguePages(dialogue.text), [dialogue.text]);
  const [page, setPage] = useState(0),
    [text, setText] = useState(instant ? pages[0] : "");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null),
    root = useRef<HTMLDivElement>(null);
  const current = pages[page] ?? pages[0],
    full = instant || text === current,
    last = page === pages.length - 1;
  useEffect(() => {
    if (instant) {
      setText(current);
      return;
    }
    setText("");
    const start = performance.now();
    const id = setInterval(() => {
      const n = Math.floor((performance.now() - start) / 16);
      setText(current.slice(0, n));
      if (n >= current.length) clearInterval(id);
    }, 16);
    timer.current = id;
    return () => clearInterval(id);
  }, [current, instant]);
  const reveal = () => {
    if (timer.current) clearInterval(timer.current);
    setText(current);
  };
  const next = () => {
    if (!full) reveal();
    else if (!last) {
      if (timer.current) clearInterval(timer.current);
      setText("");
      setPage((p) => p + 1);
    }
  };
  return (
    <Modal
      title={dialogue.title ?? `A conversation with ${dialogue.speaker}`}
      className="village-dialogue"
      onClose={onClose}
    >
      <div
        className="village-dialogue-layout"
        ref={root}
        data-message-page={page + 1}
        data-message-pages={pages.length}
        onKeyDown={(e) => {
          if (["Enter", " "].includes(e.key) && e.repeat) {
            e.preventDefault();
            return;
          }
          if (
            ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
          ) {
            const choices = Array.from(
              root.current?.querySelectorAll<
                HTMLButtonElement | HTMLAnchorElement
              >(".village-choices button,.village-choices a") ?? [],
            );
            if (!choices.length) return;
            e.preventDefault();
            const i = choices.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            const d = ["ArrowUp", "ArrowLeft"].includes(e.key) ? -1 : 1;
            choices[
              i < 0 ? 0 : (i + d + choices.length) % choices.length
            ].focus();
          }
          if (
            ["Enter", " "].includes(e.key) &&
            (e.target as HTMLElement).classList.contains("village-spoken")
          ) {
            e.preventDefault();
            if (!full || !last) next();
            else
              root.current
                ?.querySelector<HTMLButtonElement>(".village-choices button")
                ?.focus();
          }
        }}
      >
        <figure>
          {dialogue.speaker === "Jalal" ? (
            <img
              src={`/assets/tour/jalal-${dialogue.portrait ?? "portrait"}.png`}
              alt="Jalal’s pixel-art portrait"
            />
          ) : (
            <AvatarPreview
              character={{
                ...defaultCharacter,
                ...(["Sami", "Lina", "Rayan"].includes(dialogue.speaker)
                  ? {
                      skin: "brown",
                      hair: "flat_top_fade",
                      topColor: "tan",
                      glasses: "round",
                    }
                  : {
                      body: "female" as const,
                      skin: "bronze",
                      hair: "bob",
                      hairColor: "chestnut",
                      top: "cardigan",
                      topColor: "maroon",
                      legs: "formal",
                      legsColor: "navy",
                    }),
              }}
              animated={false}
              focus="head"
            />
          )}
          <figcaption>{dialogue.speaker}</figcaption>
        </figure>
        <div className="village-dialogue-body">
          <div
            className="village-spoken"
            tabIndex={0}
            aria-label={current}
            onClick={() => {
              if (!full) reveal();
            }}
          >
            <p aria-hidden="true">
              {instant ? current : text}
              <span className="dialogue-cursor" aria-hidden="true">
                {full ? "" : "▌"}
              </span>
            </p>
          </div>
          <div className="dialogue-reading">
            <span>
              {pages.length > 1
                ? `Message ${page + 1} of ${pages.length}`
                : " "}
            </span>
            <span>
              {full ? "↑ ↓ Choose · Enter Confirm" : "Enter / tap to reveal"}
            </span>
          </div>
          <div className="village-choices">
            {!full ? (
              <button className="v-button" onClick={reveal} autoFocus>
                Show full message ↓
              </button>
            ) : !last ? (
              <button className="v-button" onClick={next} autoFocus>
                Continue reading →
              </button>
            ) : (
              <>
                {dialogue.choices?.map((c, i) => (
                  <button
                    key={c.id}
                    className="v-button"
                    autoFocus={i === 0}
                    onClick={() => onChoice(c.id)}
                  >
                    <span className="choice-arrow" aria-hidden="true">
                      ▸
                    </span>
                    {c.label}
                  </button>
                ))}
                {dialogue.link && (
                  <a
                    className="v-button"
                    href={dialogue.link}
                    target={
                      dialogue.link.startsWith("http") ? "_blank" : undefined
                    }
                    rel="noreferrer"
                  >
                    {dialogue.linkLabel ?? "Open source"} ↗
                  </a>
                )}
                {!dialogue.choices && (
                  <button className="v-button" onClick={onClose} autoFocus>
                    Continue →
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
