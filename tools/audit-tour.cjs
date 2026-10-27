const fs = require("fs"),
  ts = require("typescript"),
  path = require("path");
const { load } = require("./load-game.cjs");
const { places, stationsFor } = load("game/catalog.ts"),
  { route, isFree, distance } = load("game/navigation.ts"),
  { projects } = load("content/portfolio.ts"),
  world = require("../game/tour-world.json");
let problems = [];
for (const project of projects) {
  const matches = places.filter((p) => p.projectId === project.id);
  if (matches.length !== 1) problems.push("Project coverage " + project.id);
}
for (const p of places) {
  let solids = [
    { x: 0, y: 0, w: p.width, h: 102 },
    { x: 0, y: 0, w: 18, h: p.height },
    { x: p.width - 18, y: 0, w: 18, h: p.height },
    { x: 0, y: p.height - 24, w: p.width / 2 - 52, h: 24 },
    { x: p.width / 2 + 52, y: p.height - 24, w: p.width / 2 - 52, h: 24 },
  ];
  const stations = stationsFor(p);
  for (const s of stations)
    solids.push({ x: s.x + 4, y: s.y + s.h - 22, w: s.w - 8, h: 20 });
  solids.push({ x: p.width / 2 + 8 - 18, y: p.height - 130 - 8, w: 36, h: 16 });
  const { roomLayouts, roomSolids } = load("game/authoredRooms.ts");
  if (roomLayouts[p.id]) solids = roomSolids(roomLayouts[p.id]);
  const spawn = { x: p.width / 2, y: p.height - 54 };
  for (const s of stations) {
    if (!isFree(s.approach, p.width, p.height, solids))
      problems.push(p.id + " blocked approach " + s.id);
    const points = route(spawn, s.approach, p.width, p.height, solids);
    if (!points.length) problems.push(p.id + " unreachable " + s.id);
    let prev = spawn;
    for (const next of points) {
      for (let step = 1; step <= 8; step++) {
        const q = {
          x: prev.x + ((next.x - prev.x) * step) / 8,
          y: prev.y + ((next.y - prev.y) * step) / 8,
        };
        if (!isFree(q, p.width, p.height, solids))
          problems.push(p.id + " route collision " + s.id);
      }
      prev = next;
    }
  }
  for (const s of stations)
    if (
      s.x < 18 ||
      s.y < 102 ||
      s.x + s.w > p.width - 18 ||
      s.y + s.h > p.height - 24
    )
      problems.push(p.id + " prop out of bounds " + s.id);
  console.log(
    "PASS",
    p.id,
    p.width + "×" + p.height,
    stations.length,
    "reachable isolated exhibits",
  );
}
let prev = world.spawn;
for (const b of world.buildings) {
  const target = { x: b.doorX, y: b.doorY + 36 };
  if (
    !route(prev, target, world.width, world.height, world.solids).length &&
    distance(prev, target) > 10
  )
    problems.push("Town unreachable " + b.id);
  prev = target;
}
console.log(
  "Room sizes",
  new Set(places.map((p) => p.width + "x" + p.height)).size,
  "; project rooms",
  places.filter((p) => p.projectId).length,
  "; stations",
  places.reduce((n, p) => n + p.exhibits.length, 0),
);
if (problems.length) {
  console.error([...new Set(problems)].join("\n"));
  process.exit(1);
}
console.log(
  "PASS All town doors connected, all furniture accessible, project coverage exact",
);
