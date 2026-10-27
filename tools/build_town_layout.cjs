/** Authored, irregular river-town topology. All world geometry and artwork use
 * the same masks; random seed is for scenery ONLY, never for street connectivity.
 */
const fs = require("fs"),
  path = require("path");
const root = path.resolve(__dirname, ".."),
  L = require("../game/town-layout.json");
const T = 32,
  W = L.width,
  H = L.height,
  key = (x, y) => y * W + x,
  xy = (k) => [k % W, Math.floor(k / W)];
const inMap = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const water = new Set(),
  bridgeCells = new Set(),
  fullBuildings = new Set(),
  blocked = new Set(),
  centres = new Set();
let seed = L.seed;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
function riverAt(y) {
  for (let i = 1; i < L.river.length; i++) {
    const [b, x1] = L.river[i],
      [a, x0] = L.river[i - 1];
    if (y <= b) return Math.round(x0 + ((x1 - x0) * (y - a)) / (b - a));
  }
  return L.river.at(-1)[1];
}
for (let y = 0; y < H; y++) {
  const x = riverAt(y),
    half = y >= 26 && y <= 48 ? 3 : 2;
  for (let xx = x - half; xx <= x + half; xx++) water.add(key(xx, y));
}
const bridges = L.bridges.map((y) => ({
  x: riverAt(y) - 5,
  y: y - 1,
  w: 11,
  h: 3,
  centre: riverAt(y),
  row: y,
}));
for (const b of bridges)
  for (let y = b.y; y < b.y + b.h; y++)
    for (let x = b.x; x < b.x + b.w; x++) bridgeCells.add(key(x, y));
const buildings = L.buildings.map((b) => ({
  ...b,
  x: b.door[0] * T - b.w / 2,
  y: b.door[1] * T - b.h - 24,
  doorX: b.door[0] * T,
  doorY: b.door[1] * T,
}));
for (const b of buildings) {
  for (let y = Math.floor(b.y / T); y < Math.ceil((b.y + b.h) / T); y++)
    for (let x = Math.floor(b.x / T); x < Math.ceil((b.x + b.w) / T); x++)
      if (inMap(x, y)) fullBuildings.add(key(x, y));
}
for (const n of fullBuildings) {
  const [x, y] = xy(n);
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      if (inMap(x + dx, y + dy)) blocked.add(key(x + dx, y + dy));
}
for (const n of water) {
  const [x, y] = xy(n);
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      if (inMap(x + dx, y + dy) && !bridgeCells.has(key(x + dx, y + dy)))
        blocked.add(key(x + dx, y + dy));
}
for (const n of bridgeCells) blocked.delete(n);
const safe = (x, y) =>
  x >= 2 && y >= 2 && x < W - 2 && y < H - 2 && !blocked.has(key(x, y));
