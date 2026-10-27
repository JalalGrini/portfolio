const fs = require("fs"),
  path = require("path"),
  crypto = require("crypto"),
  assert = require("assert/strict");
const { execFileSync } = require("child_process");
const root = path.resolve(__dirname, "..");
const hash = (f) =>
  crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(root, f)))
    .digest("hex");
execFileSync(
  process.execPath,
  [path.join(__dirname, "build_town_layout.cjs")],
  { stdio: "pipe" },
);
const before = [hash("game/tour-world.json"), hash("game/town-map.json")];
const w = JSON.parse(fs.readFileSync(path.join(root, "game/tour-world.json"))),
  m = JSON.parse(fs.readFileSync(path.join(root, "game/town-map.json"))),
  T = m.tileSize,
  W = m.width;
assert.equal(w.buildings.length, 21);
assert.equal(new Set(w.buildings.map((b) => b.id)).size, 21);
assert.equal(m.bridges.length, 3);
const water = new Set(m.water),
  roads = new Set(m.roads),
  aprons = new Set(m.aprons),
  bridge = new Set();
for (const b of m.bridges)
  for (let y = b.y; y < b.y + b.h; y++)
    for (let x = b.x; x < b.x + b.w; x++) bridge.add(y * W + x);
const hit = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
for (let i = 0; i < w.buildings.length; i++)
  for (let j = i + 1; j < w.buildings.length; j++)
    assert.ok(
      !hit(w.buildings[i], w.buildings[j]),
      `Overlapping facades ${w.buildings[i].id}/${w.buildings[j].id}`,
    );
for (const b of w.buildings) {
  assert.ok(m.doorRoutes[b.id]?.length, "Missing route " + b.id);
  for (let y = b.doorY / T - 1; y <= b.doorY / T + 1; y++)
    for (let x = b.doorX / T - 1; x <= b.doorX / T; x++)
      assert.ok(roads.has(y * W + x), "Grass gap at threshold " + b.id);
}
for (const k of roads) {
  assert.ok(!water.has(k) || bridge.has(k), "Unbridged road crossing");
  const x = (k % W) * T,
    y = Math.floor(k / W) * T;
  if (!aprons.has(k))
    for (const b of w.buildings)
      assert.ok(!hit({ x, y, w: T, h: T }, b), "Road under facade " + b.id);
}
function flood(allowed, start) {
  const seen = new Set([start]),
    q = [start];
  for (let i = 0; i < q.length; i++) {
    const k = q[i],
      x = k % W,
      y = Math.floor(k / W);
    for (const [xx, yy] of [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]) {
      const n = yy * W + xx;
      if (
        xx >= 0 &&
        xx < W &&
        yy >= 0 &&
        yy < m.height &&
        allowed.has(n) &&
        !seen.has(n)
      ) {
        seen.add(n);
        q.push(n);
      }
    }
  }
  return seen;
}
const start = m.centres[0],
  seen = flood(roads, start);
assert.equal(seen.size, roads.size, "Disconnected painted street");
const noBridges = new Set([...roads].filter((k) => !bridge.has(k)));
assert.ok(
  flood(noBridges, [...noBridges][0]).size < noBridges.size,
  "River can be bypassed without a bridge",
);
for (const r of w.residents)
  for (const other of w.residents)
    if (r.index < other.index)
      assert.ok(
        Math.hypot(r.x - other.x, r.y - other.y) > 220,
        "Residents clustered together",
      );
assert.ok(
  new Set(w.buildings.map((b) => b.doorY)).size >= 15,
  "Regular row-grid remains",
);
execFileSync(
  process.execPath,
  [path.join(__dirname, "build_town_layout.cjs")],
  { stdio: "pipe" },
);
assert.deepEqual(
  [hash("game/tour-world.json"), hash("game/town-map.json")],
  before,
  "Non-deterministic geometry",
);
console.log(
  "PASS 21 distinct doors, no facade overlap, connected threshold-to-street paths, 3 required bridges, distributed residents, deterministic geometry",
);
