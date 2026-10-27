// Small local TypeScript loader for read-only catalog/geometry audits.
const fs = require("fs"),
  path = require("path"),
  ts = require("typescript");
const cache = new Map();
function load(p) {
  p = path.resolve(p);
  if (p.endsWith(".json")) return JSON.parse(fs.readFileSync(p, "utf8"));
  if (cache.has(p)) return cache.get(p).exports;
  const m = { exports: {} };
  cache.set(p, m);
  const code = ts.transpileModule(fs.readFileSync(p, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (s) =>
      s.startsWith("@/")
        ? load(s.slice(2) + ".ts")
        : s.startsWith(".")
          ? load(
              path.resolve(path.dirname(p), s) + (path.extname(s) ? "" : ".ts"),
            )
          : require(s),
    m,
    m.exports,
  );
  return m.exports;
}
module.exports = { load };