function nearest(p) {
  if (safe(...p)) return p;
  for (let r = 1; r <= 10; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++)
        if (
          Math.max(Math.abs(dx), Math.abs(dy)) === r &&
          safe(p[0] + dx, p[1] + dy)
        )
          return [p[0] + dx, p[1] + dy];
  throw Error("No safe hub " + p);
}
class Heap {
  a = [];
  push(v) {
    const a = this.a;
    let i = a.length;
    a.push(v);
    while (i) {
      const p = (i - 1) >> 1;
      if (a[p].f <= v.f) break;
      a[i] = a[p];
      i = p;
    }
    a[i] = v;
  }
  pop() {
    const a = this.a,
      out = a[0],
      v = a.pop();
    if (a.length) {
      let i = 0;
      while (i * 2 + 1 < a.length) {
        let c = i * 2 + 1;
        if (c + 1 < a.length && a[c + 1].f < a[c].f) c++;
        if (a[c].f >= v.f) break;
        a[i] = a[c];
        i = c;
      }
      a[i] = v;
    }
    return out;
  }
  get length() {
    return this.a.length;
  }
}
function route(a, b) {
  const start = key(...a),
    end = key(...b),
    open = new Heap(),
    g = new Map([[start, 0]]),
    parent = new Map();
  open.push({ k: start, f: 0 });
  const closed = new Set();
  while (open.length) {
    const n = open.pop().k;
    if (closed.has(n)) continue;
    if (n === end) {
      const result = [n];
      let q = n;
      while (parent.has(q)) {
        q = parent.get(q);
        result.push(q);
      }
      return result.reverse();
    }
    closed.add(n);
    const [x, y] = xy(n);
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const xx = x + dx,
        yy = y + dy,
        k = key(xx, yy);
      if (!safe(xx, yy) || closed.has(k)) continue;
      const cost = g.get(n) + (centres.has(k) ? 0.72 : 1);
      if (cost < (g.get(k) ?? Infinity)) {
        g.set(k, cost);
        parent.set(k, n);
        open.push({
          k,
          f: cost + 0.7 * (Math.abs(xx - b[0]) + Math.abs(yy - b[1])),
        });
      }
    }
  }
  throw Error("Street unreachable " + a + " → " + b);
}
const nodes = Object.fromEntries(
  Object.entries(L.nodes).map(([n, p]) => [n, nearest(p)]),
);
bridges.forEach((b, i) => {
  nodes[`bridge${i}West`] = [b.x - 1, b.row];
  nodes[`bridge${i}East`] = [b.x + b.w, b.row];
  for (let x = b.x - 1; x <= b.x + b.w; x++) centres.add(key(x, b.row));
});
const streetLinks = [];
for (const [a, b] of L.links) {
  const p = route(nodes[a], nodes[b]);
  p.forEach((k) => centres.add(k));
  streetLinks.push({ from: a, to: b, tiles: p });
}
const doorRoutes = {};
for (const b of buildings) {
  const start = nearest([b.door[0], b.door[1] + 1]);
  const targets = [...centres]
    .map((k) => ({
      k,
      d: Math.abs((k % W) - start[0]) + Math.abs(Math.floor(k / W) - start[1]),
    }))
    .sort((a, b) => a.d - b.d);
  let p;
  for (const target of targets.slice(0, 15)) {
    try {
      p = route(start, xy(target.k));
      break;
    } catch {}
  }
  if (!p) throw Error("Door not connected " + b.id);
  p.forEach((k) => centres.add(k));
  doorRoutes[b.id] = p;
}
const roads = new Set();
for (const n of centres) {
  const [x, y] = xy(n);
  for (let dy = -1; dy <= 0; dy++)
    for (let dx = -1; dx <= 0; dx++) {
      const xx = x + dx,
        yy = y + dy,
        k = key(xx, yy);
      if (
        inMap(xx, yy) &&
        !fullBuildings.has(k) &&
        (!water.has(k) || bridgeCells.has(k))
      )
        roads.add(k);
    }
}
// Two-tile front aprons meet the actual painted threshold. The backmost
// 8px may sit under the facade; roads must not stop a grass tile away.
const aprons = new Set();
for (const b of buildings)
  for (let y = b.door[1] - 1; y <= b.door[1] + 1; y++)
    for (let x = b.door[0] - 1; x <= b.door[0]; x++) {
      const k = key(x, y);
      if (water.has(k)) throw Error("Door apron in water: " + b.id);
      aprons.add(k);
      roads.add(k);
    }
// Only the three authored bridges may cross the river.
for (const n of roads)
  if (water.has(n) && !bridgeCells.has(n))
    throw Error("Road crosses unbridged water");
