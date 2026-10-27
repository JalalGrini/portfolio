import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { route, isFree } from "../game/navigation.ts";
test("street cost chooses a logical marked detour instead of cutting grass", () => {
  const from = { x: 40, y: 88 },
    to = { x: 280, y: 88 };
  const street = (p) => (p.y < 56 || p.x < 56 || p.x > 264 ? 1 : 8);
  const direct = route(from, to, 320, 160, []),
    marked = route(from, to, 320, 160, [], street);
  assert.ok(marked.some((p) => p.y < 56));
  assert.ok(marked.length > direct.length);
});
test("every canonical outdoor tour leg is reachable and prefers painted streets", () => {
  const w = JSON.parse(
      fs.readFileSync(new URL("../game/tour-world.json", import.meta.url)),
    ),
    m = JSON.parse(
      fs.readFileSync(new URL("../game/town-map.json", import.meta.url)),
    ),
    roads = new Set(m.roads);
  const onRoad = (p) =>
    roads.has(Math.floor(p.y / 32) * m.width + Math.floor(p.x / 32));
  let from = w.spawn;
  let points = 0,
    street = 0;
  for (const b of w.buildings) {
    const to = { x: b.doorX, y: b.doorY + 36 };
    const p = route(from, to, w.width, w.height, w.solids, (q) =>
      onRoad(q) ? 1 : 8,
    );
    assert.ok(p.length, "Unreachable " + b.id);
    assert.ok(
      p.every((q) => isFree(q, w.width, w.height, w.solids)),
      "Blocked path " + b.id,
    );
    points += p.length;
    street += p.filter(onRoad).length;
    from = to;
  }
  assert.ok(
    street / points > 0.94,
    "Too much lawn cutting " + street + "/" + points,
  );
  console.log(
    "Outdoor tour waypoints on streets:",
    ((100 * street) / points).toFixed(1) + "%",
  );
});
