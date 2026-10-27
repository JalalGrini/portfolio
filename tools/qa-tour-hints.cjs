// Non-blocking arrival hints: desktop + 390px, normal + reduced motion.
const { chromium } = require("@playwright/test");
const fs = require("fs");
const base = process.env.QA_BASE_URL || "http://localhost:3001";
const out = process.env.QA_OUTPUT || "test-results/tour-hints";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/local/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const width of [1440, 390]) {
      const p = await browser.newPage({
        viewport: { width, height: width === 390 ? 844 : 900 },
      });
      const errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(base + "/play/");
      await p.evaluate((reduced) => {
        localStorage.setItem("jalal-town-welcome-v3", "yes");
        localStorage.setItem(
          "jalal-town-settings",
          JSON.stringify({
            speed: 1.2,
            zoom: 1,
            time: "day",
            footsteps: false,
            reduced,
          }),
        );
      }, width === 390);
      await p.reload();
      await p.getByRole("button", { name: /Let’s explore/ }).click();
      await p.locator(".village-game.is-ready").waitFor({ timeout: 60000 });
      await p.waitForTimeout(800);
      await p.getByRole("button", { name: "Take a tour", exact: true }).click();
      for (let i = 0; i < 10; i++) {
        if (
          (await p.locator(".game-shell").getAttribute("data-tour-stage")) ===
          "arrived"
        )
          break;
        const follow = p.getByRole("button", {
          name: "Follow Jalal",
          exact: true,
        });
        if (await follow.count()) await follow.click();
        await p
          .waitForFunction(
            () =>
              ["arrived", "waiting"].includes(
                document.querySelector(".game-shell")?.dataset.tourStage,
              ),
            null,
            { timeout: 25000 },
          )
          .catch(() => {});
      }
      if (
        (await p.locator(".game-shell").getAttribute("data-tour-stage")) !==
        "arrived"
      )
        throw Error("Did not arrive");
      if (await p.locator(".village-dialogue").count())
        throw Error("Hint blocked the game");
      const overflow = await p
        .locator(".tour-ribbon,.tour-actions button")
        .evaluateAll((es) =>
          es.some((e) => {
            const r = e.getBoundingClientRect();
            return r.left < 0 || r.right > innerWidth;
          }),
        );
      if (overflow) throw Error("Ribbon actions overflow at " + width);
      await p.waitForTimeout(300);
      await p.screenshot({ path: `${out}/arrival-${width}.png` });
      const x = +(await p.locator(".game-shell").getAttribute("data-x"));
      await p.keyboard.down("ArrowLeft");
      await p.waitForTimeout(350);
      await p.keyboard.up("ArrowLeft");
      await p.waitForTimeout(150);
      const after = +(await p.locator(".game-shell").getAttribute("data-x"));
      if (!Number.isFinite(x) || !Number.isFinite(after) || after === x)
        throw Error("Player cannot move during arrival hint");
      if (errors.length) throw Error(errors.join("\n"));
      console.log(
        `PASS ${width}px: arrival is non-blocking, movement works, ribbon fits`,
      );
      await p.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
