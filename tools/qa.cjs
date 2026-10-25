const base = process.env.QA_BASE_URL || "http://localhost:3000";
/* Run after `npm run build` with a static server on localhost:3000.
   CHROMIUM_PATH can override the system Chromium location. */
const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const out = process.env.QA_OUTPUT || path.resolve("test-results");
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.CHROMIUM_PATH ||
      (fs.existsSync("/usr/local/bin/chromium")
        ? "/usr/local/bin/chromium"
        : undefined),
    args: ["--no-sandbox"],
  });
  const results = { checks: [], errors: [], httpErrors: [] };
  async function check(label, fn) {
    try {
      await fn();
      results.checks.push({ label, passed: true });
      console.log("PASS", label);
    } catch (e) {
      if (!page.isClosed())
        for (const k of ["w", "a", "s", "d", "ArrowUp"])
          await page.keyboard.up(k).catch(() => {});
      results.checks.push({ label, passed: false, error: e.message });
      console.log("FAIL", label, e.message.slice(0, 500));
    }
  }
  async function setup(viewport, reducedMotion = "reduce") {
    const context = await browser.newContext({
      viewport,
      reducedMotion,
      colorScheme: "dark",
    });
    const p = await context.newPage();
    p.setDefaultTimeout(8000);
    p.on("pageerror", (e) => results.errors.push(e.message));
    p.on("response", (r) => {
      if (r.status() >= 400)
        results.httpErrors.push({ url: r.url(), status: r.status() });
    });
    return p;
  }
  const page = await setup({ width: 1440, height: 1000 });
  for (const [route, name] of [
    ["/", "landing"],
    ["/portfolio/", "portfolio"],
    ["/credits/", "credits"],
    ["/play/", "creator"],
  ]) {
    await check(
      `Desktop ${name} renders without horizontal overflow`,
      async () => {
        await page.goto(base + "" + route);
        await page.waitForTimeout(700);
        await page.screenshot({ path: path.join(out, `${name}-desktop.png`) });
        if (
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          )
        )
          throw Error("horizontal overflow");
      },
    );
  }
  await check(
    "Creator customization supports female outfits, glasses and persistence",
    async () => {
      await page
        .getByRole("button", { name: "Body: Female", exact: true })
        .click();
      await page.getByRole("tab", { name: "Hair", exact: true }).click();
      await page
        .getByRole("button", { name: "Hairstyle: Long", exact: true })
        .click();
      await page.getByRole("tab", { name: "Outfit", exact: true }).click();
      await page
        .getByRole("button", { name: "Top: Cardigan", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Bottom: Leggings", exact: true })
        .click();
      await page.getByRole("tab", { name: "Details", exact: true }).click();
      await page
        .getByRole("button", { name: "Glasses: Round", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Footwear: Boots", exact: true })
        .click();
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(out, "creator-custom-desktop.png"),
      });
      await page.getByRole("button", { name: /Let’s explore/ }).click();
      await page.locator(".location-card").waitFor({ timeout: 30000 });
      if (
        !(await page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("career-town-character")).body ===
            "female",
        ))
      )
        throw Error("appearance not stored");
    },
  );
  await check("Town loads a real WebGL/canvas scene", async () => {
    await page.locator(".game-canvas canvas").waitFor();
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(out, "town-desktop.png") });
    if (await page.locator(".game-loading[role=alert]").count())
      throw Error("game load alert");
  });
  await check("Keyboard movement and NPC dialogue work", async () => {
    await page.locator(".game-canvas canvas").focus();
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => parseFloat(document.querySelector(".game-shell").dataset.y) <= 66,
    );
    await page.keyboard.up("w");
    await page.keyboard.down("d");
    await page.waitForFunction(
      () => parseFloat(document.querySelector(".game-shell").dataset.x) >= 54.3,
    );
    await page.keyboard.up("d");
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => parseFloat(document.querySelector(".game-shell").dataset.y) <= 61,
    );
    await page.keyboard.up("w");
    await page
      .getByRole("button", { name: /Talk to Jalal/ })
      .waitFor({ timeout: 5000 });
    await page.getByRole("button", { name: /Talk to Jalal/ }).click();
    await page.locator("dialog[open]").waitFor();
    await page.screenshot({ path: path.join(out, "dialogue-desktop.png") });
    await page.getByRole("button", { name: /Keep exploring/ }).click();
  });
  await check(
    "Map pathfinding reaches a door; room entry and field notes work",
    async () => {
      await page
        .getByRole("button", { name: "Open town map and discovery journal" })
        .click();
      await page.screenshot({ path: path.join(out, "map-desktop.png") });
      await page
        .locator(".journal-list>div")
        .first()
        .getByRole("button", { name: "Walk here →" })
        .click();
      await page
        .getByRole("button", { name: /Enter · About me/ })
        .waitFor({ timeout: 30000 });
      await page.getByRole("button", { name: /Enter · About me/ }).click();
      await page
        .locator(".location-card h1")
        .filter({ hasText: "The Green House" })
        .waitFor();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(out, "interior-desktop.png") });
      await page.locator(".game-canvas canvas").focus();
      await page.keyboard.down("w");
      await page
        .getByRole("button", { name: /Read the field notes/ })
        .waitFor({ timeout: 8000 });
      await page.keyboard.up("w");
      await page.getByRole("button", { name: /Read the field notes/ }).click();
      await page.locator(".building-content").waitFor();
      await page.screenshot({ path: path.join(out, "fieldnotes-desktop.png") });
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Back outside ↵" }).click();
      await page
        .locator(".location-card h1")
        .filter({ hasText: "Founders’ Square" })
        .waitFor();
    },
  );
  await page.goto(base + "/portfolio/");
  await check(
    "All 16 projects, search, filters and project detail are available",
    async () => {
      if ((await page.locator(".project-card").count()) !== 16)
        throw Error("project count");
      await page.getByRole("button", { name: "Research", exact: true }).click();
      if ((await page.locator(".project-card").count()) !== 3)
        throw Error("research filter");
      await page.getByRole("searchbox").fill("Sentinel");
      await page.locator(".project-card").click();
      await page.getByRole("dialog").waitFor();
      if (
        !(await page.locator(".project-detail").innerText())
          .toLowerCase()
          .includes("design stage")
      )
        throw Error("missing research status");
      await page.screenshot({
        path: path.join(out, "project-detail-desktop.png"),
      });
      await page.keyboard.press("Escape");
      await page.getByRole("searchbox").fill("definitely-no-match");
      await page.locator(".empty-state").waitFor();
      await page.screenshot({ path: path.join(out, "empty-desktop.png") });
      await page.getByRole("button", { name: "Show all projects" }).click();
      await page.locator("#work").scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(out, "work-desktop.png") });
      await page.locator("#contact").scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(out, "contact-desktop.png") });
      if (await page.locator('a[href*="3rbextreme"]').count())
        throw Error("forbidden business-site link");
    },
  );
  await page.close();
  const mobile = await setup({ width: 390, height: 844 });
  for (const [route, name] of [
    ["/", "landing"],
    ["/portfolio/", "portfolio"],
    ["/credits/", "credits"],
    ["/play/", "creator"],
  ])
    await check(
      `Mobile ${name} renders without horizontal overflow`,
      async () => {
        await mobile.goto(base + "" + route);
        await mobile.waitForTimeout(700);
        await mobile.screenshot({ path: path.join(out, `${name}-mobile.png`) });
        if (
          await mobile.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          )
        )
          throw Error("horizontal overflow");
        if (name === "creator") {
          await mobile.locator(".creator-actions").scrollIntoViewIfNeeded();
          await mobile.screenshot({
            path: path.join(out, "creator-controls-mobile.png"),
          });
        }
      },
    );
  await check("Mobile town and touch movement work", async () => {
    await mobile.getByRole("button", { name: /Let’s explore/ }).click();
    await mobile.locator(".location-card").waitFor({ timeout: 30000 });
    await mobile.waitForTimeout(800);
    await mobile.screenshot({ path: path.join(out, "town-mobile.png") });
    const before = await mobile
      .locator(".minimap>span:not(.minimap-caption)")
      .getAttribute("style");
    const b = await mobile
      .getByRole("button", { name: "Walk up", exact: true })
      .boundingBox();
    await mobile.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await mobile.mouse.down();
    await mobile.waitForTimeout(900);
    await mobile.mouse.up();
    const after = await mobile
      .locator(".minimap>span:not(.minimap-caption)")
      .getAttribute("style");
    if (before === after) throw Error("position unchanged");
    await mobile
      .getByRole("button", { name: "Open town map and discovery journal" })
      .click();
    await mobile.screenshot({ path: path.join(out, "map-mobile.png") });
  });
  await mobile.close();
  await browser.close();
  fs.writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
  process.exit(
    results.checks.some((c) => !c.passed) ||
      results.errors.length ||
      results.httpErrors.length
      ? 1
      : 0,
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
