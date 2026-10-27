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
  /** Index of the current highlight inside the room. */
  beat: number;
  beats: number;
  /** Exhibit id of the current highlight, if any. */
  beatId?: string;
  distance: number;
};

export type TourEvent =
  | { type: "start"; from?: number }
  | { type: "leave" }
  | { type: "visitor-far" }
  | { type: "visitor-near" }
  | { type: "arrive-door" }
  | { type: "enter-room"; id: string }
  | { type: "intro-done" }
  | { type: "reach-beat" }
  | { type: "beat-done" }
  | { type: "skip-room" }
  | { type: "exit-room" }
  | { type: "next" };

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
      return atStop(plan, s, from, "leading");
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
      return { ...s, stage: "room-intro", beat: 0, beatId: undefined };
    case "intro-done":
      if (s.stage !== "room-intro") return s;
      return s.beats > 0 ? withBeat(plan, s, 0) : { ...s, stage: "room-free" };
    case "reach-beat":
      return s.stage === "to-beat" ? { ...s, stage: "beat" } : s;
    case "beat-done":
      if (s.stage !== "beat") return s;
      return s.beat + 1 < s.beats
        ? withBeat(plan, s, s.beat + 1)
        : { ...s, stage: "room-free", beatId: undefined };
    case "skip-room":
      return ["room-intro", "to-beat", "beat"].includes(s.stage)
        ? { ...s, stage: "room-free", beatId: undefined }
        : s;
    case "exit-room":
      return inRoomStage(s.stage) ? advance(plan, s) : s;
    case "next":
      return advance(plan, s);
  }
  return s;
}

/** Persisted progress (versioned so old saves can be migrated or ignored). */
export type TourSave = { v: 2; index: number; complete: boolean };
export const TOUR_SAVE_KEY = "jalal-town-tour-v2";

export function toSave(s: TourState): TourSave {
  return { v: 2, index: s.index, complete: s.stage === "complete" };
}

/** Returns the stop to resume from, or null if nothing useful is saved. */
export function resumeIndex(raw: unknown, plan: TourStop[]): number | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<TourSave>;
  if (r.v !== 2 || typeof r.index !== "number" || r.complete) return null;
  if (!Number.isInteger(r.index) || r.index <= 0 || r.index >= plan.length)
    return null;
  return r.index;
}
