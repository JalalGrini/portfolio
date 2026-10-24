"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Character,
  composeCharacter,
  jalalCharacter,
  defaultCharacter,
} from "@/game/character";
import { gameBus } from "@/game/bus";
import { buildings, BuildingId, Project } from "@/content/portfolio";
import Modal from "./Modal";
import AvatarPreview from "./AvatarPreview";
import { BuildingContent, ProjectDetail } from "./PortfolioContent";
export default function GameShell({
  character,
  onCustomize,
}: {
  character: Character;
  onCustomize: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [near, setNear] = useState<{ label: string; kind: string } | null>(
    null,
  );
  const [location, setLocation] = useState("Founders’ Square");
  const [room, setRoom] = useState<BuildingId | null>(null);
  const [panel, setPanel] = useState<BuildingId | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [dialogue, setDialogue] = useState<{
    speaker: string;
    text: string;
  } | null>(null);
  const [text, setText] = useState("");
  const [map, setMap] = useState(false);
  const [help, setHelp] = useState(false);
  const [settings, setSettings] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visited, setVisited] = useState<BuildingId[]>([]);
  const [pos, setPos] = useState({ x: 50, y: 75 });
  const [notice, setNotice] = useState(
    "Welcome. Walk north to meet Jalal by the fountain.",
  );
  const busy = !!(panel || project || dialogue || map || help || settings);
  useEffect(() => {
    gameBus.emit("pause", busy);
  }, [busy]);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("career-town-discoveries") || "[]",
      );
      if (Array.isArray(saved))
        setVisited(saved.filter((v) => buildings.some((b) => b.id === v)));
    } catch {}
    const r = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(r);
    let disposed = false;
    let game: { destroy: (removeCanvas: boolean) => void } | undefined;
    const off = [
      gameBus.on("ready", () => setLoading(false)),
      gameBus.on("error", (v) => {
        setError(v);
        setLoading(false);
      }),
      gameBus.on("near", setNear),
      gameBus.on("open", setPanel),
      gameBus.on("dialogue", setDialogue),
      gameBus.on("position", (p) =>
        setPos({ x: (p.x / p.width) * 100, y: (p.y / p.height) * 100 }),
      ),
      gameBus.on("location", (p) => {
        setLocation(p.name);
        setRoom(p.room);
        setNear(null);
        setNotice(
          p.room
            ? `Discovered ${p.name}. Find the field notes inside.`
            : "Founders’ Square · Every path leads somewhere.",
        );
        if (p.room)
          setVisited((v) => {
            const next = v.includes(p.room!) ? v : [...v, p.room!];
            try {
              localStorage.setItem(
                "career-town-discoveries",
                JSON.stringify(next),
              );
            } catch {}
            return next;
          });
      }),
    ];
    Promise.all([
      composeCharacter(character),
      composeCharacter(jalalCharacter),
      composeCharacter({
        ...defaultCharacter,
        body: "female",
        skin: "bronze",
        hair: "bob",
        hairColor: "chestnut",
        top: "cardigan",
        topColor: "maroon",
        legs: "formal",
        legsColor: "navy",
      }),
      composeCharacter({
        ...defaultCharacter,
        skin: "brown",
        hair: "flat_top_fade",
        topColor: "tan",
        glasses: "round",
      }),
    ])
      .then(async (sheets) => {
        const { createGame } = await import("@/game/createGame");
        if (disposed) return;
        game = createGame(
          host.current!,
          Object.fromEntries(
            sheets.map((s, i) => [
              ["visitor", "jalal", "npc0", "npc1"][i],
              s.toDataURL(),
            ]),
          ),
          r,
        );
      })
      .catch((e) => {
        if (!disposed) {
          setError(e instanceof Error ? e.message : "The town could not load.");
          setLoading(false);
        }
      });
    return () => {
      disposed = true;
      off.forEach((f) => f());
      game?.destroy(true);
    };
  }, [character]);
  useEffect(() => {
    if (!dialogue) return;
    setText("");
    if (reduced) {
      setText(dialogue.text);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setText(dialogue.text.slice(0, i));
      if (i >= dialogue.text.length) clearInterval(id);
    }, 17);
    typingTimer.current = id;
    return () => clearInterval(id);
  }, [dialogue, reduced]);
  useEffect(() => {
    const t = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(t);
  }, [notice]);
  const act = (type: "interact" | "wave" | "sit" | "exit") =>
    gameBus.emit("action", { type });
  return (
    <main
      className="game-shell"
      data-x={pos.x.toFixed(2)}
      data-y={pos.y.toFixed(2)}
    >
      <div ref={host} className="game-canvas" />
      {loading && (
        <div className="game-loading" role="status">
          <img src="/assets/game/house-lab.png" alt="" />
          <span className="eyebrow">OPENING THE TOWN GATES</span>
          <h2>A world worth a little curiosity.</h2>
          <p>Preparing your character and the paths ahead…</p>
          <div className="loading-track">
            <span />
          </div>
        </div>
      )}
      {error && (
        <div className="game-loading" role="alert">
          <h2>The town needs a moment.</h2>
          <p>{error}</p>
          <Link className="button primary" href="/portfolio/">
            Open the full portfolio →
          </Link>
          <button className="button" onClick={onCustomize}>
            Try another character
          </button>
        </div>
      )}
      {!loading && !error && (
        <>
          <div className="game-hud-top">
            <div className="location-card">
              <span className="eyebrow">
                {room ? "INSIDE THE TOWN" : "JALAL GRINI’S CAREER TOWN"}
              </span>
              <h1>{location}</h1>
              <span className="discovery-count">
                {visited.length} / 7 places discovered
              </span>
            </div>
            <div className="hud-actions">
              <button
                className="hud-button"
                onClick={() => setMap(true)}
                aria-label="Open town map and discovery journal"
              >
                Map <span>+</span>
              </button>
              <button
                className="hud-button"
                onClick={() => setHelp(true)}
                aria-label="Open controls and help"
              >
                ?
              </button>
              <button
                className="hud-button"
                onClick={() => setSettings(true)}
                aria-label="Open town settings"
              >
                ⚙
              </button>
            </div>
          </div>
          {notice && (
            <p className="game-notice" role="status">
              {notice}
            </p>
          )}
          <div className="game-hud-bottom">
            <div className="game-controls-hint">
              <span>
                <kbd>W A S D</kbd> Walk
              </span>
              <span>
                <kbd>⇧</kbd> Run
              </span>
              <span>
                <kbd>E</kbd> Interact
              </span>
              <span>Click a path to walk</span>
            </div>
            <div className="emote-actions">
              <button className="hud-button" onClick={() => act("wave")}>
                Wave <kbd>F</kbd>
              </button>
              <button className="hud-button" onClick={() => act("sit")}>
                Sit <kbd>Q</kbd>
              </button>
              {room && (
                <button className="hud-button" onClick={() => act("exit")}>
                  Back outside ↵
                </button>
              )}
            </div>
          </div>
          <div className="interaction-slot">
            {near && (
              <button
                className="interact-button"
                onClick={() => act("interact")}
              >
                <kbd>E</kbd> {near.label} <span>→</span>
              </button>
            )}
            {room && !near && (
              <button
                className="interact-button"
                onClick={() => setPanel(room)}
              >
                Open field notes ↗
              </button>
            )}
          </div>
          {!room && (
            <button
              className="minimap"
              aria-label="Open town map"
              onClick={() => setMap(true)}
            >
              <img src="/assets/game/town-preview.png" alt="" />
              <span style={{ left: `${pos.x}%`, top: `${pos.y}%` }} />
              <span className="minimap-caption">THE TOWN +</span>
            </button>
          )}
          <div className="touch-pad" aria-label="Touch movement controls">
            {[
              { dir: "up", x: 0, y: -1, label: "↑" },
              { dir: "left", x: -1, y: 0, label: "←" },
              { dir: "down", x: 0, y: 1, label: "↓" },
              { dir: "right", x: 1, y: 0, label: "→" },
            ].map((d) => (
              <button
                key={d.dir}
                className={`touch-${d.dir}`}
                aria-label={`Walk ${d.dir}`}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  gameBus.emit("action", { type: "direction", x: d.x, y: d.y });
                }}
                onPointerUp={() =>
                  gameBus.emit("action", { type: "direction", x: 0, y: 0 })
                }
                onPointerCancel={() =>
                  gameBus.emit("action", { type: "direction", x: 0, y: 0 })
                }
              >
                {d.label}
              </button>
            ))}
          </div>
        </>
      )}
      {panel && (
        <Modal
          title="CAREER TOWN / FIELD NOTES"
          onClose={() => {
            setPanel(null);
            setProject(null);
          }}
        >
          {project ? (
            <>
              <button className="text-button" onClick={() => setProject(null)}>
                ← Back to {buildings.find((b) => b.id === panel)!.topic}
              </button>
              <ProjectDetail project={project} />
            </>
          ) : (
            <BuildingContent id={panel} onProject={setProject} />
          )}
        </Modal>
      )}
      {dialogue && (
        <Modal
          title={`CONVERSATION / ${dialogue.speaker.toUpperCase()}`}
          className="dialogue-modal"
          onClose={() => setDialogue(null)}
        >
          <div className="dialogue-layout">
            <div className="dialogue-portrait">
              <AvatarPreview
                character={
                  dialogue.speaker === "Jalal"
                    ? jalalCharacter
                    : {
                        ...defaultCharacter,
                        body: "female",
                        skin: "bronze",
                        hair: "bob",
                        hairColor: "chestnut",
                      }
                }
                animated={false}
              />
            </div>
            <div>
              <h2>{dialogue.speaker}</h2>
              <p aria-live="off">{text}</p>
              <button
                className="button primary"
                onClick={() => {
                  if (text !== dialogue.text) {
                    if (typingTimer.current) clearInterval(typingTimer.current);
                    setText(dialogue.text);
                  } else setDialogue(null);
                }}
              >
                {text === dialogue.text
                  ? "Keep exploring →"
                  : "Show full message"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {map && (
        <Modal
          title="TOWN MAP / DISCOVERY JOURNAL"
          onClose={() => setMap(false)}
          className="map-modal"
        >
          <h2>Follow your curiosity.</h2>
          <p>
            Seven places. One journey. Walk to a door to discover a place, or
            read any field notes directly.
          </p>
          <div className="map-layout">
            <div className="large-map">
              <img
                src="/assets/game/town-preview.png"
                alt="Town overview: academy and observatory to the north, office to the northeast, home and workshop around the central plaza, post office and library to the south"
              />
              {!room && (
                <span
                  className="map-you"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  title="You are here"
                />
              )}
            </div>
            <div className="journal-list">
              {buildings.map((b) => (
                <div key={b.id}>
                  <span
                    className={`journal-number ${visited.includes(b.id) ? "found" : ""}`}
                  >
                    {visited.includes(b.id) ? "✓" : b.number}
                  </span>
                  <div>
                    <h3>{b.topic}</h3>
                    <p>{b.name}</p>
                    <div>
                      <button
                        className="text-button"
                        onClick={() => {
                          setMap(false);
                          gameBus.emit("pause", false);
                          gameBus.emit("action", {
                            type: "navigate",
                            id: b.id,
                          });
                        }}
                      >
                        Walk here →
                      </button>
                      <button
                        className="text-button"
                        onClick={() => {
                          setMap(false);
                          setPanel(b.id);
                        }}
                      >
                        Read ↗
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
      {help && (
        <Modal
          title="A FEW THINGS BEFORE YOU WANDER"
          onClose={() => setHelp(false)}
        >
          <h2>Make yourself at home.</h2>
          <div className="help-grid">
            <article>
              <h3>Move</h3>
              <p>
                WASD or arrow keys. Hold Shift to run. Click a path for
                automatic walking. On touch screens, use the direction pad.
              </p>
            </article>
            <article>
              <h3>Discover</h3>
              <p>
                Approach a door and press E—or tap the prompt—to enter. Read the
                field notes at the central desk. Talk to Jalal by the fountain.
              </p>
            </article>
            <article>
              <h3>Take a moment</h3>
              <p>
                F to wave. Q to sit or stand. Open the map to choose your next
                stop. Escape closes dialogs; inside a room, Escape goes outside.
              </p>
            </article>
            <article>
              <h3>Your visit</h3>
              <p>
                Appearance and discoveries stay only in this browser. There’s no
                sound, no timer and no wrong order. Every project is also in the
                classic portfolio.
              </p>
            </article>
          </div>
          <Link className="button" href="/portfolio/">
            Classic portfolio →
          </Link>
        </Modal>
      )}
      {settings && (
        <Modal title="YOUR VISIT / SETTINGS" onClose={() => setSettings(false)}>
          <h2>A comfortable pace.</h2>
          <label className="setting-row">
            <span>
              <b>Reduced motion</b>
              <small>
                Disable atmospheric effects, villager movement and smooth camera
                follow.
              </small>
            </span>
            <input
              type="checkbox"
              checked={reduced}
              onChange={(e) => {
                setReduced(e.target.checked);
                gameBus.emit("reduced", e.target.checked);
              }}
            />
          </label>
          <p className="muted">
            The town is always silent. Appearance and discoveries are stored
            only on this device.
          </p>
          <div className="button-row">
            <button
              className="button"
              onClick={() => {
                setSettings(false);
                onCustomize();
              }}
            >
              Customize character
            </button>
            <button
              className="button"
              onClick={() => {
                setVisited([]);
                localStorage.removeItem("career-town-discoveries");
              }}
            >
              Reset discoveries
            </button>
            <Link className="button primary" href="/portfolio/">
              Classic portfolio ↗
            </Link>
            <Link className="button" href="/credits/">
              Art credits ↗
            </Link>
          </div>
        </Modal>
      )}
    </main>
  );
}