const objects = buildings.map((b) => ({
  key: "house-" + b.id,
  x: b.x,
  y: b.y,
  depth: b.y + b.h,
}));
const solids = buildings.map((b) => ({
  x: b.x + 5,
  y: b.y + 12,
  w: b.w - 10,
  h: b.h - 12,
}));
// Merge water cells into row runs. The only gaps are real bridge walk surfaces.
for (let y = 0; y < H; y++) {
  let x = 0;
  while (x < W) {
    while (x < W && (!water.has(key(x, y)) || bridgeCells.has(key(x, y)))) x++;
    const a = x;
    while (x < W && water.has(key(x, y)) && !bridgeCells.has(key(x, y))) x++;
    if (x > a) solids.push({ x: a * T, y: y * T, w: (x - a) * T, h: T });
  }
}
const intersects = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const hitsMask = (r, mask) => {
  for (let y = Math.floor(r.y / T); y < Math.ceil((r.y + r.h) / T); y++)
    for (let x = Math.floor(r.x / T); x < Math.ceil((r.x + r.w) / T); x++)
      if (mask.has(key(x, y))) return true;
  return false;
};
function obj(k, x, y, h = 32) {
  objects.push({
    key: k,
    x: Math.round(x),
    y: Math.round(y),
    depth: Math.round(y + h),
  });
}
for (const b of buildings) {
  for (const side of [-1, 1]) {
    obj("plant", b.doorX + side * (b.w / 2 + 10) - 16, b.doorY - 46);
    for (let i = 0; i < 3; i++)
      obj(
        "flowers",
        b.doorX + side * (b.w / 2 + 48) + (i % 2) * 22 - 16,
        b.doorY - 72 + Math.floor(i / 2) * 24,
      );
  }
  const lamp = { x: b.doorX + b.w / 2 + 36, y: b.doorY - 48, w: 26, h: 62 };
  if (!hitsMask(lamp, water)) obj("lamp", lamp.x, lamp.y, 62);
}
const residents = L.residents.map((r, i) => {
  const home = nearest([
    nodes[r.node][0] + Math.round(r.offset[0] / T),
    nodes[r.node][1] + Math.round(r.offset[1] / T),
  ]);
  return { name: r.name, x: home[0] * T + 16, y: home[1] * T + 20, index: i };
});
for (const name of [
  "welcome",
  "civic",
  "data",
  "research",
  "makerWest",
  "makerEast",
  "post",
]) {
  const p = nodes[name];
  for (const [dx, dy, k] of [
    [96, 40, "bench"],
    [-104, 32, "bench"],
    [80, -88, "well"],
  ]) {
    const r = {
      x: p[0] * T + dx,
      y: p[1] * T + dy,
      w: k === "well" ? 64 : 32,
      h: 64,
    };
    if (
      !hitsMask(r, roads) &&
      !hitsMask(r, water) &&
      !buildings.some((b) => intersects(r, { ...b, w: b.w, h: b.h }))
    ) {
      obj(k, r.x, r.y, 64);
      if (k === "well") solids.push({ x: r.x + 10, y: r.y + 36, w: 44, h: 24 });
    }
  }
}
// Irregular forest groups and landscape buffers, never a repeated fence-row.
for (let y = -12; y < H * T - 144; y += 96)
  for (let x = -12; x < W * T - 96; x += 96) {
    const edge = x < 140 || y < 140 || x > W * T - 230 || y > H * T - 230;
    const east = x > W * T * 0.72;
    const chance = edge ? 0.78 : east ? 0.36 : 0.2;
    if (random() > chance) continue;
    const px = Math.max(
        0,
        Math.min(W * T - 96, Math.round(x + (random() - 0.5) * 40)),
      ),
      py = Math.max(
        0,
        Math.min(H * T - 144, Math.round(y + (random() - 0.5) * 40)),
      );
    const r = { x: px - 12, y: py - 10, w: 120, h: 164 };
    if (
      hitsMask(r, roads) ||
      hitsMask(r, water) ||
      buildings.some((b) =>
        intersects(r, { x: b.x - 32, y: b.y - 24, w: b.w + 64, h: b.h + 100 }),
      ) ||
      residents.some((n) =>
        intersects(r, { x: n.x - 40, y: n.y - 70, w: 80, h: 100 }),
      )
    )
      continue;
    obj(random() < 0.68 ? "tree" : "pine", px, py, 144);
    solids.push({ x: px + 34, y: py + 123, w: 28, h: 18 });
  }
const spawnPoint = nodes.welcome;
const world = {
  layoutVersion: L.version,
  width: W * T,
  height: H * T,
  spawn: { x: spawnPoint[0] * T + 16, y: spawnPoint[1] * T + 16 },
  buildings: buildings.map(({ door, ...b }) => b),
  objects,
  solids,
  residents,
};
const map = {
  version: L.version,
  width: W,
  height: H,
  tileSize: T,
  water: [...water].sort((a, b) => a - b),
  roads: [...roads].sort((a, b) => a - b),
  centres: [...centres].sort((a, b) => a - b),
  aprons: [...aprons].sort((a, b) => a - b),
  bridges,
  nodes,
  streetLinks,
  doorRoutes,
};
fs.writeFileSync(
  path.join(root, "game/tour-world.json"),
  JSON.stringify(world) + "\n",
);
fs.writeFileSync(
  path.join(root, "game/town-map.json"),
  JSON.stringify(map) + "\n",
);
console.log(
  `Authored river town: ${buildings.length} doors, ${bridges.length} bridges, ${L.links.length} neighbourhood links, ${objects.length} props, ${residents.length} distributed residents.`,
);
