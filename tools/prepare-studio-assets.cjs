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
