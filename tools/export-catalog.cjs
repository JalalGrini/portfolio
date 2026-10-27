const fs = require("fs"),
  ts = require("typescript"),
  path = require("path");
const { load } = require("./load-game.cjs");
const { places, stationsFor } = load("game/catalog.ts");
fs.mkdirSync("test-results", { recursive: true });
fs.writeFileSync(
  "test-results/tour-catalog.json",
  JSON.stringify(places.map((p) => ({ ...p, stations: stationsFor(p) }))),
);
console.log("Exported", places.length, "places");
