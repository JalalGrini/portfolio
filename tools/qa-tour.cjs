const { chromium } = require("@playwright/test"),
  fs = require("fs");
const out = process.env.QA_OUTPUT || "test-results/tour-qa",
  base = process.env.QA_BASE_URL || "http://localhost:3001";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/local/bin/chromium",
    args: ["--no-sandbox"],
  });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("response", (r) => {
    if (r.status() >= 400) errors.push(r.status() + " " + r.url());
  });
  try {
    await p.goto(base + "/play/");
    await p.getByRole("button", { name: /Let’s explore/ }).waitFor();
    await p.screenshot({ path: out + "/studio-desktop.png" });
    console.log(
      "STUDIO",
      await p.evaluate(() => ({
        page: document.documentElement.scrollHeight,
        viewport: innerHeight,
        button: document
          .querySelector(".creator-actions")
          ?.getBoundingClientRect().bottom,
      })),
    );
    await p.getByRole("button", { name: /Let’s explore/ }).click();
    await p.locator(".village-dialogue").waitFor({ timeout: 90000 });
    await p.waitForTimeout(1800);
    await p.screenshot({ path: out + "/welcome-desktop.png" });
    await p
      .getByRole("button", { name: "Show full message ↓" })
      .click({ timeout: 700 })
      .catch(() => {});
    await p
      .getByRole("button", { name: "Take Jalal’s guided tour", exact: true })
      .click();
    await p.waitForTimeout(2400);
    await p.screenshot({ path: out + "/tour-first-stop.png" });
    console.log(
      "TOUR",
      await p.locator(".game-shell").getAttribute("data-tour-stage"),
    );
    const dlg = p.locator(".village-dialogue");
    if (await dlg.count()) {
      await p.waitForTimeout(2500);
      const skip = p.getByRole("button", { name: "Show full message ↓" });
      await skip.click({ timeout: 700 }).catch(() => {});
      const enter = p.getByRole("button", {
        name: "Enter this building",
        exact: true,
      });
      if (await enter.count()) await enter.click();
      else await p.keyboard.press("Escape");
    }
    if ((await p.locator(".game-shell").getAttribute("data-room")) === "town") {
      await p
        .locator(".game-canvas canvas")
        .click({ position: { x: 720, y: 500 } });
      await p.keyboard.down("w");
      await p.waitForTimeout(400);
      await p.keyboard.up("w");
      await p.keyboard.press("e");
    }
    await p
      .locator('.game-shell[data-room="about"]')
      .waitFor({ timeout: 10000 });
    await p.waitForTimeout(1800);
    await p.screenshot({ path: out + "/about-interior.png" });
    console.log("PASS Tour enters first building");
    if (await p.locator(".village-dialogue").count()) {
      await p.keyboard.press("Escape");
      await p.waitForTimeout(250);
    }
    if (
      (await p.locator(".game-shell").getAttribute("data-sitting")) !== "true"
    )
      await p.getByRole("button", { name: /^Sit/ }).click();
    await p.waitForTimeout(1600);
    if (
      (await p.locator(".game-shell").getAttribute("data-sitting")) !== "true"
    )
      throw Error("Seat not stable");
    await p.waitForTimeout(2000);
    if (
      (await p.locator(".game-shell").getAttribute("data-sitting")) !== "true"
    )
      throw Error("Seat restarted");
    await p.getByRole("button", { name: /^Stand/ }).click();
    await p.waitForTimeout(350);
    console.log("PASS Sitting holds until standing");
    await p.getByRole("button", { name: "Next stop →", exact: true }).click();
    await p.locator('.game-shell[data-room="town"]').waitFor();
    await p.waitForTimeout(1400);
    if (await p.locator(".village-dialogue").count()) {
      await p.keyboard.press("Escape");
      await p.waitForTimeout(250);
    }
    await p.getByRole("button", { name: "Leave tour", exact: true }).click();
    await p.getByRole("button", { name: "Open town map", exact: true }).click();
    await p.waitForTimeout(300);
    await p
      .locator('select[aria-label="Choose a building"]')
      .selectOption("project-sentinel");
    await p.screenshot({ path: out + "/atlas-desktop.png" });
    console.log(
      "PASS Atlas lists",
      await p.locator('select[aria-label="Choose a building"] option').count(),
      "buildings",
    );
    await p.keyboard.press("Escape");
    await p.waitForTimeout(250);
    await p.getByRole("button", { name: "Town settings" }).click();
    await p.screenshot({ path: out + "/settings-desktop.png" });
    await p.keyboard.press("Escape");
    await p.waitForTimeout(300);
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForTimeout(900);
    await p.screenshot({ path: out + "/game-mobile.png" });
    console.log(
      "MOBILE",
      await p.evaluate(() => ({
        height: document.documentElement.scrollHeight,
        width: document.documentElement.scrollWidth,
        viewport: innerHeight,
      })),
    );
    await p.getByRole("button", { name: "Help and controls" }).click();
    await p.screenshot({ path: out + "/help-mobile.png" });
    await p.keyboard.press("Escape");
    await p.waitForTimeout(250);
    await p.getByRole("button", { name: "Town settings" }).click();
    await p
      .getByRole("button", { name: "Change visitor appearance →" })
      .click();
    await p.waitForTimeout(900);
    await p.screenshot({ path: out + "/studio-mobile.png" });
    console.log(
      "MOBILE STUDIO",
      await p.evaluate(() => ({
        height: document.documentElement.scrollHeight,
        viewport: innerHeight,
        start: [...document.querySelectorAll("button")]
          .find((x) => x.textContent.includes("Let’s explore"))
          ?.getBoundingClientRect()
          .toJSON(),
      })),
    );
    if (errors.length) throw Error(errors.join("\n"));
    console.log("PASS No runtime or asset errors");
  } catch (e) {
    await p.screenshot({ path: out + "/failure.png" });
    console.error(e);
    process.exitCode = 1;
  } finally {
    await b.close();
  }
})();
