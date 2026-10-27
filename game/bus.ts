export type DialogueChoice = { id: string; label: string };
export type Dialogue = {
  speaker: string;
  text: string;
  portrait?: "portrait" | "happy" | "thinking";
  title?: string;
  choices?: DialogueChoice[];
  link?: string;
  linkLabel?: string;
  station?: string;
};
import type { TourState } from "./tour";
export type { TourState };
export type Preferences = {
  speed: number;
  zoom: number;
  time: "day" | "evening";
  footsteps: boolean;
  reduced: boolean;
  instantText: boolean;
};
export type GameEvents = {
  ready: undefined;
  error: string;
  transition: { label: string; building?: string } | null;
  near: { label: string; kind: string; id?: string } | null;
  location: { name: string; room: string | null };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    guideX?: number;
    guideY?: number;
    guideVisible?: boolean;
    sitting?: boolean;
    cameraX?: number;
    cameraY?: number;
    zoom?: number;
    viewportHeight?: number;
  };
  dialogue: Dialogue;
  /** Short non-blocking line from Jalal (speech bubble + screen-reader text). */
  hint: string;
  /** Measured room control dock, including the device's safe-area inset. */
  "controls-area": number;
  pause: boolean;
  reduced: boolean;
  instantText: boolean;
  preferences: Preferences;
  tour: TourState;
  inspected: { place: string; station: string };
  action: {
    type:
      | "interact"
      | "wave"
      | "sit"
      | "exit"
      | "navigate"
      | "direction"
      | "tour-start"
      | "tour-next"
      | "tour-leave"
      | "tour-rejoin"
      | "choice"
      | "inspect";
    id?: string;
    kind?: string;
    x?: number;
    y?: number;
  };
};
class Bus {
  private listeners = new Map<string, Set<(v: never) => void>>();
  on<K extends keyof GameEvents>(event: K, fn: (value: GameEvents[K]) => void) {
    const set = this.listeners.get(event) ?? new Set();
    set.add(fn as (v: never) => void);
    this.listeners.set(event, set);
    return () => {
      set.delete(fn as (v: never) => void);
    };
  }
  emit<K extends keyof GameEvents>(event: K, value: GameEvents[K]) {
    this.listeners.get(event)?.forEach((fn) => fn(value as never));
  }
}
export const gameBus = new Bus();
