// Offline reproducibility / asset / unchanged-navigation gate for C02e.
const fs = require("fs"),
  path = require("path"),
  crypto = require("crypto");
const { execFileSync } = require("child_process");
const sharp = require("sharp");
const root = path.resolve(__dirname, "..");
const dir = path.join(root, "public/assets/tour");
const hash = (f) =>
  crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
(async () => {
  const geometry = hash(path.join(root, "game/tour-world.json"));
  execFileSync(
    process.execPath,
    [path.join(__dirname, "build_town_palette.cjs")],
    { stdio: "pipe" },
  );
  const manifest = fs.readFileSync(path.join(dir, "town-style.json"), "utf8");
  const m = JSON.parse(manifest),
    world = require("../game/tour-world.json");
  if (Object.keys(m.assets).length !== 29 || m.geometryHash !== geometry)
    throw Error("Incomplete art or changed geometry");
  for (const b of world.buildings) {
    const a = m.assets["house-" + b.id];
    if (!a || a.width !== b.w || a.height !== b.h)
      throw Error("Facade footprint changed: " + b.id);
  }
  for (const [name, a] of Object.entries(m.assets)) {
    const file = path.join(dir, name + ".png"),
      info = await sharp(file).metadata();
    if (
      info.width !== a.width ||
      info.height !== a.height ||
      hash(file) !== a.sha256
    )
      throw Error("Bad asset: " + name);
  }
  execFileSync(
    process.execPath,
    [path.join(__dirname, "build_town_palette.cjs")],
    { stdio: "pipe" },
  );
  if (fs.readFileSync(path.join(dir, "town-style.json"), "utf8") !== manifest)
    throw Error("Build is not deterministic");
  if (hash(path.join(root, "game/tour-world.json")) !== geometry)
    throw Error("Navigation changed");
  console.log(
    "PASS 29 palette textures, 21 facade footprints, deterministic hashes, unchanged navigation",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
