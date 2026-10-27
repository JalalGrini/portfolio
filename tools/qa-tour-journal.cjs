const { chromium } = require("@playwright/test"),
  fs = require("fs");
const places = JSON.parse(fs.readFileSync("test-results/tour-catalog.json"));
const base = process.env.QA_BASE_URL || "http://localhost:3001",
  out = process.env.QA_OUTPUT || "test-results/tour-journal";
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
      await p.evaluate((places) => {
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
        localStorage.setItem(
          "jalal-town-visited-v3",
          JSON.stringify([places[0].id, places[1].id]),
        );
        localStorage.setItem(
          "jalal-town-objects-v3",
          JSON.stringify({
            [places[0].id]: [
              places[0].exhibits[0].id,
              places[0].exhibits[3].id,
            ],
            [places[1].id]: [places[1].exhibits[1].id],
          }),
        );
        localStorage.setItem(
          "jalal-town-tour-v2",
          JSON.stringify({ v: 3, index: 5, beat: 1, complete: false }),
        );
      }, places);
      await p.reload();
      await p.getByRole("button", { name: /Let’s explore/ }).click();
      await p.locator(".village-game.is-ready").waitFor({ timeout: 60000 });
      await p.locator(".village-dialogue").waitFor();
      await p.keyboard.press("Escape");
      await p.locator(".village-dialogue").waitFor({ state: "hidden" });
      await p
        .getByRole("button", { name: "Open town map", exact: true })
        .click();
      await p.getByRole("tab", { name: "Town map", exact: true }).focus();
      await p.keyboard.press("ArrowRight");
      await p
        .getByRole("tabpanel", { name: "Tour journal", exact: true })
        .waitFor();
      if ((await p.locator(".journal-stops > li").count()) !== 21)
        throw Error("Journal missing stops");
      const totals = await p.locator(".journal-totals dd").allTextContents();
      if (
        JSON.stringify(totals.map((s) => s.replace(/\s/g, ""))) !==
        JSON.stringify(["2/21", "2/63", "3/100"])
      )
        throw Error("Wrong counts: " + totals);
      if (
        !(await p.locator(".journal-checkpoint").innerText()).includes(
          places[5].short,
        )
      )
        throw Error("Wrong saved stop");
      await p.screenshot({ path: `${out}/journal-${width}.png` });
      const before = await p.locator(".game-shell").getAttribute("data-x");
      await p.keyboard.down("w");
      await p.waitForTimeout(400);
      await p.keyboard.up("w");
      if ((await p.locator(".game-shell").getAttribute("data-x")) !== before)
        throw Error("Movement leaked through journal");
      if (
        await p
          .locator(".village-map-modal")
          .evaluate((e) => e.scrollWidth > e.clientWidth + 1)
      )
        throw Error("Journal overflows");
      await p
        .getByRole("button", { name: "Resume saved tour →", exact: true })
        .click();
      await p.waitForFunction(
        () =>
          document.querySelector(".game-shell")?.dataset.tourIndex === "5" &&
          ["leading", "waiting", "arrived"].includes(
            document.querySelector(".game-shell")?.dataset.tourStage,
          ),
      );
      if (
        (await p
          .locator(".game-shell")
          .getAttribute("data-tour-beat-index")) !== "1"
      )
        throw Error("Resume lost highlight");
      if ((await p.locator(".game-shell").getAttribute("data-room")) !== "town")
        throw Error("Journal teleported into a room");
      await p
        .getByRole("button", { name: "Open town map", exact: true })
        .click();
      await p.getByRole("tab", { name: "Tour journal", exact: true }).click();
      await p
        .getByRole("button", {
          name: `Locate ${places[20].short} on map`,
          exact: true,
        })
        .click();
      if (
        (await p.getByLabel("Choose a building").inputValue()) !== places[20].id
      )
        throw Error("Locate shows wrong place");
      if (errors.length) throw Error(errors.join("\n"));
      console.log(
        `PASS ${width}px: 21 stops, separate counts, keyboard tabs, paused motion, precise resume, map locate`,
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
