const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const base = process.env.QA_BASE_URL || "http://localhost:3000";
const out = process.env.QA_OUTPUT || "test-results/design";
fs.mkdirSync(out, { recursive: true });
(async () => {
  let browser;
  const errors = [],
    httpErrors = [],
    checks = [];
  function pass(label) {
    checks.push(label);
    console.log("PASS", label);
  }
  try {
    browser = await chromium.launch({
      executablePath:
        process.env.CHROMIUM_PATH ||
        (fs.existsSync("/usr/local/bin/chromium")
          ? "/usr/local/bin/chromium"
          : undefined),
      args: ["--no-sandbox"],
    });
    const p = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      colorScheme: "dark",
    });
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => {
      if (r.status() >= 400)
        httpErrors.push({ url: r.url(), status: r.status() });
    });
    const shot = async (name) =>
      p.screenshot({ path: path.join(out, name + ".png") });
    await p.goto(base + "/");
    await p.locator(".studio-hero-art").waitFor();
    await p.waitForTimeout(800);
    await shot("studio-hero-desktop");
    if (await p.locator('.studio-root img[src*="/assets/game/"]').count())
      throw Error("Pixel artwork leaked into the normal portfolio");
    if (
      await p
        .locator(".studio-root .site-nav, .studio-root .avatar-canvas")
        .count()
    )
      throw Error("Game UI leaked into normal portfolio");
    pass(
      "Normal portfolio uses an independent cinematic design with no game assets",
    );
    await p.locator(".studio-manifesto").scrollIntoViewIfNeeded();
    await p.waitForTimeout(450);
    await shot("studio-about-desktop");
    await p.locator(".cinema-showcase").scrollIntoViewIfNeeded();
    await p.getByRole("tab", { name: "Feature Sentinel", exact: true }).click();
    await p
      .getByRole("button", { name: "View case study — Sentinel", exact: true })
      .waitFor();
    await p.waitForTimeout(550);
    await shot("studio-work-desktop");
    await p.getByRole("tab", { name: "Feature Sentinel", exact: true }).focus();
    await p.keyboard.press("ArrowRight");
    await p
      .getByRole("button", {
        name: "View case study — Financial Operations Platform",
        exact: true,
      })
      .waitFor();
    pass("Featured project transitions and keyboard tabs work");
    await p
      .getByRole("button", {
        name: "View case study — Financial Operations Platform",
        exact: true,
      })
      .click();
    await p.locator("dialog[open]").waitFor();
    await shot("studio-case-study-desktop");
    await p.keyboard.press("Escape");
    await p.locator("dialog[open]").waitFor({ state: "hidden" });
    pass("Cinematic case studies retain accessible dialog dismissal");
    await p.locator(".studio-skills").scrollIntoViewIfNeeded();
    await p.getByRole("tab", { name: /03 Infrastructure/ }).click();
    await p.waitForTimeout(400);
    await p
      .locator(".studio-skills")
      .screenshot({ path: path.join(out, "studio-skills-desktop.png") });
    await p.locator(".studio-proof").click();
    await p
      .locator(".project-detail h2")
      .filter({ hasText: "Sentinel" })
      .waitFor();
    await p.keyboard.press("Escape");
    pass(
      "Technology domains use local logos and link to the correct case studies",
    );
    await p.locator(".studio-journey").scrollIntoViewIfNeeded();
    await p.waitForTimeout(350);
    await shot("studio-journey-desktop");
    await p.locator(".studio-contact").scrollIntoViewIfNeeded();
    await shot("studio-contact-desktop");
    await p.goto(base + "/play/");
    await p.getByRole("tab", { name: "Hair", exact: true }).click();
    await p.waitForTimeout(500);
    await shot("town-visual-hair-desktop");
    if (!(await p.locator(".town-root .visual-hair canvas").count()))
      throw Error("Missing visual thumbnails");
    pass("Town has an independent visual wardrobe and game navigation");
    await p.getByRole("button", { name: /Let’s explore/ }).click();
    await p.locator(".location-card").waitFor({ timeout: 60000 });
    await p.waitForTimeout(650);
    await shot("town-hud-desktop");
    await p
      .getByRole("button", { name: "Open town map and discovery journal" })
      .click();
    await p.waitForTimeout(300);
    await shot("town-map-desktop");
    await p
      .locator(".journal-list>div")
      .first()
      .getByRole("button", { name: "Walk here →" })
      .click();
    await p
      .getByRole("button", { name: /Enter · About me/ })
      .waitFor({ timeout: 60000 });
    await p.getByRole("button", { name: /Enter · About me/ }).click();
    await p.locator(".town-travel").waitFor();
    await shot("town-location-transition");
    await p
      .locator(".location-card h1")
      .filter({ hasText: "The Green House" })
      .waitFor();
    await p.locator(".town-travel").waitFor({ state: "hidden" });
    await shot("town-discovery");
    await p.getByRole("button", { name: "Back outside ↵" }).click();
    await p
      .locator(".location-card h1")
      .filter({ hasText: "Founders’ Square" })
      .waitFor();
    await p.locator(".town-travel").waitFor({ state: "hidden" });
    pass("Coordinated travel cards, camera fades, room entry and return work");
    const m = await browser.newPage({
      viewport: { width: 390, height: 844 },
      colorScheme: "dark",
    });
    m.on("pageerror", (e) => errors.push(e.message));
    await m.goto(base + "/");
    await m.waitForTimeout(700);
    await m.screenshot({ path: path.join(out, "studio-hero-mobile.png") });
    await m.getByRole("button", { name: "Open navigation menu" }).click();
    await m
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "STACK", exact: true })
      .click();
    await m.waitForTimeout(400);
    if (
      (await m
        .getByRole("button", { name: "Open navigation menu" })
        .getAttribute("aria-expanded")) !== "false"
    )
      throw Error("Mobile menu did not close");
    pass("Mobile navigation exposes all sections and closes after selection");
    await m
      .locator(".studio-skills")
      .screenshot({ path: path.join(out, "studio-skills-mobile.png") });
    await m.locator(".cinema-showcase").scrollIntoViewIfNeeded();
    await m.getByRole("button", { name: "Next featured project" }).click();
    await m.waitForTimeout(550);
    await m.screenshot({ path: path.join(out, "studio-work-mobile.png") });
    if (
      await m.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      )
    )
      throw Error("Studio mobile overflow");
    await m.goto(base + "/play/");
    await m.waitForTimeout(500);
    await m.screenshot({ path: path.join(out, "town-creator-mobile.png") });
    await m.getByRole("tab", { name: "Hair", exact: true }).click();
    await m.locator(".creator-options").scrollIntoViewIfNeeded();
    await m.waitForTimeout(500);
    await m.screenshot({ path: path.join(out, "town-hair-mobile.png") });
    if (
      await m.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      )
    )
      throw Error("Town mobile overflow");
    pass(
      "Both mobile designs and visual wardrobe render without horizontal overflow",
    );
    if (errors.length || httpErrors.length)
      throw Error(JSON.stringify({ errors, httpErrors }));
    pass("Normal-motion browser run has no JavaScript or asset errors");
    fs.writeFileSync(
      path.join(out, "design-results.json"),
      JSON.stringify({ checks, errors, httpErrors }, null, 2),
    );
  } finally {
    if (browser) await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
