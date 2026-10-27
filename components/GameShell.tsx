"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Character,
  composeCharacter,
  defaultCharacter,
} from "@/game/character";
import { gameBus, Dialogue, TourState, Preferences } from "@/game/bus";
import { places, placeById } from "@/game/catalog";
import { makePlan, resumePoint, TOUR_SAVE_KEY } from "@/game/tour";
const tourPlan = makePlan(places);
const savedStop = () => {
  try {
    return resumePoint(
      JSON.parse(localStorage.getItem(TOUR_SAVE_KEY) || "null"),
      tourPlan,
    );
  } catch {
    return null;
  }
};
import world from "@/game/tour-world.json";
import Modal from "./Modal";
import AvatarPreview from "./AvatarPreview";
import TourJournal from "./TourJournal";
const defaults: Preferences = {
  speed: 1,
  zoom: 1,
  time: "day",
  footsteps: true,
  reduced: false,
};
/** One-line ribbon copy for each tour stage. */
function tourLine(t: TourState) {
  const short = placeById(t.target).short;
  switch (t.stage) {
    case "waiting":
      return "Follow Jalal, please";
    case "arrived":
      return `Here we are · ${short} — step inside`;
    case "room-intro":
      return `Welcome to ${short}`;
    case "to-beat":
      return `Highlight ${t.beat + 1}/${t.beats} — follow Jalal`;
    case "beat":
      return `Highlight ${t.beat + 1}/${t.beats}`;
    case "room-free":
      return "Look around, then head out the door";
    default:
      return `Follow me → ${short}`;
  }
}
/** Stop bar (21 stops) plus highlight beads while inside the stop's room. */
function TourProgress({ tour }: { tour: TourState }) {
  const inRoom = ["room-intro", "to-beat", "beat", "room-free"].includes(
    tour.stage,
  );
  const done = Math.min(tour.beat, tour.beats);
  const part = inRoom && tour.beats ? done / tour.beats : 0;
  const pct = Math.round(((tour.index + part) / Math.max(1, tour.total)) * 100);
  const label =
    `Stop ${tour.index + 1} of ${tour.total}` +
    (inRoom && tour.beats ? `, ${done} of ${tour.beats} highlights seen` : "");
  return (
    <span className="tour-progress" role="img" aria-label={label}>
      <span className="tour-bar">
        <i style={{ width: `${pct}%` }} />
      </span>
      {inRoom && tour.beats > 0 && (
        <span className="tour-beads">
          {Array.from({ length: tour.beats }, (_, k) => (
            <i
              key={k}
              className={
                k < done
                  ? "is-done"
                  : k === tour.beat && tour.stage !== "room-intro"
                    ? "is-now"
                    : ""
              }
            />
          ))}
        </span>
      )}
    </span>
  );
}
export default function GameShell({
  character,
  onCustomize,
}: {
  character: Character;
  onCustomize: () => void;
}) {
  const typing = useRef<ReturnType<typeof setInterval> | null>(null);
  const host = useRef<HTMLDivElement>(null),
    controlsDock = useRef<HTMLDivElement>(null),
    offered = useRef(false),
    ready = useRef(false),
    prefsRef = useRef(defaults),
    dialogueRef = useRef<Dialogue | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [room, setRoom] = useState<string | null>(null),
    [near, setNear] = useState<{
      label: string;
      kind: string;
      id?: string;
    } | null>(null);
  const [dialogue, setDialogue] = useState<Dialogue | null>(null),
    [text, setText] = useState(""),
    [map, setMap] = useState(false),
    [selected, setSelected] = useState(places[0].id),
    [settings, setSettings] = useState(false),
    [help, setHelp] = useState(false);
  const [hint, setHint] = useState("");
  const [mapTab, setMapTab] = useState<"map" | "journal">("map");
  const [visited, setVisited] = useState<string[]>([]),
    [inspected, setInspected] = useState<Record<string, string[]>>({}),
    [travel, setTravel] = useState<{ label: string; building?: string } | null>(
      null,
    );
  const [pos, setPos] = useState<{
      x: number;
      y: number;
      width: number;
      height: number;
      guideX?: number;
      guideY?: number;
      guideVisible: boolean;
      sitting: boolean;
      cameraX: number;
      cameraY: number;
      zoom: number;
      viewportHeight: number;
    }>({
      x: 320,
      y: 464,
      width: world.width,
      height: world.height,
      guideVisible: true,
      sitting: false,
      cameraX: 0,
      cameraY: 0,
      zoom: 1.8,
      viewportHeight: 0,
    }),
    [tour, setTour] = useState<TourState | null>(null),
    [prefs, setPrefs] = useState<Preferences>(defaults),
    [name, setName] = useState("Visitor"),
    [accent, setAccent] = useState("sage");
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement)?.matches("input,select,textarea") ||
        dialogueRef.current
      )
        return;
      if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        setMap((m) => !m);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const busy = !!(dialogue || map || settings || help);
  useEffect(() => {
    const dock = controlsDock.current;
    const measure = () =>
      gameBus.emit(
        "controls-area",
        room && dock ? Math.ceil(dock.getBoundingClientRect().height) : 0,
      );
    const observer = new ResizeObserver(measure);
    if (dock) observer.observe(dock);
    measure();
    return () => observer.disconnect();
  }, [room]);
  const totalObjects = places.reduce((n, p) => n + p.exhibits.length, 0),
    seenObjects = Object.values(inspected).reduce((n, x) => n + x.length, 0);
  dialogueRef.current = dialogue;
  useEffect(() => {
    gameBus.emit("pause", busy);
  }, [busy]);
  useEffect(() => {
    prefsRef.current = prefs;
    if (ready.current) {
      gameBus.emit("preferences", prefs);
      try {
        localStorage.setItem("jalal-town-settings", JSON.stringify(prefs));
      } catch {}
    }
  }, [prefs]);
  useEffect(() => {
    let disposed = false;
    let game: { destroy: (remove: boolean) => void } | undefined;
    let welcomeTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      const stored = JSON.parse(
        localStorage.getItem("jalal-town-settings") || "null",
      );
      if (stored) {
        const p = {
          ...defaults,
          ...stored,
          speed: [0.8, 1, 1.2].includes(stored.speed) ? stored.speed : 1,
          zoom: [0.85, 1, 1.15].includes(stored.zoom) ? stored.zoom : 1,
        };
        prefsRef.current = p;
        setPrefs(p);
      } else {
        const p = {
          ...defaults,
          reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        };
        prefsRef.current = p;
        setPrefs(p);
      }
      setVisited(
        JSON.parse(
          localStorage.getItem("jalal-town-visited-v3") || "[]",
        ).filter((s: string) => places.some((p) => p.id === s)),
      );
      setInspected(
        JSON.parse(localStorage.getItem("jalal-town-objects-v3") || "{}"),
      );
      setName(localStorage.getItem("jalal-town-name") || "Visitor");
      setAccent(localStorage.getItem("jalal-town-accent") || "sage");
    } catch {}
    const off = [
      gameBus.on("ready", () => {
        ready.current = true;
        setLoading(false);
        gameBus.emit("preferences", prefsRef.current);
        if (!offered.current) {
          offered.current = true;
          let seen = false;
          try {
            seen = localStorage.getItem("jalal-town-welcome-v3") === "yes";
          } catch {}
          const resume = seen ? savedStop() : null;
          if (resume !== null)
            welcomeTimer = setTimeout(() => {
              if (disposed) return;
              const p = placeById(tourPlan[resume.index].id);
              const beats = tourPlan[resume.index].beats.length;
              setDialogue({
                speaker: "Jalal",
                portrait: "happy",
                title: "Welcome back",
                text: `Good to see you again! Last time we got as far as stop ${resume.index + 1} of ${tourPlan.length}: ${p.name}${resume.beat > 0 && resume.beat < beats ? ` (highlight ${resume.beat + 1} of ${beats})` : ""}. Shall we pick up where we left off?`,
                choices: [
                  {
                    id: `tour-resume-${resume.index}:${resume.beat}`,
                    label: `Resume at ${p.short} →`,
                  },
                  { id: "tour-start", label: "Start from the beginning" },
                  { id: "close", label: "Explore freely" },
                ],
              });
            }, 600);
          else if (!seen)
            welcomeTimer = setTimeout(() => {
              if (disposed) return;
              setDialogue({
                speaker: "Jalal",
                portrait: "happy",
                title: "Welcome to my town",
                text: "Hey, I’m Jalal! I’d love to show you around: my background first, then the research, data and software projects, and finally the post office. I’ll walk with you and wait if you fall behind. You can leave the tour or restart it anytime.",
                choices: [
                  { id: "tour-start", label: "Take Jalal’s guided tour" },
                  { id: "tour-leave", label: "Explore freely" },
                ],
              });
              try {
                localStorage.setItem("jalal-town-welcome-v3", "yes");
              } catch {}
            }, 600);
        }
      }),
      gameBus.on("error", (v) => {
        setError(v);
        setLoading(false);
      }),
      gameBus.on("near", setNear),
      gameBus.on("dialogue", setDialogue),
      gameBus.on("hint", setHint),
      gameBus.on("transition", setTravel),
      gameBus.on("tour", (t) => {
        setTour(t);
        if (t.stage === "complete")
          try {
            localStorage.setItem("jalal-town-tour-complete", "yes");
          } catch {}
      }),
      gameBus.on("position", (p) =>
        setPos({
          ...p,
          guideVisible: p.guideVisible ?? true,
          sitting: p.sitting ?? false,
          cameraX: p.cameraX ?? 0,
          cameraY: p.cameraY ?? 0,
          zoom: p.zoom ?? 1.8,
          viewportHeight: p.viewportHeight ?? 0,
        }),
      ),
      gameBus.on("location", (p) => {
        setRoom(p.room);
        setNear(null);
        if (p.room) {
          setSelected(p.room);
          setVisited((v) => {
            const next = v.includes(p.room!) ? v : [...v, p.room!];
            try {
              localStorage.setItem(
                "jalal-town-visited-v3",
                JSON.stringify(next),
              );
            } catch {}
            return next;
          });
        }
      }),
      gameBus.on("inspected", (p) =>
        setInspected((v) => {
          const next = {
            ...v,
            [p.place]: Array.from(new Set([...(v[p.place] ?? []), p.station])),
          };
          try {
            localStorage.setItem("jalal-town-objects-v3", JSON.stringify(next));
          } catch {}
          return next;
        }),
      ),
    ];
    Promise.all([
      composeCharacter(character),
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
              ["visitor", "npc0", "npc1"][i],
              s.toDataURL(),
            ]),
          ),
          prefsRef.current.reduced,
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
      ready.current = false;
      clearTimeout(welcomeTimer);
      off.forEach((f) => f());
      game?.destroy(true);
    };
  }, [character]);
  useEffect(() => {
    if (!dialogue) {
      setText("");
      return;
    }
    if (prefs.reduced) {
      setText(dialogue.text);
      return;
    }
    setText("");
    const started = performance.now();
    let n = 0;
    const id = setInterval(() => {
      n = Math.floor((performance.now() - started) / 10);
      setText(dialogue.text.slice(0, n));
      if (n >= dialogue.text.length) clearInterval(id);
    }, 16);
    typing.current = id;
    return () => clearInterval(id);
  }, [dialogue, prefs.reduced]);
  const send = (
    type:
      | "interact"
      | "wave"
      | "sit"
      | "exit"
      | "tour-start"
      | "tour-next"
      | "tour-leave"
      | "tour-rejoin",
    id?: string,
  ) => gameBus.emit("action", { type, id });
  const choose = (id: string) => {
    setDialogue(null);
    if (id !== "close") gameBus.emit("action", { type: "choice", id });
  };
  const walk = () => {
    setMap(false);
    setTimeout(
      () => gameBus.emit("action", { type: "navigate", id: selected }),
      80,
    );
  };
  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    setPrefs((p) => ({ ...p, [key]: value }));
  const current = room ? placeById(room) : null,
    chosen = placeById(selected);
  const leftTour = () => {
    setDialogue(null);
    send("tour-leave");
  };
  return (
    <main
      className={`game-shell village-game ${loading ? "is-loading" : "is-ready"} accent-${accent} ${prefs.reduced ? "reduce-motion" : ""}`}
      data-room={room ?? "town"}
      data-x={pos.x.toFixed(1)}
      data-y={pos.y.toFixed(1)}
      data-guide-visible={pos.guideVisible}
      data-guide-x={pos.guideX?.toFixed(1)}
      data-guide-y={pos.guideY?.toFixed(1)}
      data-tour-beat={tour?.beatId ?? ""}
      data-tour-index={tour?.index ?? 0}
      data-tour-beat-index={tour?.beat ?? 0}
      data-camera-x={pos.cameraX}
      data-camera-y={pos.cameraY}
      data-camera-height={pos.viewportHeight}
      data-zoom={pos.zoom}
      data-sitting={pos.sitting}
      data-tour-stage={tour?.stage ?? "free"}
    >
      <div
        ref={host}
        className="game-canvas"
        aria-label="Career Town. Use WASD or arrow keys to walk; E to interact."
      />
      {room && (
        <div
          ref={controlsDock}
          className="room-controls-dock"
          aria-hidden="true"
        />
      )}
      {loading && (
        <div className="village-loading" role="status">
          <img src="/assets/tour/jalal-portrait.png" alt="Jalal" />
          <small>PREPARING THE VILLAGE</small>
          <h2>Every door has a story.</h2>
          <p>Loading your character, project houses and walking paths…</p>
        </div>
      )}
      {error && (
        <div className="village-loading" role="alert">
          <h2>The gates need a moment.</h2>
          <p>{error}</p>
          <Link href="/portfolio/" className="v-button">
            Open the classic portfolio
          </Link>
          <button className="v-button" onClick={onCustomize}>
            Try again
          </button>
        </div>
      )}
      {!loading && !error && (
        <>
          <div className="village-hud">
            <button
              className="location-card v-panel"
              onClick={() => {
                setSelected(room ?? tour?.target ?? places[0].id);
                setMap(true);
              }}
              aria-label={`Open map and building details for ${current?.name ?? "Career Town"}`}
            >
              <small>{current?.district ?? "JALAL’S CAREER TOWN"}</small>
              <strong>{current?.short ?? "A little world of work"}</strong>
              <span>
                {visited.length}/{places.length} places ·{" "}
                {current
                  ? `${inspected[current.id]?.length ?? 0}/${current.exhibits.length} objects`
                  : seenObjects + "/" + totalObjects + " discoveries"}
              </span>
            </button>
            <div className="village-tools">
              <button
                className="v-button"
                onClick={() => setMap(true)}
                aria-label="Open town map"
              >
                Map <span> M</span>
              </button>
              <button
                className="v-button"
                onClick={() => setHelp(true)}
                aria-label="Help and controls"
              >
                ?
              </button>
              <button
                className="v-button"
                onClick={() => setSettings(true)}
                aria-label="Town settings"
              >
                ⚙
              </button>
            </div>
          </div>
          <p className="sr-only" aria-live="polite">
            {hint}
          </p>
          <div className="tour-ribbon v-panel" aria-live="polite">
            <img src="/assets/tour/jalal-happy.png" alt="" />
            <div>
              <small>
                {tour?.active
                  ? `JALAL’S TOUR · ${tour.index + 1}/${tour.total}`
                  : tour?.stage === "complete"
                    ? "TOUR COMPLETE"
                    : "YOUR OWN PACE"}
              </small>
              <strong>
                {tour?.active ? tourLine(tour) : `Welcome, ${name}`}
              </strong>
              {tour?.active && <TourProgress tour={tour} />}
            </div>
            {tour?.active ? (
              <div className="tour-actions">
                {tour.stage === "arrived" && room === null && (
                  <button
                    className="v-button tour-enter"
                    onClick={() =>
                      gameBus.emit("action", {
                        type: "choice",
                        id: "enter-stop",
                      })
                    }
                  >
                    Enter →
                  </button>
                )}
                {["arrived", "room-intro", "beat", "room-free"].includes(
                  tour.stage,
                ) ? (
                  <button
                    className={
                      tour.stage === "arrived" ? "v-quiet" : "v-button"
                    }
                    onClick={() => send("tour-next", String(tour.index))}
                  >
                    {tour.index === tour.total - 1
                      ? "Finish tour"
                      : tour.stage === "arrived"
                        ? "Skip stop"
                        : "Next stop →"}
                  </button>
                ) : (
                  <button
                    className="v-button"
                    onClick={() => send("tour-rejoin")}
                  >
                    Follow Jalal
                  </button>
                )}
                <button className="v-quiet" onClick={leftTour}>
                  Leave tour
                </button>
              </div>
            ) : tour?.stage === "free" && (tour.index > 0 || tour.beat > 0) ? (
              <div className="tour-actions">
                <button
                  className="v-button"
                  onClick={() =>
                    send("tour-start", `${tour.index}:${tour.beat}`)
                  }
                >
                  Resume tour · {tour.index + 1}/{tour.total}
                </button>
                <button className="v-quiet" onClick={() => send("tour-start")}>
                  Start over
                </button>
              </div>
            ) : (
              <button className="v-button" onClick={() => send("tour-start")}>
                {tour?.stage === "complete" ? "Tour again" : "Take a tour"}
              </button>
            )}
          </div>
          {!busy && !travel && (
            <>
              {near && (
                <div className="village-prompt">
                  <button
                    className="v-button"
                    onClick={() =>
                      gameBus.emit("action", {
                        type: "interact",
                        id: near.id,
                        kind: near.kind,
                      })
                    }
                  >
                    <kbd>E</kbd>
                    {near.label}
                    <span>→</span>
                  </button>
                </div>
              )}
              <div className="village-footer">
                <span className="desktop-walk v-panel">
                  <kbd>WASD</kbd> Walk · <kbd>Shift</kbd> Run · <kbd>E</kbd>{" "}
                  Inspect · Right-click a neighbor
                </span>
                <div className="village-emotes">
                  <button className="v-button" onClick={() => send("wave")}>
                    Wave <kbd>F</kbd>
                  </button>
                  <button
                    className="v-button"
                    aria-pressed={pos.sitting}
                    onClick={() => send("sit")}
                  >
                    {pos.sitting ? "Stand" : "Sit"} <kbd>Q</kbd>
                  </button>
                  {room && (
                    <button className="v-button" onClick={() => send("exit")}>
                      Outside ↵
                    </button>
                  )}
                </div>
              </div>
              <div className="village-dpad" aria-label="Touch movement">
                {[
                  { label: "Walk up", x: 0, y: -1, icon: "↑" },
                  { label: "Walk left", x: -1, y: 0, icon: "←" },
                  { label: "Walk down", x: 0, y: 1, icon: "↓" },
                  { label: "Walk right", x: 1, y: 0, icon: "→" },
                ].map((d) => (
                  <button
                    className="v-button"
                    key={d.label}
                    aria-label={d.label}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      gameBus.emit("action", {
                        type: "direction",
                        x: d.x,
                        y: d.y,
                      });
                    }}
                    onPointerUp={() =>
                      gameBus.emit("action", { type: "direction", x: 0, y: 0 })
                    }
                    onPointerCancel={() =>
                      gameBus.emit("action", { type: "direction", x: 0, y: 0 })
                    }
                    onLostPointerCapture={() =>
                      gameBus.emit("action", { type: "direction", x: 0, y: 0 })
                    }
                  >
                    {d.icon}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
      {travel && (
        <div className="village-travel" role="status">
          <img
            src={
              travel.building
                ? `/assets/tour/house-${travel.building}.png`
                : "/assets/tour/jalal-happy.png"
            }
            alt=""
          />
          <small>THE NEXT CHAPTER</small>
          <h2>{travel.label}</h2>
        </div>
      )}
      {dialogue && (
        <Modal
          title={dialogue.title ?? `A conversation with ${dialogue.speaker}`}
          className="village-dialogue"
          onClose={() => setDialogue(null)}
        >
          <div className="village-dialogue-layout">
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
                aria-label={dialogue.text}
              >
                <p aria-hidden="true">{text}</p>
              </div>
              <div className="village-choices">
                {text !== dialogue.text ? (
                  <button
                    className="v-button"
                    onClick={() => {
                      if (typing.current) clearInterval(typing.current);
                      setText(dialogue.text);
                    }}
                  >
                    Show full message ↓
                  </button>
                ) : (
                  <>
                    {dialogue.choices?.map((c) => (
                      <button
                        key={c.id}
                        className="v-button"
                        onClick={() => choose(c.id)}
                      >
                        {c.label}
                      </button>
                    ))}
                    {dialogue.link && (
                      <a
                        className="v-button"
                        href={dialogue.link}
                        target={
                          dialogue.link.startsWith("http")
                            ? "_blank"
                            : undefined
                        }
                        rel="noreferrer"
                      >
                        {dialogue.linkLabel ?? "Open source"} ↗
                      </a>
                    )}
                    {!dialogue.choices && (
                      <button
                        className="v-button"
                        onClick={() => setDialogue(null)}
                      >
                        Continue →
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
      {map && (
        <Modal
          title="THE TOWN ATLAS / EVERY DOOR, ITS OWN STORY"
          className="village-map-modal"
          onClose={() => setMap(false)}
        >
          <div
            className="atlas-tabs"
            role="tablist"
            aria-label="Town atlas sections"
          >
            {(["map", "journal"] as const).map((tab) => (
              <button
                key={tab}
                id={`atlas-tab-${tab}`}
                role="tab"
                aria-selected={mapTab === tab}
                aria-controls={`atlas-panel-${tab}`}
                tabIndex={mapTab === tab ? 0 : -1}
                className="v-button"
                onClick={() => setMapTab(tab)}
                onKeyDown={(e) => {
                  if (
                    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                  )
                    return;
                  e.preventDefault();
                  const next =
                    e.key === "Home"
                      ? "map"
                      : e.key === "End"
                        ? "journal"
                        : mapTab === "map"
                          ? "journal"
                          : "map";
                  setMapTab(next);
                  document.getElementById(`atlas-tab-${next}`)?.focus();
                }}
              >
                {tab === "map" ? "Town map" : "Tour journal"}
              </button>
            ))}
          </div>
          {mapTab === "journal" ? (
            <div
              role="tabpanel"
              id="atlas-panel-journal"
              aria-labelledby="atlas-tab-journal"
            >
              <TourJournal
                tour={tour}
                visited={visited}
                inspected={inspected}
                checkpoint={savedStop()}
                onMap={(id) => {
                  setSelected(id);
                  setMapTab("map");
                }}
                onResume={() => {
                  const point = savedStop();
                  setMap(false);
                  setTimeout(
                    () =>
                      tour?.active
                        ? send("tour-rejoin")
                        : send(
                            "tour-start",
                            point ? `${point.index}:${point.beat}` : undefined,
                          ),
                    80,
                  );
                }}
              />
            </div>
          ) : (
            <div
              role="tabpanel"
              id="atlas-panel-map"
              aria-labelledby="atlas-tab-map"
              className="village-atlas"
            >
              <div className="village-map-art">
                <img
                  src="/assets/tour/map.png"
                  alt="Map of the village, showing 21 project and background buildings connected by paths"
                />
                {world.buildings.map((b, i) => (
                  <button
                    key={b.id}
                    className={`map-pin ${selected === b.id ? "selected" : ""} ${visited.includes(b.id) ? "visited" : ""}`}
                    style={{
                      left: `${(b.doorX / world.width) * 100}%`,
                      top: `${(b.doorY / world.height) * 100}%`,
                    }}
                    onClick={() => setSelected(b.id)}
                    aria-label={`Select ${placeById(b.id).name}`}
                    aria-pressed={selected === b.id}
                  >
                    {i + 1}
                  </button>
                ))}
                {!room && (
                  <span
                    className="atlas-you"
                    style={{
                      left: `${(pos.x / world.width) * 100}%`,
                      top: `${(pos.y / world.height) * 100}%`,
                    }}
                    title="You are here"
                  >
                    ●
                  </span>
                )}
              </div>
              <div className="village-map-detail">
                <label>
                  Choose a building
                  <select
                    aria-label="Choose a building"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    {places.map((p, i) => (
                      <option value={p.id} key={p.id}>
                        {i + 1}. {p.short}
                      </option>
                    ))}
                  </select>
                </label>
                <img src={`/assets/tour/house-${selected}.png`} alt="" />
                <small>{chosen.district}</small>
                <h2>{chosen.name}</h2>
                <p>{chosen.summary}</p>
                <span>
                  {chosen.width} × {chosen.height} interior ·{" "}
                  {chosen.exhibits.length} inspectable objects
                </span>
                <ul>
                  {chosen.exhibits.map((e) => (
                    <li key={e.id}>
                      {inspected[chosen.id]?.includes(e.id) ? "✓" : "◇"}{" "}
                      {e.title}
                    </li>
                  ))}
                </ul>
                <button className="v-button" onClick={walk}>
                  {tour?.active ? "Leave tour & walk here" : "Walk here →"}
                </button>
                <small>
                  {visited.includes(selected) ? "Visited" : "Not visited yet"} ·
                  Walking only, no teleporting.
                </small>
              </div>
            </div>
          )}
        </Modal>
      )}
      {settings && (
        <Modal
          title="MAKE YOURSELF AT HOME"
          className="village-settings"
          onClose={() => setSettings(false)}
        >
          <div className="v-settings-grid">
            <h2>Your town, your pace.</h2>
            <label>
              Visitor name
              <input
                maxLength={24}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  try {
                    localStorage.setItem("jalal-town-name", e.target.value);
                  } catch {}
                }}
              />
            </label>
            <label>
              Walking pace
              <select
                value={prefs.speed}
                onChange={(e) => update("speed", Number(e.target.value))}
              >
                <option value={0.8}>Leisurely</option>
                <option value={1}>Balanced</option>
                <option value={1.2}>Brisk</option>
              </select>
            </label>
            <label>
              Camera distance
              <select
                value={prefs.zoom}
                onChange={(e) => update("zoom", Number(e.target.value))}
              >
                <option value={0.85}>Wide view</option>
                <option value={1}>Balanced</option>
                <option value={1.15}>Close-up</option>
              </select>
            </label>
            <label>
              Village light
              <select
                value={prefs.time}
                onChange={(e) =>
                  update("time", e.target.value as Preferences["time"])
                }
              >
                <option value="day">Warm daylight</option>
                <option value="evening">Evening blue</option>
              </select>
            </label>
            <label>
              Interface palette
              <select
                value={accent}
                onChange={(e) => {
                  setAccent(e.target.value);
                  try {
                    localStorage.setItem("jalal-town-accent", e.target.value);
                  } catch {}
                }}
              >
                <option value="sage">Sage & parchment</option>
                <option value="clay">Terracotta</option>
                <option value="blue">Midnight blue</option>
              </select>
            </label>
            <label className="v-check">
              <input
                type="checkbox"
                checked={prefs.reduced}
                onChange={(e) => update("reduced", e.target.checked)}
              />{" "}
              Reduced decorative motion
            </label>
            <label className="v-check">
              <input
                type="checkbox"
                checked={prefs.footsteps}
                onChange={(e) => update("footsteps", e.target.checked)}
              />{" "}
              Footstep dust
            </label>
            <button className="v-button" onClick={onCustomize}>
              Change visitor appearance →
            </button>
            <p>
              Appearance changes restart the current walk. Your discoveries and
              settings stay saved in this browser.
            </p>
          </div>
        </Modal>
      )}
      {help && (
        <Modal
          title="A LITTLE FIELD GUIDE"
          className="village-settings"
          onClose={() => setHelp(false)}
        >
          <h2>No rush. Every corner counts.</h2>
          <ul className="v-help-list">
            <li>
              <b>Walk:</b> WASD / arrows, click a path, or hold the touch
              arrows. Shift runs.
            </li>
            <li>
              <b>Inspect:</b> approach a glowing furniture marker and press E,
              or click the object to walk over and read.
            </li>
            <li>
              <b>Meet people:</b> E near a neighbor, or right-click them when
              nearby. Choose a greeting or a prepared question.
            </li>
            <li>
              <b>Take the tour:</b> Jalal leads in order and waits when you fall
              behind. Stay near him, explore each stop, then choose Next stop.
            </li>
            <li>
              <b>Your own route:</b> Leave tour at any time. Start again from
              the tour ribbon. Selecting Walk here on the map leaves the tour.
            </li>
            <li>
              <b>Rest:</b> Q or Sit holds a stable sitting pose. Near a chair,
              it seats you there. Move or choose Stand to get up.
            </li>
            <li>
              <b>Panels:</b> Escape or the visible × closes dialogue, map and
              settings. Outside exits an interior.
            </li>
            <li>
              <b>Customize:</b> change appearance in the studio, or pace, light,
              camera and palette in settings.
            </li>
          </ul>
          <button
            className="v-button"
            onClick={() => {
              setHelp(false);
              setTimeout(() => send("tour-start"), 80);
            }}
          >
            Start Jalal’s tour
          </button>
        </Modal>
      )}
    </main>
  );
}
