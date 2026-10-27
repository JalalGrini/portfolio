/**
 * Pure guided-tour state machine (no Phaser, no DOM).
 *
 * Lifecycle of one stop:
 *   leading ⇄ waiting → arrived (Jalal at the door)
 *   → room-intro (inside, Jalal introduces the room)
 *   → to-beat → beat → to-beat → beat … (Jalal walks to each highlight and explains it)
 *   → room-free (visitor looks around; Jalal waits by the exit)
 *   → exit-room → leading (next stop) … → complete
 *
 * Leaving the room *before* the highlights are finished does not advance:
 * the stop pauses at the door ("arrived") and remembers the current highlight,
 * so stepping back inside resumes exactly there. Only an explicit "next"
 * (Next stop / Skip this stop) or leaving from free look moves the tour on.
 *
 * Every event is a no-op (returns the *same* object) when it does not apply
 * to the current stage, so duplicate or late events are harmless.
 */
export type TourStage =
  | "free"
  | "leading"
  | "waiting"
  | "arrived"
  | "room-intro"
  | "to-beat"
  | "beat"
  | "room-free"
  | "complete";

export type TourStop = { id: string; beats: string[] };

export type TourState = {
  active: boolean;
  stage: TourStage;
  index: number;
  total: number;
  target: string;
  /** Index of the current highlight inside the room (= beats once all are done). */
  beat: number;
  beats: number;
  /** Exhibit id of the current highlight, if any. */
  beatId?: string;
  distance: number;
};

export type TourEvent =
  | { type: "start"; from?: number; beat?: number }
  | { type: "leave" }
  | { type: "visitor-far" }
  | { type: "visitor-near" }
  | { type: "arrive-door" }
  | { type: "enter-room"; id: string }
  | { type: "intro-done" }
  | { type: "reach-beat" }
  | { type: "beat-done" }
  | { type: "skip-room" }
  /** `id` (optional) must match the stop's building, else it is ignored. */
  | { type: "exit-room"; id?: string }
  /** `from` (optional) must match the current stop index — guards double-advance. */
  | { type: "next"; from?: number };

export const ROOM_STAGES: TourStage[] = [
  "room-intro",
  "to-beat",
  "beat",
  "room-free",
];
export const OUTDOOR_STAGES: TourStage[] = ["leading", "waiting", "arrived"];
export const inRoomStage = (s: TourStage) => ROOM_STAGES.includes(s);

/** Highlights per room: enough to tell the story without reading every exhibit. */
export const MAX_BEATS = 3;
export function makePlan(
  places: { id: string; exhibits: { id: string }[] }[],
): TourStop[] {
  return places.map((p) => ({
    id: p.id,
    beats: p.exhibits.slice(0, MAX_BEATS).map((e) => e.id),
  }));
}

export function initialTour(plan: TourStop[]): TourState {
  return {
    active: false,
    stage: "free",
    index: 0,
    total: plan.length,
    target: plan[0]?.id ?? "",
    beat: 0,
    beats: plan[0]?.beats.length ?? 0,
    beatId: undefined,
    distance: 0,
  };
}

function atStop(
  plan: TourStop[],
  s: TourState,
  index: number,
  stage: TourStage,
): TourState {
  const stop = plan[index];
  return {
    ...s,
    active: true,
    stage,
    index,
    total: plan.length,
    target: stop.id,
    beat: 0,
    beats: stop.beats.length,
    beatId: undefined,
  };
}

function withBeat(plan: TourStop[], s: TourState, beat: number): TourState {
  return {
    ...s,
    stage: "to-beat",
    beat,
    beatId: plan[s.index].beats[beat],
  };
}

function advance(plan: TourStop[], s: TourState): TourState {
  if (s.index >= plan.length - 1)
    return { ...s, active: false, stage: "complete", beatId: undefined };
  return atStop(plan, s, s.index + 1, "leading");
}

