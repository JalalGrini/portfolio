import test from "node:test";
import assert from "node:assert/strict";
import { dialoguePages, dialogueAck } from "../game/dialogue.ts";
import fs from "node:fs";
test("short and empty messages remain a single page", () => {
  assert.deepEqual(dialoguePages("Hi."), ["Hi."]);
  assert.deepEqual(dialoguePages(""), [""]);
});
test("long messages retain all words, accents and project facts", () => {
  const t =
    "Sentinel is design-stage research, not deployed. العربية / Darija — Jalal’s work. ".repeat(
      12,
    );
  const p = dialoguePages(t);
  assert.ok(p.length > 1);
  assert.equal(
    p.join(" ").replace(/\s+/g, " ").trim(),
    t.replace(/\s+/g, " ").trim(),
  );
  assert.ok(p.every((s) => s.length <= 260));
});
test("long URLs/tokens are never cut", () => {
  const t = "x".repeat(300) + " end";
  assert.equal(dialoguePages(t)[0], "x".repeat(300));
});
test("all 100 exhibit texts paginate without changing facts", () => {
  const places = JSON.parse(
    fs.readFileSync(
      new URL("../test-results/tour-catalog.json", import.meta.url),
    ),
  );
  let n = 0;
  for (const p of places)
    for (const e of p.stations) {
      assert.equal(
        dialoguePages(e.text).join(" ").replace(/\s+/g, " ").trim(),
        e.text.replace(/\s+/g, " ").trim(),
      );
      n++;
    }
  assert.equal(n, 100);
});
const s = { active: true, stage: "beat", index: 4, beat: 1 };
test("only a matching explicit current confirmation acknowledges a highlight", () => {
  assert.equal(dialogueAck("tour-ack-beat-4:1", s), "beat");
  for (const id of [
    "close",
    "Escape",
    "tour-ack-beat-3:1",
    "tour-ack-beat-4:0",
    "tour-ack-intro-4:1",
  ])
    assert.equal(dialogueAck(id, s), null);
});
test("late, duplicate, inactive and wrong-stage confirmations are ignored", () => {
  assert.equal(
    dialogueAck("tour-ack-beat-4:1", { ...s, stage: "to-beat", beat: 2 }),
    null,
  );
  assert.equal(dialogueAck("tour-ack-beat-4:1", { ...s, active: false }), null);
  assert.equal(
    dialogueAck("tour-ack-intro-4:1", { ...s, stage: "room-intro" }),
    "intro",
  );
});
