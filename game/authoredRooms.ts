import home from "./layouts/about.json";
import registry from "./room-props.json";
import type { Place, Station } from "./catalog";
import type { Point, Rect } from "./navigation";
export type Furniture = {
  id?: string;
  prop?: string;
  texture?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  depth?: number;
  seatable?: boolean;
};
export type RoomLayout = typeof home;
export const roomLayouts: Record<string, RoomLayout> = { about: home };
type Prop = {
  source: string;
  crop: number[];
  footprint: number[] | null;
  seat?: number[];
};
export const roomProps: Record<string, Prop> = registry;
export function roomSolids(layout: RoomLayout): Rect[] {
  const { width: w, height: h } = layout;
  const solids: Rect[] = [
    { x: 0, y: 0, w, h: 102 },
    { x: 0, y: 0, w: 18, h },
    { x: w - 18, y: 0, w: 18, h },
    { x: 0, y: h - 24, w: w / 2 - 52, h: 24 },
    { x: w / 2 + 52, y: h - 24, w: w / 2 - 52, h: 24 },
    ...layout.walls,
  ];
  for (const f of layout.furniture) {
    const r = f.prop ? roomProps[f.prop] : null;
    const b = r?.footprint;
    if (b) {
      const sx = f.w / r.crop[2],
        sy = f.h / r.crop[3];
      solids.push({
        x: f.x + b[0] * sx,
        y: f.y + b[1] * sy,
        w: b[2] * sx,
        h: b[3] * sy,
      });
    }
  }
  return solids;
}
export function authoredStations(place: Place): Station[] | null {
  const l = roomLayouts[place.id];
  if (!l) return null;
  return l.exhibits.map((e) => {
    const f = l.furniture.find((f) => f.id === e.furniture)!;
    return {
      ...place.exhibits.find((s) => s.id === e.id)!,
      x: f.x,
      y: f.y,
      w: f.w,
      h: f.h,
      approach: e.approach,
    };
  });
}
export function roomSeats(l: RoomLayout): Point[] {
  return l.furniture.flatMap((f) => {
    if ("seatable" in f && f.seatable === false) return [];
    const r = f.prop ? roomProps[f.prop] : null;
    if (!r?.seat) return [];
    return [
      {
        x: f.x + (r.seat[0] * f.w) / r.crop[2],
        y: f.y + (r.seat[1] * f.h) / r.crop[3],
      },
    ];
  });
}

/** Chair backs are behind seated actors, not a foreground mask over their bodies. */
export function furnitureDepth(f: Furniture): number {
  const r = f.prop ? roomProps[f.prop] : null;
  return (
    f.depth ??
    (r?.seat && f.seatable !== false
      ? f.y + (r.seat[1] * f.h) / r.crop[3] - 1
      : f.y + f.h)
  );
}
