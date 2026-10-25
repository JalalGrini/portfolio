/* Verify shipped art, unique room layouts and reachable reading stations. */
const fs = require("fs"),
  path = require("path"),
  crypto = require("crypto"),
  ts = require("typescript"),
  Module = require("module");
const root = path.resolve(__dirname, "..");
const mod = new Module(path.join(root, "game/rooms.ts"));
mod.paths = module.paths;
mod.filename = path.join(root, "game/rooms.ts");
mod._compile(
  ts.transpileModule(
    fs.readFileSync(path.join(root, "game/rooms.ts"), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  mod.filename,
);
const { rooms, roomProps } = mod.exports;
const hash = new Set(),
  layouts = new Set();
const rect = (x, y, w, h) => ({ x, y, w, h });
for (const prop of roomProps)
  if (!fs.existsSync(path.join(root, `public/assets/rooms/${prop}.png`)))
    throw Error("Missing room prop " + prop);
for (const [id, room] of Object.entries(rooms)) {
  const floor = fs.readFileSync(
    path.join(root, `public/assets/rooms/floor-${id}.png`),
  );
  if (floor.readUInt32BE(16) !== 704 || floor.readUInt32BE(20) !== 512)
    throw Error("Wrong floor dimensions " + id);
  hash.add(crypto.createHash("sha256").update(floor).digest("hex"));
  layouts.add(JSON.stringify(room.furniture));
  const solids = [
    rect(0, 0, 704, 106),
    rect(0, 0, 20, 512),
    rect(684, 0, 20, 512),
    rect(0, 486, 300, 26),
    rect(404, 486, 300, 26),
  ];
  for (const p of room.furniture) {
    const dir = roomProps.includes(p.key) ? "rooms" : "game";
    const d = fs.readFileSync(
      path.join(root, `public/assets/${dir}/${p.key}.png`),
    );
    const w = d.readUInt32BE(16),
      h = d.readUInt32BE(20);
    if (p.x < 20 || p.x + w > 684 || p.y + h > 470)
      throw Error("Furnishing out of room " + id + " " + p.key);
    solids.push(rect(p.x, p.y + h - p.h, p.w, p.h));
  }
  const free = (x, y) =>
    !solids.some(
      (s) =>
        x - 10 < s.x + s.w && x + 10 > s.x && y - 11 < s.y + s.h && y + 1 > s.y,
    );
  if (!free(352, 428)) throw Error("Blocked entry " + id);
  const q = [{ x: 352, y: 428 }],
    seen = new Set();
  let reach = false;
  while (q.length) {
    const p = q.shift(),
      k = `${p.x},${p.y}`;
    if (seen.has(k)) continue;
    seen.add(k);
    if (Math.hypot(p.x - room.notes.x, p.y - room.notes.y) < 65) {
      reach = true;
      break;
    }
    for (const [dx, dy] of [
      [8, 0],
      [-8, 0],
      [0, 8],
      [0, -8],
    ]) {
      const x = p.x + dx,
        y = p.y + dy;
      if (
        x > 20 &&
        x < 684 &&
        y > 108 &&
        y < 486 &&
        free(x, y) &&
        !seen.has(`${x},${y}`)
      )
        q.push({ x, y });
    }
  }
  if (!reach) throw Error("Reading station inaccessible " + id);
  console.log("PASS", id, "art, furniture bounds, entry and reading route");
}
if (hash.size !== 7 || layouts.size !== 7)
  throw Error("Rooms must have seven distinct surfaces and layouts");
console.log("Seven distinct room surfaces and layouts validated.");
