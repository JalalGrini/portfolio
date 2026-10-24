const base = process.env.QA_BASE_URL || "http://localhost:3000";
const { chromium } = require("@playwright/test");
const fs = require("fs");
(async () => {
  const out = process.env.QA_OUTPUT || "test-results/design";
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ||
      (fs.existsSync("/usr/local/bin/chromium")
        ? "/usr/local/bin/chromium"
        : undefined),
    args: ["--no-sandbox"],
  });
  const errors = [];
  const p = await b.newPage({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "dark",
  });
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(base + "/portfolio/");
  await p.waitForTimeout(800);
  await p.screenshot({ path: out + "/portfolio.png" });
  await p.locator(".casebook").scrollIntoViewIfNeeded();
  await p.waitForTimeout(700);
  await p.screenshot({ path: out + "/casebook.png" });
  await p.getByRole("tab", { name: /02 ORION/ }).click();
  await p.waitForTimeout(500);
  if (!(await p.locator(".casebook-sheet").innerText()).includes("ORION"))
    throw Error("showcase selection");
  await p.locator(".skills-workbench").scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  await p.getByRole("tab", { name: /03 Cloud/ }).click();
  await p.waitForTimeout(500);
  await p.screenshot({ path: out + "/skills.png" });
  await p.locator(".skill-proof").click();
  await p.locator("dialog[open]").waitFor();
  await p.screenshot({ path: out + "/project-modal.png" });
  await p.keyboard.press("Escape");
  await p.locator("dialog[open]").waitFor({ state: "hidden" });
  await p.goto(base + "/play/");
  await p.getByRole("button", { name: /Let’s explore/ }).click();
  await p.locator(".location-card").waitFor({ timeout: 60000 });
  await p
    .getByRole("button", { name: "Open town map and discovery journal" })
    .click();
  await p
    .locator(".journal-list>div")
    .first()
    .getByRole("button", { name: "Walk here →" })
    .click();
  await p
    .getByRole("button", { name: /Enter · About me/ })
    .waitFor({ timeout: 30000 });
  await p.getByRole("button", { name: /Enter · About me/ }).click();
  await p
    .locator(".location-card h1")
    .filter({ hasText: "The Green House" })
    .waitFor();
  await p.waitForTimeout(500);
  await p.screenshot({ path: out + "/discovery.png" });
  await p.getByRole("button", { name: "Back outside ↵" }).click();
  await p
    .locator(".location-card h1")
    .filter({ hasText: "Founders’ Square" })
    .waitFor();
  console.log("PASS Animated room transitions and first-visit discovery");
  console.log("PASS Featured project selection updates the case study");
  console.log("PASS Skills selection opens its related project");
  console.log("PASS Animated modal dismissal preserves Escape behavior");
  const m = await b.newPage({
    viewport: { width: 390, height: 844 },
    colorScheme: "dark",
  });
  await m.goto(base + "/portfolio/");
  await m.screenshot({ path: out + "/portfolio-mobile.png" });
  for (const [selector, name] of [
    [".casebook", "casebook-mobile"],
    [".skills-workbench", "skills-mobile"],
  ]) {
    await m.locator(selector).scrollIntoViewIfNeeded();
    await m.waitForTimeout(600);
    await m.screenshot({ path: out + "/" + name + ".png" });
  }
  await m.goto(base + "/play/");
  await m.getByRole("tab", { name: "Hair", exact: true }).click();
  await m.locator(".creator-options").scrollIntoViewIfNeeded();
  await m.waitForTimeout(600);
  await m.screenshot({ path: out + "/hair-mobile.png" });
  if (await m.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw Error("mobile overflow");
  if (errors.length) throw Error(errors.join("; "));
  console.log("PASS Mobile showcase and skill workbench render");
  console.log("PASS Mobile visual hair chooser has no horizontal overflow");
  console.log("Browser errors:", JSON.stringify(errors));
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
