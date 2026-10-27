/** Offline full-colour LPC furniture adaptations. Crops/footprints: game/room-props.json.
 * Source notices: public/licenses/{furniture,interior}.txt. No reference-image pixels.
 */
const fs = require("fs"),
  path = require("path"),
  crypto = require("crypto"),
  sharp = require("sharp");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "public/assets/rooms");
const registry = require("../game/room-props.json"),
  home = require("../game/layouts/about.json");
async function load(file) {
  const { data, info } = await sharp(path.join(root, file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}
const blank = (width, height) => ({
  data: Buffer.alloc(width * height * 4),
  width,
  height,
});
function crop(im, [x, y, w, h]) {
  const o = blank(w, h);
  for (let yy = 0; yy < h; yy++)
    im.data.copy(
      o.data,
      yy * w * 4,
      ((y + yy) * im.width + x) * 4,
      ((y + yy) * im.width + x + w) * 4,
    );
  return o;
}
function paste(to, im, x, y) {
  for (let yy = 0; yy < im.height; yy++)
    for (let xx = 0; xx < im.width; xx++) {
      const tx = x + xx,
        ty = y + yy;
      if (tx < 0 || ty < 0 || tx >= to.width || ty >= to.height) continue;
      const a = (yy * im.width + xx) * 4,
        b = (ty * to.width + tx) * 4,
        alpha = im.data[a + 3] / 255;
      for (let c = 0; c < 3; c++)
        to.data[b + c] = Math.round(
          im.data[a + c] * alpha + to.data[b + c] * (1 - alpha),
        );
      to.data[b + 3] = Math.round(
        255 * (alpha + (to.data[b + 3] / 255) * (1 - alpha)),
      );
    }
}
const png = (im) =>
  sharp(im.data, { raw: { width: im.width, height: im.height, channels: 4 } })
    .png()
    .toBuffer();
async function resize(im, w, h) {
  const { data } = await sharp(await png(im))
    .resize(w, h, { kernel: "nearest" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: w, height: h };
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const images = {
    furniture: await load("tools/source/furniture.png"),
    interior: await load("tools/source/interior.png"),
    base: await load("tools/source/base.png"),
    notebook: await load("public/assets/tour/prop-notebook.png"),
    workstation: await load("public/assets/tour/prop-workstation.png"),
  };
  const floor = crop(images.furniture, [0, 96, 32, 32]);
  const palette = new Set();
  for (let i = 0; i < floor.data.length; i += 4)
    palette.add(floor.data.readUInt32BE(i));
  const props = {};
  const hashes = {};
  for (const [name, r] of Object.entries(registry)) {
    const im = crop(images[r.source], r.crop);
    if (r.source === "furniture")
      for (let i = 0; i < im.data.length; i += 4)
        if (palette.has(im.data.readUInt32BE(i))) im.data[i + 3] = 0;
    props[name] = im;
    const b = await png(im);
    fs.writeFileSync(path.join(out, "authored-" + name + ".png"), b);
    hashes["authored-" + name] = crypto
      .createHash("sha256")
      .update(b)
      .digest("hex");
  }
  const room = blank(home.width, home.height);
  for (let y = 0; y < home.height; y += 32)
    for (let x = 0; x < home.width; x += 32) paste(room, floor, x, y);
  const wall = crop(images.interior, [64, 272, 128, 88]);
  for (let x = 0; x < home.width; x += 128) paste(room, wall, x, 14);
  // Real source wood trim, including dividers with generous open connections.
  const trim = crop(images.furniture, [0, 16, 32, 16]);
  for (let x = 0; x < home.width; x += 32) {
    paste(room, trim, x, 0);
    if (x < home.width / 2 - 48 || x > home.width / 2 + 32)
      paste(room, trim, x, home.height - 16);
  }
  const side = crop(images.interior, [128, 64, 16, 64]);
  for (let y = 0; y < home.height; y += 64) {
    paste(room, side, 0, y);
    paste(room, side, home.width - 16, y);
  }
  for (const w of home.walls) {
    const src = w.h > w.w ? side : trim;
    for (let y = 0; y < w.h; y += src.height)
      for (let x = 0; x < w.w; x += src.width) {
        const piece = crop(src, [
          0,
          0,
          Math.min(src.width, w.w - x),
          Math.min(src.height, w.h - y),
        ]);
        paste(room, piece, w.x + x, w.y + y);
      }
  }
  for (const d of home.decor)
    paste(room, await resize(props[d.prop], d.w, d.h), d.x, d.y);
  const b = await png(room);
  fs.writeFileSync(path.join(root, "public/assets/tour/room-about.png"), b);
  hashes["room-about"] = crypto.createHash("sha256").update(b).digest("hex");
  fs.writeFileSync(
    path.join(out, "authored-rooms.json"),
    JSON.stringify({ version: "C08-home-1", hashes }, null, 2) + "\n",
  );
  // Native-scale overview for visual inspection; runtime keeps props separate for depth.
  const preview = { ...room, data: Buffer.from(room.data) };
  for (const f of [...home.furniture].sort(
    (a, b) => (a.depth ?? a.y + a.h) - (b.depth ?? b.y + b.h),
  )) {
    let im = f.prop
      ? props[f.prop]
      : await load(
          "public/assets/tour/prop-" +
            f.texture.replace("domain-", "") +
            ".png",
        );
    paste(preview, await resize(im, f.w, f.h), f.x, f.y);
  }
  fs.writeFileSync(path.join(out, "home-overview.png"), await png(preview));
  console.log(
    "Prepared full-colour authored home +",
    Object.keys(props).length,
    "source furniture crops",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
