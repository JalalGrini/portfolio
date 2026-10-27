// Unit tests for the pure tour machine. Run: node --test tools/test-tour.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  tourReduce,
  initialTour,
  makePlan,
  toSave,
  resumeIndex,
  resumePoint,
} from "../game/tour.ts";

const plan = makePlan([
  {
    id: "home",
    exhibits: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
  },
  { id: "lab", exhibits: [{ id: "x" }] },
  { id: "post", exhibits: [] },
]);
const run = (events, s = initialTour(plan)) =>
  events.reduce((st, e) => tourReduce(plan, st, e), s);

test("plan caps highlights at three per room", () => {
  assert.deepEqual(plan[0].beats, ["a", "b", "c"]);
  assert.equal(plan[2].beats.length, 0);
});

test("full journey through every stop and every beat", () => {
  let s = run([{ type: "start" }]);
  assert.equal(s.stage, "leading");
  assert.equal(s.target, "home");
  s = run([{ type: "arrive-door" }, { type: "enter-room", id: "home" }], s);
  assert.equal(s.stage, "room-intro");
  s = run([{ type: "intro-done" }], s);
  assert.equal(s.stage, "to-beat");
  assert.equal(s.beatId, "a");
  for (const id of ["a", "b", "c"]) {
    assert.equal(s.beatId, id);
    s = run([{ type: "reach-beat" }, { type: "beat-done" }], s);
  }
  assert.equal(s.stage, "room-free");
  s = run([{ type: "exit-room" }], s);
  assert.equal(s.stage, "leading");
  assert.equal(s.target, "lab");
  s = run(
    [
      { type: "enter-room", id: "lab" },
      { type: "intro-done" },
      { type: "reach-beat" },
      { type: "beat-done" },
      { type: "exit-room" },
    ],
    s,
  );
  assert.equal(s.target, "post");
  s = run([{ type: "enter-room", id: "post" }, { type: "intro-done" }], s);
  assert.equal(
    s.stage,
    "room-free",
    "room without beats goes straight to free look",
  );
  s = run([{ type: "exit-room" }], s);
  assert.equal(s.stage, "complete");
  assert.equal(s.active, false);
});

test("irrelevant or duplicate events are no-ops (same object)", () => {
  const idle = initialTour(plan);
  assert.equal(tourReduce(plan, idle, { type: "next" }), idle);
  assert.equal(tourReduce(plan, idle, { type: "leave" }), idle);
  const s = run([{ type: "start" }]);
  for (const e of [
    { type: "intro-done" },
    { type: "reach-beat" },
    { type: "beat-done" },
    { type: "exit-room" },
    { type: "visitor-near" },
    { type: "enter-room", id: "lab" },
  ])
    assert.equal(tourReduce(plan, s, e), s, e.type);
  const inRoom = run([{ type: "enter-room", id: "home" }], s);
  assert.equal(
    tourReduce(plan, inRoom, { type: "enter-room", id: "home" }),
    inRoom,
  );
  assert.equal(tourReduce(plan, inRoom, { type: "arrive-door" }), inRoom);
});

test("waiting only toggles while leading outdoors", () => {
  let s = run([{ type: "start" }, { type: "visitor-far" }]);
  assert.equal(s.stage, "waiting");
  s = run([{ type: "visitor-near" }], s);
  assert.equal(s.stage, "leading");
  const r = run([{ type: "enter-room", id: "home" }], s);
  assert.equal(tourReduce(plan, r, { type: "visitor-far" }), r);
});

test("can enter the target room straight from waiting", () => {
  const s = run([
    { type: "start" },
    { type: "visitor-far" },
    { type: "enter-room", id: "home" },
  ]);
  assert.equal(s.stage, "room-intro");
});

test("skip-room jumps to free look, then leaving advances", () => {
  let s = run([
    { type: "start" },
    { type: "enter-room", id: "home" },
    { type: "intro-done" },
    { type: "skip-room" },
  ]);
  assert.equal(s.stage, "room-free");
  s = run([{ type: "exit-room", id: "home" }], s);
  assert.equal(s.target, "lab");
  assert.equal(s.beat, 0);
  assert.equal(s.beatId, undefined);
});

