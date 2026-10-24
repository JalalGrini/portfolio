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
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(12000);
  const results = [];
  await page.goto("http://localhost:3000/");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.screenshot({ path: path.join(out, "landing-light-desktop.png") });
  if ((await page.locator("html").getAttribute("data-theme")) !== "light")
    throw Error("theme did not switch");
  results.push("Light theme toggles and persists");
  await page.goto("http://localhost:3000/portfolio/");
  if ((await page.locator("html").getAttribute("data-theme")) !== "light")
    throw Error("theme not persisted");
  await page.screenshot({
    path: path.join(out, "portfolio-light-desktop.png"),
  });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.goto("http://localhost:3000/play/");
  await page.getByRole("tab", { name: "Character", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  if (
    (await page
      .getByRole("tab", { name: "Hair", exact: true })
      .getAttribute("aria-selected")) !== "true"
  )
    throw Error("tab keyboard control");
  results.push("Character tabs support arrow-key navigation");
  await page.getByRole("button", { name: /Let’s explore/ }).click();
  await page.locator(".location-card").waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: "Open controls and help" }).click();
  await page.screenshot({ path: path.join(out, "help-desktop.png") });
  await page.keyboard.press("Escape");
  await page.locator("dialog[open]").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Open town settings" }).click();
  await page.screenshot({ path: path.join(out, "settings-desktop.png") });
  await page.keyboard.press("Escape");
  await page.locator("dialog[open]").waitFor({ state: "hidden" });
  results.push("Help and settings open and close with Escape");
  for (let i = 0; i < 7; i++) {
    await page
      .getByRole("button", { name: "Open town map and discovery journal" })
      .click();
    await page
      .locator(".journal-list>div")
      .nth(i)
      .getByRole("button", { name: "Read ↗" })
      .click();
    await page.locator(".building-content").waitFor();
    if (i === 2)
      await page.screenshot({
        path: path.join(out, "lab-fieldnotes-desktop.png"),
      });
    if (i === 3) {
      if (
        !(await page.locator(".building-content").innerText()).includes(
          "Groupe 3RB Extreme",
        )
      )
        throw Error("office content");
    }
    await page.keyboard.press("Escape");
    await page.locator("dialog[open]").waitFor({ state: "hidden" });
  }
  results.push("All seven field-note panels are accessible from the map");
  await page.close();
  const fallback = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await fallback.route("**/assets/game/town-ground.png", (r) => r.abort());
  await fallback.goto("http://localhost:3000/play/");
  await fallback.getByRole("button", { name: /Let’s explore/ }).click();
  await fallback
    .locator('.game-loading[role="alert"]')
    .waitFor({ timeout: 30000 });
  await fallback.screenshot({ path: path.join(out, "error-mobile.png") });
  await fallback
    .getByRole("link", { name: "Open the full portfolio →" })
    .waitFor();
  results.push("Failed game asset provides a classic-portfolio fallback");
  await fallback.close();
  await browser.close();
  fs.writeFileSync(
    path.join(out, "extra-results.json"),
    JSON.stringify(
      { checks: results.map((label) => ({ label, passed: true })) },
      null,
      2,
    ),
  );
  console.log(results.map((r) => "PASS " + r).join("\n"));
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
