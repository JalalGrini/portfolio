const { chromium } = require("@playwright/test"),
  fs = require("fs");
const base = process.env.QA_BASE_URL || "http://localhost:3001",
  out = process.env.QA_OUTPUT || "test-results/town-deep";
fs.mkdirSync(out, { recursive: true });
const places = JSON.parse(
  fs.readFileSync("test-results/tour-catalog.json", "utf8"),
);
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/local/bin/chromium",
    args: ["--no-sandbox"],
  });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("response", (r) => {
    if (r.status() >= 400) errors.push(r.status() + " " + r.url());
  });
  const pause = (ms) => p.waitForTimeout(ms);
  const skip = () =>
    p
      .getByRole("button", { name: "Show full message ↓" })
      .click({ timeout: 500 })
      .catch(() => {});
  const close = async () => {
    if (await p.locator(".village-dialogue").count()) {
      await p.keyboard.press("Escape");
      await pause(250);
    }
  };
  const read = () =>
    p.locator(".game-shell").evaluate((el) => ({
      room: el.dataset.room,
      x: +el.dataset.x,
      y: +el.dataset.y,
      cx: +el.dataset.cameraX,
      cy: +el.dataset.cameraY,
      z: +el.dataset.zoom,
      guide: el.dataset.guideVisible,
    }));
  try {
    await p.goto(base + "/play/");
    await p.evaluate(() => {
      localStorage.setItem("jalal-town-welcome-v3", "yes");
      localStorage.setItem(
        "jalal-town-settings",
        JSON.stringify({
          speed: 1.2,
          zoom: 0.85,
          time: "day",
          footsteps: false,
          reduced: true,
        }),
      );
    });
    await p.reload();
    await p.getByRole("button", { name: /Let’s explore/ }).click();
    await p.locator(".village-game.is-ready").waitFor({ timeout: 90000 });
    await pause(500);
    for (const place of places) {
      await p
        .getByRole("button", { name: "Open town map", exact: true })
        .click();
      await p.getByLabel("Choose a building").selectOption(place.id);
      await p.getByRole("button", { name: "Walk here →", exact: true }).click();
      await p.locator('.game-shell[data-room="town"]').waitFor();
      await p.keyboard.down("Shift");
      const door = p.getByRole("button", {
        name: "E Enter · " + place.short + " →",
        exact: true,
      });
      await door.waitFor({ timeout: 35000 });
      await p.keyboard.up("Shift");
      await door.click();
      await p.locator(`.game-shell[data-room="${place.id}"]`).waitFor();
      await pause(400);
      await p.screenshot({ path: out + "/" + place.id + "-room.png" });
      const samples =
        process.env.QA_SCREENSHOTS_ONLY === "1"
          ? []
          : process.env.QA_ALL_OBJECTS === "1"
            ? place.stations
            : [place.stations[0], place.stations[place.stations.length - 1]];
      for (const station of samples) {
        const data = await read();
        const box = await p.locator(".game-canvas canvas").boundingBox();
        const x = (station.x + station.w / 2 - data.cx) * data.z,
          y = (station.y + station.h / 2 - data.cy) * data.z;
        await p.locator(".game-canvas canvas").click({
          position: {
            x: Math.max(5, Math.min(box.width - 5, x)),
            y: Math.max(5, Math.min(box.height - 5, y)),
          },
          force: true,
        });
        await p.locator(".village-dialogue").waitFor({ timeout: 10000 });
        await skip();
        const body = await p
          .locator(".village-spoken")
          .getAttribute("aria-label");
        if (body !== station.text)
          throw Error("Exhibit mismatch " + place.id + " " + station.id);
        if (
          place.projectId &&
          (await p.locator(".village-dialogue .project-card").count())
        )
          throw Error("Cross-project card");
        if (
          station.id === "overview" &&
          ["project-sentinel", "project-recipe"].includes(place.id)
        )
          await p.screenshot({ path: out + "/" + place.id + "-dialogue.png" });
        await close();
      }
      console.log(
        "PASS",
        place.id,
        "real door walking and",
        samples.length,
        "isolated object dialogues",
      );
      await p.getByRole("button", { name: "Outside ↵", exact: true }).click();
      await p.locator('.game-shell[data-room="town"]').waitFor();
      await pause(150);
    }
    // Restart on the final street: guide must wait before leaving the screen.
    await p.getByRole("button", { name: "Take a tour", exact: true }).click();
    await p
      .locator('.game-shell[data-tour-stage="waiting"]')
      .waitFor({ timeout: 12000 });
    await skip();
    await p.screenshot({ path: out + "/guide-waits.png" });
    if ((await read()).guide !== "true") throw Error("Guide escaped viewport");
    await close();
    await p.getByRole("button", { name: "Follow Jalal", exact: true }).click();
    await pause(2000);
    if ((await read()).guide !== "true")
      throw Error("Guide lost during follow");
    await close();
    await p.getByRole("button", { name: "Leave tour", exact: true }).click();
    console.log("PASS Tour waiting, guide visibility, rejoin and leave");
    if (errors.length) throw Error(errors.join("\n"));
    console.log("PASS No uncaught errors or failed assets");
  } catch (e) {
    console.error(e);
    await p.screenshot({ path: out + "/failure.png" });
    process.exitCode = 1;
  } finally {
    await b.close();
  }
})();
