/** C02e: daylight art direction for /play/ only.
 * Reuses the licensed LPC atlases retained in tools/source. No reference-image
 * pixels, whole-scene filters, new navigation geometry or character recolours.
 * This runs AFTER legacy .b64 decoding so old desaturation cannot overwrite it.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const root = path.resolve(__dirname, "..");
const out = path.join(root, "public/assets/tour");
const world = require("../game/tour-world.json");
const townMap = require("../game/town-map.json");
const outputs = {};
const rgb = (hex) => hex.match(/[a-f\d]{2}/gi).map((v) => parseInt(v, 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function ramp(hexes, v, low, high) {
  const t = Math.max(0, Math.min(1, (v - low) / (high - low)));
  const stops = hexes.map(rgb);
  return t < 0.5
    ? mix(stops[0], stops[1], t * 2)
    : mix(stops[1], stops[2], t * 2 - 1);
}
async function load(file) {
  const { data, info } = await sharp(path.join(root, file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}
function blank(width, height) {
  return { data: Buffer.alloc(width * height * 4), width, height };
}
function crop(im, x, y, w, h) {
  const a = blank(w, h);
  for (let j = 0; j < h; j++)
    im.data.copy(
      a.data,
      j * w * 4,
      ((y + j) * im.width + x) * 4,
      ((y + j) * im.width + x + w) * 4,
    );
  return a;
}
function paste(to, im, x, y) {
  for (let j = 0; j < im.height; j++)
    for (let i = 0; i < im.width; i++) {
      const xx = x + i,
        yy = y + j;
      if (xx < 0 || yy < 0 || xx >= to.width || yy >= to.height) continue;
      const s = (j * im.width + i) * 4,
        d = (yy * to.width + xx) * 4;
      const a = im.data[s + 3] / 255;
      if (!a) continue;
      const b = to.data[d + 3] / 255,
        alpha = a + b * (1 - a);
      for (let k = 0; k < 3; k++)
        to.data[d + k] = Math.round(
          (im.data[s + k] * a + to.data[d + k] * b * (1 - a)) / alpha,
        );
      to.data[d + 3] = Math.round(alpha * 255);
    }
}
function recolour(im, fn) {
  const a = { ...im, data: Buffer.from(im.data) };
  for (let i = 0; i < a.data.length; i += 4) {
    if (!a.data[i + 3]) continue;
    const c = fn(
      [...a.data.subarray(i, i + 3)],
      Math.floor(i / 4) % im.width,
      Math.floor(i / 4 / im.width),
    );
    if (c) for (let k = 0; k < 3; k++) a.data[i + k] = c[k];
  }
  return a;
}
async function resize(im, w, h) {
  const data = await sharp(im.data, {
    raw: { width: im.width, height: im.height, channels: 4 },
  })
    .resize(w, h, { kernel: "nearest" })
    .raw()
    .toBuffer();
  return { data, width: w, height: h };
}
async function save(name, im) {
  const bytes = await sharp(im.data, {
    raw: { width: im.width, height: im.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(out, name + ".png"), bytes);
  outputs[name] = {
    width: im.width,
    height: im.height,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  };
}
const palettes = [
  {
    name: "terracotta-ivory",
    roof: ["#4e302d", "#b75f42", "#eeb179"],
    wall: ["#8c6245", "#cda776", "#f0d8aa"],
  },
  {
    name: "teal-limestone",
    roof: ["#1c3e3d", "#367d70", "#8bc0a1"],
    wall: ["#75634d", "#c2b18b", "#eddfb6"],
  },
  {
    name: "slate-sandstone",
    roof: ["#293d50", "#527f98", "#b0c7c8"],
    wall: ["#866144", "#c99b6d", "#efce96"],
  },
  {
    name: "berry-cream",
    roof: ["#493244", "#8f6078", "#cf9f9e"],
    wall: ["#87654e", "#cdb58b", "#f0deb5"],
  },
  {
    name: "honey-brick",
    roof: ["#543b2b", "#ad7c3f", "#e0ba70"],
    wall: ["#713c32", "#af6046", "#dc9872"],
  },
  {
    name: "blue-coral",
    roof: ["#263a51", "#4e7198", "#9cb8cf"],
    wall: ["#835240", "#c48b69", "#e4bd8c"],
  },
  {
    name: "cedar-sage",
    roof: ["#493c31", "#937144", "#ccb074"],
    wall: ["#53674b", "#9ba47a", "#d6d4a6"],
  },
];
const bases = [
  [224, 96, 160, 192],
  [960, 672, 160, 256],
  [960, 368, 160, 240],
  [1152, 48, 160, 240],
  [352, 384, 128, 224],
  [736, 1056, 96, 160],
  [512, 384, 320, 224],
];
const propKey = (o) =>
  o.key === "flowers"
    ? "outdoor-flowers-" + (Math.floor(Math.abs(o.x + o.y) / 32) % 3)
    : ["tree", "pine", "plant"].includes(o.key)
      ? "outdoor-" + o.key
      : o.key;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const terrain = await load("tools/source/terrain.png");
  const houses = await load("tools/source/houses.png");
  const base = await load("tools/source/base.png");
  const city = await load("tools/source/city.png");
  const textures = {};
  for (const [i, b] of world.buildings.entries()) {
    const spec = bases[i % bases.length],
      p = palettes[i % palettes.length];
    let facade = crop(houses, ...spec);
    facade = recolour(facade, ([r, g, b], x, y) => {
      if (b > r && b >= g && y < spec[3] - 48)
        return ramp(p.roof, (r + g + b) / 3, 24, 175);
      if (r > g * 1.2 && r > b * 1.18)
        return ramp(p.wall, 0.3 * r + 0.58 * g + 0.12 * b, 65, 160);
    });
    paste(
      facade,
      crop(base, 5 * 32, 9 * 32, 32, 64),
      spec[2] / 2 - 16,
      spec[3] - 64,
    );
    if (spec[2] >= 128) {
      const window = crop(base, 8 * 32, 9 * 32, 32, 64);
      paste(facade, window, 24, spec[3] - 64);
      paste(facade, window, spec[2] - 56, spec[3] - 64);
    }
    // Retain the existing footprints for this colour slice; C14 replaces the
    // inherited stretched silhouettes with authored facade compositions.
    facade = await resize(facade, b.w, b.h);
    textures["house-" + b.id] = facade;
    await save("house-" + b.id, facade);
  }
  for (const [name, row] of [
    ["tree", 12],
    ["pine", 15],
  ]) {
    const tree = blank(96, 144);
    paste(tree, crop(terrain, 26 * 32, 19 * 32, 32, 64), 32, 80);
    paste(tree, crop(terrain, 24 * 32, row * 32, 96, 96), 0, 0);
    textures["outdoor-" + name] = tree;
    await save("outdoor-" + name, tree);
  }
  textures["outdoor-plant"] = crop(city, 14 * 32, 12 * 32, 32, 32);
  await save("outdoor-plant", textures["outdoor-plant"]);
  const flower = crop(terrain, 7 * 32, 30 * 32, 32, 32);
  for (let i = 0; i < 3; i++) {
    const f = recolour(flower, ([r, g, b]) => {
      if (r > g * 1.15 && b > g * 1.1)
        return ramp(
          [
            ["#994e67", "#e597a1", "#fff0cc"],
            ["#725387", "#b19bcd", "#f0d9f1"],
            ["#a97736", "#e8c16a", "#fff1b5"],
          ][i],
          (r + g + b) / 3,
          65,
          245,
        );
    });
    textures["outdoor-flowers-" + i] = f;
    await save("outdoor-flowers-" + i, f);
  }
  // Source grass variants, with a coherent sunlit spring ramp. No tint overlay.
  const grass = [0, 1, 2].map((i) =>
    recolour(crop(terrain, (21 + i) * 32, 5 * 32, 32, 32), ([r, g, b]) => {
      const key = [r, g, b].join(",");
      return {
        "47,129,54": [77, 153, 57],
        "100,164,44": [137, 183, 65],
        "73,146,49": [108, 170, 54],
      }[key];
    }),
  );
  const ground = blank(world.width, world.height);
  for (let y = 0; y < world.height; y += 32)
    for (let x = 0; x < world.width; x += 32) {
      const i =
        ((Math.imul(x / 32 + 7, 73856093) ^ Math.imul(y / 32 + 3, 19349663)) >>>
          0) %
        3;
      paste(ground, grass[i], x, y);
    }
  const mask = new Set(
    townMap.roads.map(
      (k) => `${k % townMap.width},${Math.floor(k / townMap.width)}`,
    ),
  );
  const id = (x, y) => `${x},${y}`;
  const water = new Set(townMap.water);
  const waterAtlas = recolour(terrain, ([r, g, b]) => {
    if (b > r * 1.25 && g > r * 1.25 && b > 80)
      return ramp(["#28749d", "#519fc0", "#9ccbd5"], (r + g + b) / 3, 55, 210);
    return {
      "47,129,54": [77, 153, 57],
      "100,164,44": [137, 183, 65],
      "73,146,49": [108, 170, 54],
    }[[r, g, b].join(",")];
  });
  for (const k of water) {
    const x = k % townMap.width,
      y = Math.floor(k / townMap.width);
    const has = (xx, yy) => water.has(yy * townMap.width + xx);
    const cx = !has(x - 1, y) ? 0 : !has(x + 1, y) ? 2 : 1;
    const cy = !has(x, y - 1) ? 0 : !has(x, y + 1) ? 2 : 1;
    paste(
      ground,
      crop(waterAtlas, (9 + cx) * 32, (11 + cy) * 32, 32, 32),
      x * 32,
      y * 32,
    );
  }
  const roadAtlas = recolour(
    terrain,
    ([r, g, b]) =>
      ({
        "153,107,74": [170, 89, 40],
        "184,135,81": [211, 124, 48],
        "195,151,83": [235, 153, 66],
        "174,118,75": [193, 104, 42],
      })[[r, g, b].join(",")],
  );
  // Reuse the retained builder's quadrant-autotile logic: irregular gravel
  // shoulders replace the old ruler-straight opaque road rectangles.
  for (const key of mask) {
    const [x, y] = key.split(",").map(Number);
    for (let qy = 0; qy < 2; qy++)
      for (let qx = 0; qx < 2; qx++) {
        const sx = qx === 0 ? -1 : 1,
          sy = qy === 0 ? -1 : 1;
        const nx = mask.has(id(x + sx, y)),
          ny = mask.has(id(x, y + sy)),
          nd = mask.has(id(x + sx, y + sy));
        let cx = nx ? 1 : qx === 0 ? 0 : 2,
          cy = ny ? 3 : qy === 0 ? 2 : 4;
        if (nx && ny && !nd) {
          cx = qx === 0 ? 0 : 2;
          cy = qy === 0 ? 0 : 1;
        }
        paste(
          ground,
          crop(roadAtlas, (15 + cx) * 32 + qx * 16, cy * 32 + qy * 16, 16, 16),
          x * 32 + qx * 16,
          y * 32 + qy * 16,
        );
      }
  }
  // Real licensed timber pieces retained in the source atlas, not a brown
  // rectangle: plank deck (14,16) and upper/lower rope-rail strips (20,19/20).
  for (const b of townMap.bridges) {
    const deck = crop(terrain, 14 * 32, 16 * 32, 32, 32);
    for (let y = 0; y < b.h; y++)
      for (let x = 0; x < b.w; x++)
        paste(ground, deck, (b.x + x) * 32, (b.y + y) * 32);
    for (let x = 0; x < b.w; x++) {
      paste(
        ground,
        crop(terrain, 20 * 32, 19 * 32, 32, 32),
        (b.x + x) * 32,
        b.y * 32,
      );
      paste(
        ground,
        crop(terrain, 20 * 32, 20 * 32, 32, 32),
        (b.x + x) * 32,
        (b.y + b.h - 1) * 32,
      );
    }
  }
  await save("ground", ground);
  const map = { ...ground, data: Buffer.from(ground.data) };
  for (const o of [...world.objects].sort((a, b) => a.depth - b.depth)) {
    const key = propKey(o);
    if (!textures[key])
      textures[key] = await load("public/assets/game/" + key + ".png");
    paste(map, textures[key], o.x, o.y);
  }
  const ratio = Math.min(1100 / map.width, 1100 / map.height);
  await save(
    "map",
    await resize(
      map,
      Math.round(map.width * ratio),
      Math.round(map.height * ratio),
    ),
  );
  const geometryHash = crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(root, "game/tour-world.json")))
    .digest("hex");
  fs.writeFileSync(
    path.join(out, "town-style.json"),
    JSON.stringify(
      { version: "C13a-river-town-1", geometryHash, palettes, assets: outputs },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Prepared sunlit LPC town art: ${Object.keys(outputs).length} textures; navigation unchanged.`,
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
