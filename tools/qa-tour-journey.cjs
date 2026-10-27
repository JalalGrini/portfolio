// Guided interior journey: town → door → room intro → every highlight → free look → next stop.
// QA_STOPS=2 (default) checks the first stops; QA_STOPS=21 runs the whole tour.
const { chromium } = require("@playwright/test"),
  fs = require("fs");
const base = process.env.QA_BASE_URL || "http://localhost:3001",
  out = process.env.QA_OUTPUT || "test-results/tour-journey",
  stops = +(process.env.QA_STOPS || 2);
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/local/bin/chromium",
    args: ["--no-sandbox"],
  });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const pause = (ms) => p.waitForTimeout(ms);
  const shell = () => p.locator(".game-shell");
  const attr = (k) => shell().getAttribute("data-" + k);
  const dialogueTitle = async () =>
    (await p.locator(".village-dialogue").count())
      ? await p
          .locator(".village-dialogue h2, .village-dialogue [id]")
          .first()
          .innerText()
          .catch(() => "")
      : null;
  const choose = async (re) => {
    const btn = p.locator(".village-choices button").filter({ hasText: re });
    await btn.first().waitFor({ timeout: 8000 });
    await btn.first().click();
    await pause(250);
  };
  const waitStage = (stages, ms = 20000) =>
    p.waitForFunction(
      (s) =>
        s.includes(document.querySelector(".game-shell")?.dataset.tourStage),
      stages,
      { timeout: ms },
    );
  async function point(x, y) {
    const v = await shell().evaluate((e) => ({
      x: +e.dataset.cameraX,
      y: +e.dataset.cameraY,
      z: +e.dataset.zoom,
    }));
    return { x: (x - v.x) * v.z, y: (y - v.y) * v.z };
  }
  try {
    await p.goto(base + "/play/");
    await p.evaluate(() => {
      localStorage.setItem("jalal-town-welcome-v3", "yes");
      localStorage.setItem(
        "jalal-town-settings",
        JSON.stringify({
          speed: 1.4,
          zoom: 1,
          time: "day",
          footsteps: false,
          reduced: true,
        }),
      );
    });
    await p.reload();
    await p.getByRole("button", { name: /Let’s explore/ }).click();
    await p.locator(".village-game.is-ready").waitFor({ timeout: 60000 });
    await pause(800);
    await p.getByRole("button", { name: "Take a tour", exact: true }).click();
    for (let i = 0; i < stops; i++) {
      // Outdoors: follow Jalal to the door.
      for (let tries = 0; tries < 15; tries++) {
        if ((await attr("tour-stage")) === "arrived") break;
        if (await p.locator(".village-dialogue").count())
          await p.keyboard.press("Escape");
        const follow = p.getByRole("button", {
          name: "Follow Jalal",
          exact: true,
        });
        if (await follow.count()) await follow.click();
        await waitStage(["arrived", "waiting"]).catch(() => {});
      }
      if ((await attr("tour-stage")) !== "arrived")
        throw Error("Never arrived at stop " + (i + 1));
      await choose(/Enter this building/);
      await p.waitForFunction(
        () => document.querySelector(".game-shell")?.dataset.room !== "town",
        {},
        { timeout: 10000 },
      );
      const room = await attr("room");
      await waitStage(["room-intro"]);
      await choose(/Show me|Let’s look/);
      let beats = 0;
      for (let k = 0; k < 6; k++) {
        await waitStage(["to-beat", "room-free"]);
        if ((await attr("tour-stage")) === "room-free") break;
        // wait until Jalal stops walking, then walk next to him
        let last = "";
        for (let t = 0; t < 30; t++) {
          const now = (await attr("guide-x")) + "," + (await attr("guide-y"));
          if (now === last) break;
          last = now;
          await pause(250);
        }
        const gx = +(await attr("guide-x")),
          gy = +(await attr("guide-y"));
        await p
          .locator(".game-canvas canvas")
          .click({ position: await point(gx - 30, gy - 30) });
        await waitStage(["beat"], 15000);
        const beat = await attr("tour-beat");
        if (!beat) throw Error("Beat without exhibit id in " + room);
        await p.locator(".village-dialogue").waitFor();
        if (!/highlight/i.test(await p.locator(".village-dialogue").innerText()))
          throw Error("Beat dialogue missing highlight title");
        await p.screenshot({
          path: `${out}/stop${i + 1}-${room}-beat${k + 1}.png`,
        });
        await choose(/Next highlight|Got it/);
        beats++;
        // Early exit on the first stop: must pause at the door, not skip the stop.
        if (i === 0 && k === 0 && process.env.QA_EARLY_EXIT !== "0") {
          const expectBeat = 1;
          await waitStage(["to-beat"]);
          await p.getByRole("button", { name: /Outside/ }).click();
          await p.waitForFunction(
            () => document.querySelector(".game-shell")?.dataset.room === "town",
            {},
            { timeout: 10000 },
          );
          await waitStage(["arrived"], 8000);
          if (+(await attr("tour-index")) !== 0)
            throw Error("Early exit advanced the tour");
          await p.locator(".village-dialogue").waitFor({ timeout: 8000 });
          const t = await p.locator(".village-dialogue").innerText();
          if (!/highlight/i.test(t) || !/Go back inside/.test(t))
            throw Error("No go-back-inside offer after early exit: " + t);
          await p.screenshot({ path: `${out}/stop1-early-exit.png` });
          await choose(/Go back inside/);
          await p.waitForFunction(
            () => document.querySelector(".game-shell")?.dataset.room !== "town",
            {},
            { timeout: 10000 },
          );
          await waitStage(["room-intro"]);
          const intro = await p.locator(".village-dialogue").innerText();
          if (!/highlight 2 of/i.test(intro))
            throw Error("Re-entry intro does not resume at highlight 2");
          await choose(/Continue/);
          await waitStage(["to-beat"]);
          if (+(await attr("tour-beat-index")) !== expectBeat &&
              (await attr("tour-beat-index")) !== null)
            throw Error("Re-entry did not resume at highlight 2");
          console.log("PASS early exit pauses at the door; re-entry resumes at highlight 2");
        }
      }
      await waitStage(["room-free"]);
      await p.locator(".village-dialogue").waitFor();
      console.log(
        `PASS stop ${i + 1} ${room}: intro + ${beats} highlights + free look`,
      );
      await choose(/Next stop|Finish the tour/);
      await p.waitForFunction(
        () => document.querySelector(".game-shell")?.dataset.room === "town",
        {},
        { timeout: 10000 },
      );
      if (i < 20 && +(await attr("tour-index")) !== i + 1)
        throw Error("Tour did not advance after stop " + (i + 1));
    }
    await p.screenshot({ path: `${out}/after-${stops}-stops.png` });
    if (stops >= 21) {
      await waitStage(["complete"]);
      console.log("PASS tour complete");
    } else
      console.log(
        "PASS advanced to stop",
        stops + 1,
        "stage",
        await attr("tour-stage"),
      );
    if (stops < 21 && process.env.QA_RESUME !== "0") {
      await p.getByRole("button", { name: "Leave tour", exact: true }).click();
      await pause(300);
      if (!(await p.getByRole("button", { name: /Resume tour/ }).count()))
        throw Error("Ribbon does not offer Resume after leaving");
      await p.reload();
      const explore = p.getByRole("button", { name: /Let’s explore/ });
      await explore.or(p.locator(".village-game.is-ready")).first().waitFor({ timeout: 60000 });
      if (await explore.count()) await explore.click();
      await p.locator(".village-game.is-ready").waitFor({ timeout: 60000 });
      await p.locator(".village-dialogue").waitFor({ timeout: 8000 });
      if (!/welcome back/i.test(await p.locator(".village-dialogue").innerText()))
        throw Error("No welcome-back resume offer after reload");
      await p.screenshot({ path: `${out}/resume-offer.png` });
      await choose(/Resume at/);
      await waitStage(["leading", "waiting", "arrived"]);
      if (+(await attr("tour-index")) !== stops)
        throw Error("Resumed at wrong stop " + (await attr("tour-index")));
      console.log("PASS leave → reload → resume at stop", stops + 1);
    }
    if (errors.length) throw Error(errors.join("\n"));
  } catch (e) {
    console.error(e);
    await p.screenshot({ path: out + "/failure.png" });
    process.exitCode = 1;
  } finally {
    await b.close();
  }
})();
