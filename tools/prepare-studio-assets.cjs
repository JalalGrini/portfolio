// Text-backed original WebP artwork: deterministic, offline, and MCP-writer friendly.
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const source = path.join(root, "assets-src/studio");
const output = path.join(root, "public/assets/studio");
fs.mkdirSync(output, { recursive: true });
for (const file of fs
  .readdirSync(source)
  .filter((f) => f.endsWith(".webp.b64"))) {
  const bytes = Buffer.from(
    fs.readFileSync(path.join(source, file), "utf8").trim(),
    "base64",
  );
  if (
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WEBP"
  )
    throw Error(`Invalid artwork: ${file}`);
  const target = path.join(output, file.slice(0, -4));
  if (!fs.existsSync(target) || !fs.readFileSync(target).equals(bytes))
    fs.writeFileSync(target, bytes);
}
console.log("Prepared original studio artwork locally.");
const roomSource = path.join(root, "assets-src/rooms");
const roomOutput = path.join(root, "public/assets/rooms");
fs.mkdirSync(roomOutput, { recursive: true });
for (const file of fs
  .readdirSync(roomSource)
  .filter((f) => f.endsWith(".png.b64"))) {
  const bytes = Buffer.from(
    fs.readFileSync(path.join(roomSource, file), "utf8").trim(),
    "base64",
  );
  if (
    !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    throw Error(`Invalid room art: ${file}`);
  fs.writeFileSync(path.join(roomOutput, file.slice(0, -4)), bytes);
}
console.log("Prepared licensed LPC interior artwork locally.");
const tourSource = path.join(root, "assets-src/tour"),
  tourOutput = path.join(root, "public/assets/tour");
if (fs.existsSync(tourSource)) {
  fs.mkdirSync(tourOutput, { recursive: true });
  for (const f of fs
    .readdirSync(tourSource)
    .filter((f) => f.endsWith(".png.b64"))) {
    const b = Buffer.from(
      fs.readFileSync(path.join(tourSource, f), "utf8").trim(),
      "base64",
    );
    if (
      !b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      throw Error("Invalid tour art: " + f);
    fs.writeFileSync(path.join(tourOutput, f.slice(0, -4)), b);
  }
  console.log("Prepared guided-town artwork locally.");
}
// Geometry and painted streets share one authored river-town mask.
require("child_process").execFileSync(
  process.execPath,
  [path.join(__dirname, "build_town_layout.cjs")],
  { stdio: "inherit" },
);
// Apply the reproducible daylight recipe AFTER decoding the legacy bundle.
// Kept separate from the cinematic/room assets and requires no Python/network.
require("child_process").execFileSync(
  process.execPath,
  [path.join(__dirname, "build_town_palette.cjs")],
  { stdio: "inherit" },
);