test("leaving mid-room pauses at the door and resumes the same highlight", () => {
  let s = run([
    { type: "start" },
    { type: "enter-room", id: "home" },
    { type: "intro-done" },
    { type: "reach-beat" },
    { type: "beat-done" },
    { type: "reach-beat" },
  ]);
  assert.equal(s.beat, 1);
  s = run([{ type: "exit-room", id: "home" }], s);
  assert.equal(s.stage, "arrived", "early exit does not advance");
  assert.equal(s.target, "home");
  assert.equal(s.beat, 1);
  assert.equal(s.beatId, undefined);
  // repeated exit events are harmless
  assert.equal(tourReduce(plan, s, { type: "exit-room" }), s);
  s = run([{ type: "enter-room", id: "home" }, { type: "intro-done" }], s);
  assert.equal(s.stage, "to-beat");
  assert.equal(s.beatId, "b", "picks up at highlight 2");
  // leaving during the intro also pauses instead of skipping the stop
  const intro = run([
    { type: "start", from: 1 },
    { type: "enter-room", id: "lab" },
  ]);
  assert.equal(run([{ type: "exit-room" }], intro).stage, "arrived");
});

test("exit-room for another building and stale next are ignored", () => {
  const s = run([
    { type: "start" },
    { type: "enter-room", id: "home" },
    { type: "intro-done" },
    { type: "skip-room" },
  ]);
  assert.equal(tourReduce(plan, s, { type: "exit-room", id: "lab" }), s);
  const n = run([{ type: "next", from: 0 }], s);
  assert.equal(n.index, 1);
  assert.equal(
    tourReduce(plan, n, { type: "next", from: 0 }),
    n,
    "double click",
  );
  assert.equal(run([{ type: "next", from: 1 }], n).index, 2);
});

test("leave keeps position for resume; start(from) resumes", () => {
  let s = run([{ type: "start", from: 1 }, { type: "leave" }]);
  assert.equal(s.active, false);
  assert.equal(s.index, 1);
  const save = toSave(s);
  assert.equal(resumeIndex(save, plan), 1);
  s = run([{ type: "start", from: resumeIndex(save, plan) }], s);
  assert.equal(s.target, "lab");
  assert.equal(s.stage, "leading");
});

test("restart from complete and clamped start index", () => {
  const done = run([{ type: "start", from: 2 }, { type: "next" }]);
  assert.equal(done.stage, "complete");
  assert.equal(run([{ type: "start" }], done).target, "home");
  assert.equal(run([{ type: "start", from: 99 }]).target, "post");
  assert.equal(run([{ type: "start", from: -4 }]).target, "home");
});

test("resumeIndex rejects junk, old versions, completed and first-stop saves", () => {
  for (const raw of [
    null,
    "x",
    {},
    { v: 1, index: 1 },
    { v: 2, index: 1, complete: true },
    { v: 3, index: 1, beat: 0, complete: true },
    { v: 2, index: 0 },
    { v: 3, index: 0, beat: 0 },
    { v: 2, index: 9 },
    { v: 2, index: 1.5 },
    { v: 3, index: -1, beat: 1 },
  ])
    assert.equal(resumeIndex(raw, plan), null, JSON.stringify(raw));
});

test("saves remember the highlight; v2 saves migrate", () => {
  const s = run([
    { type: "start" },
    { type: "enter-room", id: "home" },
    { type: "intro-done" },
    { type: "reach-beat" },
    { type: "beat-done" },
    { type: "leave" },
  ]);
  const save = toSave(s);
  assert.deepEqual(save, { v: 3, index: 0, beat: 1, complete: false });
  assert.deepEqual(resumePoint(save, plan), { index: 0, beat: 1 });
  const r = run([{ type: "start", from: 0, beat: 1 }]);
  assert.equal(r.beat, 1);
  const inside = run(
    [{ type: "enter-room", id: "home" }, { type: "intro-done" }],
    r,
  );
  assert.equal(inside.beatId, "b");
  assert.deepEqual(resumePoint({ v: 2, index: 1 }, plan), {
    index: 1,
    beat: 0,
  });
  // finished room (beat === beats) resumes at the next stop
  assert.deepEqual(resumePoint({ v: 3, index: 0, beat: 3 }, plan), {
    index: 1,
    beat: 0,
  });
  assert.equal(
    resumePoint({ v: 3, index: 2, beat: 1 }, plan),
    null,
    "last stop done",
  );
  assert.equal(run([{ type: "start", from: 0, beat: 3 }]).target, "lab");
});
