// Real pointer/keyboard interactions: every authored home exhibit and every seat.
const { chromium } = require("@playwright/test"),
  fs = require("fs"),
  { load } = require("./load-game.cjs");
const { roomLayouts, roomSolids, roomSeats } = load("game/authoredRooms.ts"),
  { route, distance, isFree } = load("game/navigation.ts");
const home = roomLayouts.about,
  solids = roomSolids(home),
  base = process.env.QA_BASE_URL || "http://localhost:3001",
  out = process.env.QA_OUTPUT || "/tmp/c08-interactions";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/local/bin/chromium",
    args: ["--no-sandbox"],
  });
  const p = await b.newPage({
    viewport: {
      width: +(process.env.QA_WIDTH || 1440),
      height: +(process.env.QA_HEIGHT || 900),
    },
  });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const shell = () => p.locator(".game-shell");
  const state = () =>
    shell().evaluate((e) =>
      Object.fromEntries(
        Object.entries(e.dataset).map(([k, v]) => [
          k,
          Number.isNaN(+v) ? v : +v,
        ]),
      ),
    );
  const choose = async (re) => {
    for (let n = 0; n < 80; n++) {
      const buttons = p
        .locator(".village-choices button")
        .filter({ hasText: re });
      if (await buttons.count()) {
        await buttons.first().click();
        return;
      }
      const reveal = p.getByRole("button", {
          name: "Show full message ↓",
          exact: true,
        }),
        next = p.getByRole("button", {
          name: "Continue reading →",
          exact: true,
        });
      if (await reveal.count()) await reveal.click().catch(() => {});
      else if (await next.count()) await next.click();
      else await p.waitForTimeout(100);
    }
    throw Error("No choice " + re);
  };
  const close = async () => {
    const d = p.locator(".village-dialogue");
    if (await d.count()) {
      await d
        .getByRole("button", { name: "Close dialog", exact: true })
        .click();
      await d.waitFor({ state: "hidden" });
      await p.waitForTimeout(150);
    }
  };
  const walk = async (target) => {
    for (let n = 0; n < 35; n++) {
      if (await p.locator(".village-dialogue").count()) {
        await close();
        if (distance(await state(), target) < 45) return;
      }
      const s = await state();
      if (distance(s, target) < 12) return;
      const path = route(s, target, home.width, home.height, solids);
      if (!path.length) throw Error("No route to " + JSON.stringify(target));
      const canvas = await p.locator(".game-canvas canvas").boundingBox();
      let click = null;
      for (const q of [...path].reverse()) {
        const x = (q.x - s.cameraX) * s.zoom + canvas.x,
          y = (q.y - s.cameraY) * s.zoom + canvas.y;
        if (
          x < canvas.x + 12 ||
          x > canvas.x + canvas.width - 12 ||
          y < canvas.y + 12 ||
          y > canvas.y + s.cameraHeight - 12
        )
          continue;
        const clear = await p.evaluate(
          ({ x, y }) => document.elementFromPoint(x, y)?.tagName === "CANVAS",
          { x, y },
        );
        if (clear) {
          click = { x, y, q };
          break;
        }
      }
      if (!click) throw Error("No uncovered route point");
      await p.mouse.click(click.x, click.y);
      for (let t = 0; t < 60; t++) {
        await p.waitForTimeout(100);
        const at = await state();
        if (
          distance(at, click.q) < 12 ||
          (await p.locator(".village-dialogue").count())
        )
          break;
      }
    }
    throw Error("Walk stalled " + JSON.stringify(target));
  };
  try {
    await p.goto(base + "/play/");
    await p.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("jalal-town-welcome-v3", "yes");
      localStorage.setItem(
        "jalal-town-settings",
        JSON.stringify({
          speed: 1.4,
          zoom: 1,
          time: "day",
          footsteps: false,
          reduced: true,
          instantText: true,
        }),
      );
    });
    await p.reload();
    await p.getByRole("button", { name: /Let’s explore/ }).click();
    await p.locator(".village-game.is-ready").waitFor({ timeout: 60000 });
    await p.getByRole("button", { name: "Take a tour", exact: true }).click();
    for (let n = 0; n < 12; n++) {
      if ((await state()).tourStage === "arrived") break;
      const follow = p.getByRole("button", {
        name: "Follow Jalal",
        exact: true,
      });
      if (await follow.count()) await follow.click();
      await p.waitForTimeout(800);
    }
    await p.getByRole("button", { name: "Enter →", exact: true }).click();
    await p.waitForFunction(
      () => document.querySelector(".game-shell")?.dataset.room === "about",
    );
    await choose(/I’ll explore on my own/);
    await p.locator(".village-dialogue").waitFor();
    await choose(/Look around first/);
    await p.getByRole("button", { name: "Leave tour", exact: true }).click();
    for (const e of home.exhibits) {
      await walk(e.approach);
      await p.keyboard.press("e");
      await p.locator(".village-dialogue").waitFor({ timeout: 5000 });
      const title = await p
        .locator(".village-dialogue .modal-top .eyebrow")
        .innerText();
      const catalog = JSON.parse(
        fs.readFileSync("test-results/tour-catalog.json"),
      );
      const expected = catalog
        .find((p) => p.id === "about")
        .exhibits.find((x) => x.id === e.id).title;
      if (title.toLocaleLowerCase() !== expected.toLocaleLowerCase())
        throw Error("Wrong exhibit " + title + " expected " + expected);
      await p.screenshot({ path: `${out}/exhibit-${e.id}.png` });
      await close();
      console.log("PASS home exhibit", e.id);
    }
    let i = 0;
    for (const seat of roomSeats(home)) {
      let approach = { x: seat.x, y: seat.y + 34 };
      if (!isFree(approach, home.width, home.height, solids))
        approach = { x: seat.x + 40, y: seat.y };
      await walk(approach);
      if (await p.locator(".village-dialogue").count()) await close();
      await p.keyboard.press("q");
      await p.waitForTimeout(350);
      const s = await state();
      if (s.sitting !== "true" || distance(s, seat) > 2)
        throw Error(
          "Did not sit on registered seat " + i + " " + JSON.stringify(s),
        );
      await p.screenshot({ path: `${out}/seat-${++i}.png` });
      await p.keyboard.press("q");
      await p.waitForTimeout(250);
      if ((await state()).sitting !== "false") throw Error("Did not stand");
      console.log("PASS registered seat", i);
    }
    if (errors.length) throw Error(errors.join("\n"));
    console.log("PASS every authored home exhibit + seat; no page errors");
  } catch (e) {
    console.error(e);
    await p.screenshot({ path: out + "/failure.png" });
    process.exitCode = 1;
  } finally {
    await b.close();
  }
})();
