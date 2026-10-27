const fs = require("fs"),
  ts = require("typescript"),
  path = require("path");
function load(p) {
  p = path.resolve(p);
  const code = ts.transpileModule(fs.readFileSync(p, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const m = { exports: {} };
  new Function("require", "module", "exports", code)(
    (s) =>
      s === "@/content/portfolio" ? load("content/portfolio.ts") : require(s),
    m,
    m.exports,
  );
  return m.exports;
}
const { places, stationsFor } = load("game/catalog.ts");
fs.mkdirSync("test-results", { recursive: true });
fs.writeFileSync(
  "test-results/tour-catalog.json",
  JSON.stringify(places.map((p) => ({ ...p, stations: stationsFor(p) }))),
);
console.log("Exported", places.length, "places");
