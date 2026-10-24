import type { BuildingId } from "@/content/portfolio";
export type GameEvents = {
  ready: undefined;
  near: { label: string; kind: string } | null;
  open: BuildingId;
  location: { name: string; room: BuildingId | null };
  position: { x: number; y: number; width: number; height: number };
  dialogue: { speaker: string; text: string };
  pause: boolean;
  reduced: boolean;
  action: {
    type: "interact" | "wave" | "sit" | "exit" | "navigate" | "direction";
    id?: BuildingId;
    x?: number;
    y?: number;
  };
  error: string;
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
