const { chromium } = require("@playwright/test");
const fs = require("fs"),
  path = require("path");
const base = process.env.QA_BASE_URL || "http://localhost:3001",
  out = process.env.QA_OUTPUT || "test-results/rooms";
fs.mkdirSync(out, { recursive: true });
const rooms = [
  ["about", "About me", "The Green House"],
  ["academy", "Education", "ENSAH Academy"],
  ["lab", "AI & research", "The AI Observatory"],
  ["office", "Experience", "The Engineering Office"],
  ["workshop", "Software projects", "The Makers Workshop"],
  ["library", "Skills", "The Knowledge Library"],
  ["contact", "Contact & CV", "The Post Office"],
];
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/local/bin/chromium",
    args: ["--no-sandbox"],
  });
  const errors = [];
  const p = await b.newPage({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "dark",
  });
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("response", (r) => {
    if (r.status() >= 400) errors.push("HTTP " + r.status() + " " + r.url());
  });
  try {
    await p.goto(base + "/play/");
    await p.getByRole("button", { name: /Let’s explore/ }).click();
    await p.locator(".location-card").waitFor({ timeout: 60000 });
    await p.waitForTimeout(900);
    for (let i = 0; i < rooms.length; i++) {
      const [id, topic, name] = rooms[i];
      if (
        process.env.QA_ROOM_IDS &&
        !process.env.QA_ROOM_IDS.split(",").includes(id)
      )
        continue;
      await p
        .getByRole("button", { name: "Open town map and discovery journal" })
        .click();
      await p
        .locator(".journal-list>div")
        .nth(i)
        .getByRole("button", { name: "Walk here →" })
        .click();
      // A room-to-town fade deliberately resets movement keys. Begin running after it.
      await p
        .locator('.game-shell[data-room="town"]')
        .waitFor({ timeout: 15000 });
      await p.locator(".town-travel").waitFor({ state: "hidden" });
      await p.keyboard.down("Shift");
      const enter = p.getByRole("button", {
        name: new RegExp(
          "Enter · " + topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        ),
      });
      await enter.waitFor({ timeout: 60000 });
      await p.keyboard.up("Shift");
      await enter.click();
      await p.locator(`.game-shell[data-room="${id}"]`).waitFor();
      await p.locator(".town-travel").waitFor({ state: "hidden" });
      await p.waitForTimeout(3900);
      await p.screenshot({ path: path.join(out, id + "-interior.png") });
      await p.locator(".game-canvas canvas").focus();
      await p.keyboard.down("w");
      await p
        .getByRole("button", { name: "E Read the field notes →" })
        .waitFor({ timeout: 12000 });
      await p.keyboard.up("w");
      await p.getByRole("button", { name: "E Read the field notes →" }).click();
      await p.locator(".room-note-stamp").waitFor();
      await p.waitForTimeout(400);
      await p.screenshot({ path: path.join(out, id + "-notes.png") });
      if (!(await p.locator(".building-content").innerText()).includes(name))
        throw Error("Wrong notes: " + id);
      await p.keyboard.press("Escape");
      await p.locator("dialog[open]").waitFor({ state: "hidden" });
      console.log(
        "PASS",
        id,
        "actual walk, door, reading station, themed notes and dismissal",
      );
    }
    const discoveryBefore = await p.locator(".discovery-count").innerText();
    const physicalRoom = await p
      .locator(".game-shell")
      .getAttribute("data-room");
    // Field-guide page navigation must not teleport or mark unseen places.
    await p
      .getByRole("button", { name: "Open town map and discovery journal" })
      .click();
    await p
      .locator(".journal-list>div")
      .first()
      .getByRole("button", { name: "Read ↗" })
      .click();
    await p.getByRole("button", { name: "Next field note" }).click();
    await p.locator(".room-notes-academy").waitFor();
    await p.getByRole("button", { name: "Previous field note" }).click();
    await p.locator(".room-notes-about").waitFor();
    await p
      .locator(".modal-content")
      .evaluate((e) => (e.closest("dialog").scrollTop = 999));
    await p.getByRole("button", { name: "Close dialog" }).click();
    await p.locator("dialog[open]").waitFor({ state: "hidden" });
    if (
      (await p.locator(".discovery-count").innerText()) !== discoveryBefore ||
      (await p.locator(".game-shell").getAttribute("data-room")) !==
        physicalRoom
    )
      throw Error("Reading changed physical discovery/location");
    console.log("PASS Field-guide paging and sticky close control");
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForTimeout(800);
    await p.screenshot({ path: path.join(out, "contact-interior-mobile.png") });
    await p
      .getByRole("button", { name: "Open town map and discovery journal" })
      .click();
    await p
      .locator(".journal-list>div")
      .nth(2)
      .getByRole("button", { name: "Read ↗" })
      .click();
    await p.waitForTimeout(450);
    await p.screenshot({ path: path.join(out, "lab-notes-mobile.png") });
    await p
      .locator("dialog[open]")
      .evaluate((e) => (e.scrollTop = e.scrollHeight));
    await p.waitForTimeout(100);
    await p.screenshot({
      path: path.join(out, "lab-notes-mobile-scrolled.png"),
    });
    const close = await p
      .getByRole("button", { name: "Close dialog" })
      .boundingBox();
    if (!close || close.y < 0 || close.y + close.height > 844)
      throw Error("Mobile close control offscreen");
    if (
      await p.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      )
    )
      throw Error("Mobile page overflow");
    if (
      await p
        .locator("dialog[open]")
        .evaluate((e) => e.scrollWidth > e.clientWidth + 1)
    )
      throw Error("Mobile popup overflow");
    await p.getByRole("button", { name: "Close dialog" }).click();
    await p.locator("dialog[open]").waitFor({ state: "hidden" });
    console.log(
      "PASS Mobile room framing, long popup scrolling and persistent close control",
    );
    if (errors.length) throw Error(JSON.stringify(errors));
    fs.writeFileSync(
      path.join(out, "results.json"),
      JSON.stringify({ rooms: rooms.map((r) => r[0]), errors }, null, 2),
    );
  } catch (e) {
    await p.screenshot({ path: path.join(out, "failure.png") });
    throw e;
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
