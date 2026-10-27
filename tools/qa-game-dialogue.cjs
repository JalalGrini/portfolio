// Normal-motion keyboard/typewriter / native-dialog / frame checks.
const { chromium } = require("@playwright/test"),
  fs = require("fs");
const base = process.env.QA_BASE_URL || "http://localhost:3001",
  out = process.env.QA_OUTPUT || "test-results/game-dialogue";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/local/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const width of [1440, 390]) {
      const p = await b.newPage({
          viewport: { width, height: width === 390 ? 844 : 900 },
        }),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(base + "/play/");
      await p.evaluate(() => {
        localStorage.setItem("jalal-town-welcome-v3", "yes");
        localStorage.setItem(
          "jalal-town-settings",
          JSON.stringify({
            speed: 1.2,
            zoom: 1,
            time: "day",
            reduced: false,
            instantText: false,
            footsteps: false,
          }),
        );
      });
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
        const f = p.getByRole("button", { name: "Follow Jalal", exact: true });
        if (await f.count()) await f.click();
        await p.waitForTimeout(1500);
      }
      await p.getByRole("button", { name: "Enter →", exact: true }).click();
      await p.locator(".village-dialogue").waitFor({ timeout: 15000 });
      const spoken = p.locator(".village-spoken");
      await spoken.focus();
      await p.keyboard.down("Enter");
      await p.keyboard.down("Enter");
      await p.keyboard.up("Enter");
      await p.waitForTimeout(100);
      if (
        (await p.locator(".game-shell").getAttribute("data-tour-stage")) !==
        "room-intro"
      )
        throw Error("Held confirm skipped intro");
      const full = await spoken.getAttribute("aria-label");
      if ((await spoken.locator("p").innerText()).replace("▌", "") !== full)
        throw Error("Confirm did not reveal text");
      await p.screenshot({ path: `${out}/portrait-${width}.png` });
      const modal = await p.locator(".village-dialogue").boundingBox();
      if (modal.height > (width === 390 ? 590 : 360))
        throw Error("Panel hides too much world");
      if (
        await p
          .locator(".village-dialogue")
          .evaluate((e) => e.scrollWidth > e.clientWidth + 1)
      )
        throw Error("Panel horizontal overflow");
      if (width > 700) {
        const pic = await p.locator(".village-dialogue figure").boundingBox(),
          body = await p.locator(".village-dialogue-body").boundingBox();
        if (pic.x < body.x + body.width - 1)
          throw Error("Portrait is not on the right");
      }
      await p.keyboard.press("Escape");
      await p.locator(".village-dialogue").waitFor({ state: "hidden" });
      if (
        (await p.locator(".game-shell").getAttribute("data-tour-stage")) !==
        "room-intro"
      )
        throw Error("Escape acknowledged intro");
      await p
        .getByRole("button", { name: "Read message", exact: true })
        .click();
      await p.locator(".village-dialogue").waitFor();
      await p
        .getByRole("button", { name: "Show full message ↓", exact: true })
        .click({ timeout: 2000 })
        .catch(() => {});
      const until = Date.now() + 12000;
      while (
        Date.now() < until &&
        (await p.locator(".village-choices button").count()) < 2
      ) {
        const reveal = p.getByRole("button", {
          name: "Show full message ↓",
          exact: true,
        });
        const reading = p.getByRole("button", {
          name: "Continue reading →",
          exact: true,
        });
        if (await reveal.count())
          await reveal.click({ timeout: 700 }).catch(() => {});
        else if (await reading.count()) await reading.click();
        else await p.waitForTimeout(100);
      }
      const choices = p.locator(".village-choices button");
      await choices.first().focus();
      await p.keyboard.press("ArrowDown");
      if (!(await choices.nth(1).evaluate((e) => e === document.activeElement)))
        throw Error("Arrow choice navigation failed");
      await p.keyboard.press("ArrowUp");
      await p.keyboard.press("Enter");
      await p.waitForFunction(
        () =>
          document.querySelector(".game-shell")?.dataset.tourStage ===
          "to-beat",
      );
      // Save and restore instant text independently from reduced motion.
      await p
        .getByRole("button", { name: "Town settings", exact: true })
        .click();
      await p.getByLabel("Instant dialogue text").check();
      await p.keyboard.press("Escape");
      await p.locator(".village-settings").waitFor({ state: "hidden" });
      if (
        !(await p.evaluate(
          () =>
            JSON.parse(localStorage.getItem("jalal-town-settings")).instantText,
        ))
      )
        throw Error("Instant text did not persist");
      if (errors.length) throw Error(errors.join("\n"));
      console.log(
        `PASS ${width}px: portrait frame, reveal/held-key safety, arrows, Escape/reopen, instant preference`,
      );
      await p.close();
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