export function tourReduce(
  plan: TourStop[],
  s: TourState,
  e: TourEvent,
): TourState {
  if (!plan.length) return s;
  switch (e.type) {
    case "start": {
      const from = Math.max(0, Math.min(plan.length - 1, e.from ?? 0));
      const st = atStop(plan, s, from, "leading");
      const beat = Math.floor(e.beat ?? 0);
      if (!(beat > 0)) return st;
      if (beat < st.beats) return { ...st, beat };
      // That room was already finished: continue with the next stop.
      return from + 1 < plan.length ? atStop(plan, s, from + 1, "leading") : st;
    }
    case "leave":
      if (!s.active) return s;
      return { ...s, active: false, stage: "free", beatId: undefined };
  }
  if (!s.active) return s;
  switch (e.type) {
    case "visitor-far":
      return s.stage === "leading" ? { ...s, stage: "waiting" } : s;
    case "visitor-near":
      return s.stage === "waiting" ? { ...s, stage: "leading" } : s;
    case "arrive-door":
      return s.stage === "leading" || s.stage === "waiting"
        ? { ...s, stage: "arrived" }
        : s;
    case "enter-room":
      if (e.id !== s.target || !OUTDOOR_STAGES.includes(s.stage)) return s;
      // Keep `beat`: re-entering after an early exit resumes at that highlight.
      return { ...s, stage: "room-intro", beatId: undefined };
    case "intro-done":
      if (s.stage !== "room-intro") return s;
      return s.beat < s.beats
        ? withBeat(plan, s, s.beat)
        : { ...s, stage: "room-free", beat: s.beats };
    case "reach-beat":
      return s.stage === "to-beat" ? { ...s, stage: "beat" } : s;
    case "beat-done":
      if (s.stage !== "beat") return s;
      return s.beat + 1 < s.beats
        ? withBeat(plan, s, s.beat + 1)
        : { ...s, stage: "room-free", beat: s.beats, beatId: undefined };
    case "skip-room":
      return ["room-intro", "to-beat", "beat"].includes(s.stage)
        ? { ...s, stage: "room-free", beat: s.beats, beatId: undefined }
        : s;
    case "exit-room":
      if (e.id !== undefined && e.id !== s.target) return s;
      if (s.stage === "room-free") return advance(plan, s);
      // Left early: pause at the door, keep the highlight for re-entry.
      return inRoomStage(s.stage)
        ? { ...s, stage: "arrived", beatId: undefined }
        : s;
    case "next":
      if (e.from !== undefined && e.from !== s.index) return s;
      return advance(plan, s);
  }
  return s;
}

/** Persisted progress (versioned so old saves can be migrated or ignored). */
export type TourSave = { v: 3; index: number; beat: number; complete: boolean };
export const TOUR_SAVE_KEY = "jalal-town-tour-v2";

export function toSave(s: TourState): TourSave {
  return {
    v: 3,
    index: s.index,
    beat: s.beat,
    complete: s.stage === "complete",
  };
}

export type ResumePoint = { index: number; beat: number };

/**
 * Where to resume (stop + highlight), or null if nothing useful is saved.
 * Accepts v3 saves and migrates v2 (`{v:2,index}` → highlight 0).
 */
export function resumePoint(
  raw: unknown,
  plan: TourStop[],
): ResumePoint | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as {
    v?: unknown;
    index?: unknown;
    beat?: unknown;
    complete?: unknown;
  };
  if ((r.v !== 2 && r.v !== 3) || r.complete) return null;
  const index = r.index;
  if (typeof index !== "number" || !Number.isInteger(index)) return null;
  if (index < 0 || index >= plan.length) return null;
  let beat = r.v === 3 && typeof r.beat === "number" ? Math.floor(r.beat) : 0;
  if (!Number.isFinite(beat) || beat < 0) beat = 0;
  // A finished room means "start the next stop": resume at its beginning.
  if (beat >= plan[index].beats.length && beat > 0) {
    if (index + 1 >= plan.length) return null;
    return { index: index + 1, beat: 0 };
  }
  if (index === 0 && beat === 0) return null; // nothing gained yet
  return { index, beat };
}

/** Stop index to resume from (kept for older callers). */
export function resumeIndex(raw: unknown, plan: TourStop[]): number | null {
  return resumePoint(raw, plan)?.index ?? null;
}
