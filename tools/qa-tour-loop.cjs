const { chromium } = require("@playwright/test"),
  fs = require("fs");
const base = process.env.QA_BASE_URL || "http://localhost:3001",
  out = process.env.QA_OUTPUT || "test-results/tour-loop";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/local/bin/chromium",
    args: ["--no-sandbox"],
  });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const pause = (ms) => p.waitForTimeout(ms),
    close = async () => {
      if (await p.locator(".village-dialogue").count()) {
        await p.keyboard.press("Escape");
        await pause(250);
      }
    };
  async function point(x, y) {
    const v = await p
      .locator(".game-shell")
      .evaluate((e) => ({
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
          speed: 1.2,
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
    await p
      .locator(".game-canvas canvas")
      .click({ position: await point(430, 455) });
    await pause(1600);
    await p
      .locator(".game-canvas canvas")
      .click({ position: await point(430, 429), button: "right" });
    await p.locator(".village-dialogue").waitFor();
    await p.getByRole("button", { name: "Greet Mina", exact: true }).click();
    if (
      !(await p.locator(".village-spoken").getAttribute("aria-label")).includes(
        "Lovely",
      )
    )
      throw Error("NPC greeting missing");
    await close();
    console.log(
      "PASS Right-click NPC conversation choices and prepared greeting",
    );
    await p.locator(".game-canvas canvas").focus();
    const before = await p.locator(".game-shell").getAttribute("data-x");
    await p.keyboard.down("d");
    await pause(600);
    await p.keyboard.up("d");
    if ((await p.locator(".game-shell").getAttribute("data-x")) === before)
      throw Error("Keyboard movement failed");
    await p.keyboard.press("q");
    await pause(1200);
    if (
      (await p.locator(".game-shell").getAttribute("data-sitting")) !== "true"
    )
      throw Error("Keyboard sitting failed");
    await p.keyboard.press("q");
    await pause(300);
    console.log("PASS Keyboard movement and persistent sitting");
    await p.getByRole("button", { name: "Take a tour", exact: true }).click();
    for (let i = 0; i < 21; i++) {
      for (let tries = 0; tries < 12; tries++) {
        await close();
        const stage = await p
          .locator(".game-shell")
          .getAttribute("data-tour-stage");
        if (stage === "stop") break;
        const follow = p.getByRole("button", {
          name: "Follow Jalal",
          exact: true,
        });
        if (await follow.count()) await follow.click();
        await p.waitForFunction(
          () =>
            ["stop", "waiting"].includes(
              document
                .querySelector(".game-shell")
                ?.getAttribute("data-tour-stage"),
            ),
          {},
          { timeout: 15000 },
        );
      }
      if (
        (await p.locator(".game-shell").getAttribute("data-tour-stage")) !==
        "stop"
      )
        throw Error("Tour failed to arrive at stop " + (i + 1));
      await close();
      if (
        (await p.locator(".game-shell").getAttribute("data-guide-visible")) !==
        "true"
      )
        throw Error("Guide offscreen at stop " + (i + 1));
      console.log("PASS Guided stop", i + 1);
      if (i === 4)
        await p.screenshot({ path: out + "/guided-research-stop.png" });
      await p
        .getByRole("button", {
          name: i === 20 ? "Finish tour" : "Next stop →",
          exact: true,
        })
        .click();
      await pause(300);
    }
    await p.locator('.game-shell[data-tour-stage="complete"]').waitFor();
    await p.screenshot({ path: out + "/tour-complete.png" });
    await close();
    await p.getByRole("button", { name: "Tour again", exact: true }).click();
    await pause(500);
    if (
      (await p.locator(".game-shell").getAttribute("data-tour-stage")) ===
      "complete"
    )
      throw Error("Tour restart failed");
    await close();
    await p.getByRole("button", { name: "Leave tour", exact: true }).click();
    console.log("PASS Tour completion, free mode and restart");
    if (errors.length) throw Error(errors.join("\n"));
  } catch (e) {
    console.error(e);
    await p.screenshot({ path: out + "/failure.png" });
    process.exitCode = 1;
  } finally {
    await b.close();
  }
})();
