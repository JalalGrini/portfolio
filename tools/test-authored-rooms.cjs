const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("fs");
const { load } = require("./load-game.cjs");
const {
  roomLayouts,
  roomProps,
  roomSolids,
  roomSeats,
  authoredStations,
  furnitureDepth,
} = load("game/authoredRooms.ts");
const { places } = load("game/catalog.ts"),
  { route, isFree, distance } = load("game/navigation.ts");
test("authored home owns every exhibit once and replaces the shared five-spot layout", () => {
  for (const l of Object.values(roomLayouts)) {
    const p = places.find((p) => p.id === l.id);
    assert.equal(p.width, l.width);
    assert.equal(p.height, l.height);
    assert.deepEqual(
      l.exhibits.map((e) => e.id).sort(),
      p.exhibits.map((e) => e.id).sort(),
    );
    assert.equal(
      new Set(l.furniture.map((f) => f.id)).size,
      l.furniture.length,
    );
    assert.ok(l.zones.length >= 4);
    assert.ok(l.furniture.length >= 18);
  }
});
test("all source furniture crops, footprints and rendered bounds are valid", () => {
  for (const [key, p] of Object.entries(roomProps)) {
    assert.ok(p.crop[2] > 0 && p.crop[3] > 0, key);
    const [x, y, w, h] = p.crop;
    const dims = {
      interior: [512, 422],
      base: [1024, 1024],
      furniture: [512, 512],
      notebook: [112, 95],
      workstation: [112, 94],
    }[p.source];
    assert.ok(x >= 0 && y >= 0 && x + w <= dims[0] && y + h <= dims[1], key);
    if (p.footprint) {
      const [x, y, w, h] = p.footprint;
      assert.ok(
        x >= 0 && y >= 0 && x + w <= p.crop[2] && y + h <= p.crop[3],
        key,
      );
    }
  }
  for (const l of Object.values(roomLayouts))
    for (const f of l.furniture) {
      assert.ok(
        f.x >= 18 &&
          f.y >= 102 &&
          f.x + f.w <= l.width - 18 &&
          f.y + f.h <= l.height - 24,
        f.id,
      );
      if (f.prop) assert.ok(roomProps[f.prop], f.id);
    }
});
test("every exhibit approach and adjacent guide position has a collision-free route", () => {
  for (const l of Object.values(roomLayouts)) {
    const solids = roomSolids(l),
      spawn = { x: l.width / 2, y: l.height - 54 };
    assert.ok(isFree(spawn, l.width, l.height, solids));
    let from = spawn;
    for (const e of l.exhibits) {
      assert.ok(
        isFree(e.approach, l.width, l.height, solids),
        "blocked " + e.id,
      );
      const path = route(from, e.approach, l.width, l.height, solids);
      assert.ok(path.length, "unreachable " + e.id);
      let last = from;
      for (const q of path) {
        for (let k = 1; k <= 8; k++)
          assert.ok(
            isFree(
              {
                x: last.x + ((q.x - last.x) * k) / 8,
                y: last.y + ((q.y - last.y) * k) / 8,
              },
              l.width,
              l.height,
              solids,
            ),
            "collision " + e.id,
          );
        last = q;
      }
      const candidates = [
        [58, 8],
        [-58, 8],
        [0, 42],
        [70, 30],
        [-70, 30],
        [34, 40],
      ].map(([x, y]) => ({ x: e.approach.x + x, y: e.approach.y + y }));
      assert.ok(
        candidates.some(
          (q) =>
            isFree(q, l.width, l.height, solids) &&
            route(e.approach, q, l.width, l.height, solids).length,
        ),
        "guide cannot stand beside " + e.id,
      );
      from = e.approach;
    }
    assert.ok(route(from, spawn, l.width, l.height, solids).length);
  }
});
test("registered chairs and stools can be approached from the room entrance", () => {
  for (const l of Object.values(roomLayouts)) {
    const solids = roomSolids(l),
      spawn = { x: l.width / 2, y: l.height - 54 },
      seats = roomSeats(l);
    assert.ok(seats.length >= 4);
    for (const s of seats) {
      const p = route(spawn, s, l.width, l.height, solids);
      assert.ok(
        p.length && distance(p.at(-1), s) < 55,
        "unreachable seat " + JSON.stringify(s),
      );
    }
  }
});

test("chair backs render behind seated actors and occupied side tables are not seats", () => {
  const l = roomLayouts.about;
  const seats = roomSeats(l);
  assert.equal(seats.length, 4);
  for (const f of l.furniture) {
    const r = roomProps[f.prop];
    if (!r?.seat || f.seatable === false) continue;
    const y = f.y + (r.seat[1] * f.h) / r.crop[3];
    assert.ok(furnitureDepth(f) < y + 8);
  }
  const bedside = l.furniture.find((f) => f.id === "bedside");
  assert.equal(bedside.seatable, false);
});

test("home seating faces its furniture and kitchen has an open entry", () => {
  const l = roomLayouts.about;
  const f = Object.fromEntries(l.furniture.map((x) => [x.id, x]));
  const facing = (x) => x.facing ?? roomProps[x.prop].facing ?? 2;
  assert.equal(facing(f["reading-chair"]), 3);
  assert.equal(facing(f["reading-chair2"]), 1);
  assert.ok(f["reading-chair"].x < f.welcome.x);
  assert.ok(f["reading-chair2"].x > f.welcome.x + f.welcome.w);
  assert.equal(facing(f["study-chair"]), 0);
  assert.ok(f["study-chair"].y >= f["computer-desk"].y + f["computer-desk"].h);
  assert.equal(facing(f["kitchen-stool"]), 1);
  assert.ok(f["kitchen-stool"].x > f["kitchen-table"].x);
  const solids = roomSolids(l);
  assert.ok(isFree({ x: 472, y: 414 }, l.width, l.height, solids));
  assert.ok(
    route({ x: 352, y: 522 }, { x: 540, y: 500 }, l.width, l.height, solids)
      .length,
  );
});

test("free clicks beside study chair reach exact point on either side of grid edge", () => {
  const h = roomLayouts.about,
    solids = roomSolids(h);
  for (const x of [655.88, 656, 656.12]) {
    const target = { x, y: 325.88 };
    for (const start of [
      { x: 488, y: 326 },
      { x: 632, y: 312 },
    ]) {
      const path = route(start, target, h.width, h.height, solids);
      assert.ok(path.length);
      assert.ok(
        distance(path.at(-1), target) < 1,
        JSON.stringify({ start, target, path }),
      );
    }
  }
});

test("departing a free subcell beside chair never crosses its footprint", () => {
  const h = roomLayouts.about,
    solids = roomSolids(h);
  for (const x of [655.88, 656, 656.12]) {
    let last = { x, y: 325.88 };
    const path = route(last, { x: 87, y: 477 }, h.width, h.height, solids);
    assert.ok(path.length);
    for (const q of path) {
      for (let k = 1; k <= 16; k++)
        assert.ok(
          isFree(
            {
              x: last.x + ((q.x - last.x) * k) / 16,
              y: last.y + ((q.y - last.y) * k) / 16,
            },
            h.width,
            h.height,
            solids,
          ),
        );
      last = q;
    }
  }
});
