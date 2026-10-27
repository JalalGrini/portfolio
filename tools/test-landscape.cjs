const test = require("node:test"),
  assert = require("node:assert/strict"),
  sharp = require("sharp");
const { load } = require("./load-game.cjs"),
  { isFree } = load("game/navigation.ts");
const world = require("../game/tour-world.json"),
  objects = [...world.objects, ...require("../game/town-details.json")],
  map = require("../game/town-map.json"),
  registry = require("../game/town-scenery.json");
test("landscape groups enrich yards and riverbanks without closing street centres", () => {
  assert.ok(world.landscape.gardens >= 10);
  assert.ok(world.landscape.riverbankGroups >= 35);
  assert.ok(objects.filter((o) => o.key === "outdoor-blossom").length >= 15);
  assert.ok(objects.filter((o) => o.key === "outdoor-park-bench").length >= 5);
  for (const k of map.centres)
    assert.ok(
      isFree(
        {
          x: (k % map.width) * 32 + 16,
          y: Math.floor(k / map.width) * 32 + 16,
        },
        world.width,
        world.height,
        world.solids,
      ),
      "Blocked street centre " + k,
    );
  for (const o of objects.filter((o) => o.key === "outdoor-garden-bed"))
    assert.ok(o.depth < 0, "Garden soil hides crops");
});
test("all landscape props have nonempty source art with the declared dimensions", async () => {
  for (const [name, spec] of Object.entries(registry)) {
    const { data, info } = await sharp(
      "public/assets/tour/outdoor-" + name + ".png",
    )
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.deepEqual([info.width, info.height], spec.size, name);
    assert.ok(
      data.some((v, i) => i % 4 === 3 && v > 0),
      "Empty " + name,
    );
  }
});
