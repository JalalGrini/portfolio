/** C13b: deliberate yard/riverbank groups, not uniform random prop confetti. */
const scenery = require("../game/town-scenery.json");
module.exports = function landscape({
  buildings,
  objects,
  solids,
  roads,
  water,
  residents,
  W,
  H,
  T,
  hitsMask,
  intersects,
  obj,
  riverAt,
  random,
}) {
  let gardens = 0,
    banks = 0;
  function clear(r) {
    return (
      r.x >= 8 &&
      r.y >= 8 &&
      r.x + r.w < W * T - 8 &&
      r.y + r.h < H * T - 8 &&
      !hitsMask(r, roads) &&
      !hitsMask(r, water) &&
      !buildings.some((b) =>
        intersects(r, { x: b.x - 12, y: b.y - 8, w: b.w + 24, h: b.h + 20 }),
      ) &&
      !residents.some((n) =>
        intersects(r, { x: n.x - 34, y: n.y - 62, w: 68, h: 94 }),
      )
    );
  }
  function place(name, x, y) {
    const a = scenery[name],
      r = { x: Math.round(x), y: Math.round(y), w: a.size[0], h: a.size[1] };
    if (!clear(r)) return false;
    obj("outdoor-" + name, r.x, r.y, r.h);
    if (name === "garden-bed") objects.at(-1).depth = -5000;
    if (a.footprint) {
      const [x, y, w, h] = a.footprint;
      solids.push({ x: r.x + x, y: r.y + y, w, h });
    }
    return true;
  }
  for (const [i, b] of buildings.entries()) {
    // Different yard motifs: flowers at civic homes, practical produce plots in maker yards.
    for (const side of [-1, 1]) {
      const x = side < 0 ? b.x - 44 : b.x + b.w + 12;
      for (let n = 0; n < 4; n++)
        place(n % 3 === 0 ? "shrub" : "hedge", x, b.y + b.h - 104 + n * 32);
      for (let n = 0; n < 4; n++) {
        const r = {
          x: b.doorX + side * (64 + n * 24) - 16,
          y: b.doorY + 18 + (n % 2) * 18,
          w: 32,
          h: 32,
        };
        if (clear(r)) obj("flowers", r.x, r.y);
      }
    }
    const candidates = [
      { x: b.x + b.w + 64, y: b.y + b.h - 96 },
      { x: b.x - 136, y: b.y + b.h - 96 },
    ];
    for (const r of candidates) {
      if (gardens >= 16) break;
      if (place("garden-bed", r.x, r.y)) {
        gardens++;
        for (let y = 0; y < 3; y++)
          for (let x = 0; x < 2; x++)
            obj(
              "outdoor-" + (i % 3 === 0 ? "corn" : "tomato"),
              r.x + 6 + x * 24,
              r.y + 4 + y * 24,
              32,
            );
        break;
      }
    }
  }
  // Layered river margins with gaps at each bridge approach.
  for (let y = 3; y < H - 2; y += 2) {
    const cx = riverAt(y),
      half = y >= 26 && y <= 48 ? 3 : 2;
    for (const side of [-1, 1]) {
      const x = (cx + side * (half + 2)) * T + (side < 0 ? -32 : 0),
        py = y * T;
      if (place((y + side) % 3 === 0 ? "shrub" : "reeds", x, py)) {
        banks++;
        if (y % 4 === 1) place("hedge", x + side * 38, py + 18);
      }
      const r = { x: x + side * 58, y: py + 32, w: 32, h: 32 };
      if (y % 4 === 1 && clear(r)) obj("flowers", r.x, r.y);
    }
  }
  // Meadow islands between the streets. Grow in bounded clusters; leave broad walking gaps.
  for (let y = 7; y < H - 4; y += 6)
    for (let x = 5; x < W - 3; x += 7) {
      if (random() > 0.7) continue;
      const px = x * T + Math.round(random() * 48),
        py = y * T + Math.round(random() * 40);
      for (const [dx, dy, n] of [
        [0, 0, "shrub"],
        [30, 14, "hedge"],
        [-20, 34, "hedge"],
      ])
        place(n, px + dx, py + dy);
      for (let n = 0; n < 3; n++) {
        const r = {
          x: px - 28 + n * 24,
          y: py + 60 + (n % 2) * 8,
          w: 32,
          h: 32,
        };
        if (clear(r)) obj("flowers", r.x, r.y);
      }
    }
  return { gardens, riverbankGroups: banks };
};
