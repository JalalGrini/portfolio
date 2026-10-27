# Career Town — Stardew-style rebuild: progress tracker

> **Start here in every new chat.** This file is the single source of truth for what is done, what is in progress and what is next. Update it at the end of every chunk and push it with the chunk's code.

## Where things live

| Thing | Location |
|---|---|
| Working branch (all rebuild work) | `game/stardew-vision` (created from `docs/stardew-vision-handoff`, which itself starts from the live release `game/jalal-guided-village` @ `43150ca`) |
| Live release (do not break) | `game/stardew-vision` → deployed to <https://portfolio-chi-nine-fwh6p2oz7b.vercel.app/play/> |
| `main` | Older cinematic release (`8a0930c`). **Does not** contain the guided town. Do not assume it is current. |
| Vision/plan package | [`docs/stardew-vision/`](docs/stardew-vision/README.md) — reference analysis, implementation plan, 21 room briefs, tour spec, UI spec, asset rights, work packages (V00–V12) |
| The 7 user reference images (lossless) | `docs/stardew-vision/references/` — run `python3 docs/stardew-vision/restore_references.py` to decode + hash-verify the originals into `references/originals/` (git-ignored) |
| Candidate free assets (Kenney Tiny Town CC0, LPC wooden furniture) | `docs/stardew-vision/assets/` — run `python3 docs/stardew-vision/restore_candidate_assets.py` |
| Jalal identity art | `assets-src/tour/jalal-*.png.b64` (decoded by `npm run predev` / `prebuild`) |

### Pushing from an agent sandbox
Command-line `git push` has no credentials. Push through the GitHub connector (`push_files`). **Hard limit: one connector request must be < 64 KB**, so split large changes into several commits (helper used by the agent: package changed files into ≤ 60 KB JSON payloads and pass each as `arguments_file_path`). After pushing, `git fetch` + `git reset origin/game/stardew-vision` keeps the local index in sync. Verify with a fresh `git clone`. binary art is stored as base64 text (`*.b64`) and decoded at build time by `tools/prepare-studio-assets.cjs`. Never commit decoded PNG/WebP outputs under `public/assets/{tour,rooms,studio}`.

## Non-negotiables (from the plan)
- The cinematic homepage `/` and classic `/portfolio/` stay independent of the game.
- Keep Jalal's identity art + visitor customization; one project per building; 16 project places + 21 total; all 100 exhibits keep their facts.
- Sentinel & ORION = design-stage research; 3RB Extreme/PFE = not deployed, no business-website claim; no phone number in public CV.
- The 7 reference images are **reference only** — never shipped as runtime art. Runtime art must be original or from cleared sources (Kenney CC0, LPC with credits, existing repo art).

## Chunk plan

Each chunk is small enough to finish, test and push in one sitting. Status: ✅ done · 🟡 in progress · ⬜ not started.

### Phase A — The tour (first priority)
| # | Chunk | Plan ref | Status |
|---|---|---|---|
| C00 | Planning package + this tracker pushed; baseline confirmed identical to live release | V00 | ✅ |
| C01 | **Tour engine** — split into mini tasks below | V03 | ✅ |
| C01a | Pure tour state machine `game/tour.ts` (door → enter → room intro → up to 3 highlight beats → free look → exit → next stop → complete), idempotent events, versioned save/resume helpers; 9 unit tests `npm run test:unit` | V03 | ✅ |
| C01b | Wire the machine into `createGame.ts`: Jalal walks to each highlight inside the room, explains it, then waits at the exit; leaving the room advances to the next stop | V03 | ✅ |
| C01c | Save/resume: persist stop index (`jalal-town-tour-v2`), "Welcome back — resume at X" on return, ribbon *Resume tour · N/21* / *Start over* | V03 | ✅ |
| C01d | Browser check of the first stops end-to-end with screenshots (`npm run test:journey`, `QA_STOPS=21` for all) | V03 | ✅ (3 stops) |
| C01e | **Safe progression**: walking out mid-room pauses the stop at the door (no skip) and Jalal offers *Go back inside / Next stop / Look around*; re-entry resumes at the same highlight; stale/double *Next* clicks ignored (`next.from`, `tour-next-<i>`); `exit-room` checks the building id | V03 | ✅ |
| C01f | **Precise save/resume**: save v3 `{v:3,index,beat,complete}` (v2 migrates); welcome-back names the highlight; finished room resumes at the next stop | V03 | ✅ |
| C02a | Ribbon: second line visible in rooms (ellipsis, 430 px), stop progress bar (21 stops) + highlight beads (done / current pulsing), reduced-motion safe, 390 px layout checked | V03/V04 | ✅ |
| C02b | Non-blocking Jalal hint bubbles + accessible live text; arrival Enter action; desktop/390 px movement and overflow checks | V03/V04 | ✅ |
| C02e | Owner-priority outdoor palette: source LPC roof/wall ramps, warmer autotiled path shoulders, sunlit grass/foliage, flower colourways, matching atlas, deterministic offline build | V01/V06 | ✅ |
| C02c | Atlas journal tab: all 21 stops, visited / highlights seen / objects inspected, saved/current checkpoint, exact resume without teleport, map locator, keyboard tabs | V03/V04 | ✅ |
| C02d | Measured room control dock + safe-area camera viewport; compact desktop ribbon; indoor Follow Jalal action; portrait/landscape dock layouts | V03/V04 | 🟡 local QA passed; deploying |
| C02 | Tour UI: redesigned ribbon with stop/beat progress, non-blocking speech bubbles for Jalal hints (no pause spam), resume prompt, tour journal (21 stops, visited/inspected) | V03/V04 | ⬜ |
| C03 | Full-journey E2E (`tools/qa-tour-journey.cjs`): 21 stops, every room entered, beats completed, exit + resume, no stalls; screenshots per room | V08 | ⬜ |

### Phase B — Dialogue, popups & UI art
| # | Chunk | Plan ref | Status |
|---|---|---|---|
| C04 | Dialogue box per R01: low wood/parchment panel over the scene, text left, portrait + name plate right, typewriter + skip, choice list with keyboard focus, 390 px layout | V04 | ⬜ |
| C05 | Evidence/exhibit cards, map, settings & help restyled in the same original wood/paper kit (9-slice CSS, no copied textures) | V04/V09 | ⬜ |

### Phase C — Interiors & furniture (unique, well-spaced, like R06)
| # | Chunk | Plan ref | Status |
|---|---|---|---|
| C06 | Asset pipeline: restore Kenney/LPC candidates, slice into a furniture atlas (`assets-src/furniture/*.b64`), credits file, registry of every prop with footprint + seat/interaction anchors | V01 | ⬜ |
| C07 | Room authoring schema (`game/layouts/*.ts`): walls, multiple connected zones, rugs, wall decor, furniture groups, anchors; validator for collisions/depth/reachability. Removes `stationsFor()` five-spot fallback | V02 | ⬜ |
| C08 | Vertical slice 1 — **Home (about)**: connected bedroom/study/kitchen nook like R06 | V05 | ⬜ |
| C09 | Vertical slice 2 — **Research lab** | V05 | ⬜ |
| C10 | Interiors batch A (civic: academy, library/workshop…) | V07 | ⬜ |
| C11 | Interiors batch B (projects 1–8) | V07 | ⬜ |
| C12 | Interiors batch C (projects 9–16 + contact/post office) | V07 | ⬜ |

### Phase D — Town, facades, life
| # | Chunk | Plan ref | Status |
|---|---|---|---|
| C13 | Outdoor re-layout per R03/R04: river spine, bridges, neighbourhood loops, courtyards (no 5-column grid) | V06 | ⬜ |
| C14 | 21 unique facades per R02 (roof forms, stone/timber, porches, ivy, lanterns, gardens) | V06 | ⬜ |
| C15 | Sitting everywhere: seat anchors with facing per chair/bench/sofa/stool in every room and outdoors, correct depth, sit/stand animations, NPCs can sit | V09 | ⬜ |
| C16 | Animations & transitions: door-open + iris/fade transitions, Jalal emotes, ambient life (smoke, water shimmer, leaves, birds, lamp glow at evening) with reduced-motion | V09/V11 | ⬜ |
| C17 | NPC life per R07: idle activities, small schedules, contextual lines | V09 | ⬜ |
| C18 | Seasons per R05 (optional, after core passes) | V11 | ⬜ |

### Phase E — Release
| # | Chunk | Plan ref | Status |
|---|---|---|---|
| C19 | Performance/asset budget, mobile + accessibility pass, portfolio regression | V10 | ⬜ |
| C20 | Human visual review, production deploy, live verification | V12 | ⬜ |

## Next up (start here)
1. **C02d release** — Complete production verification of the control dock and indoor Follow action.
2. **C03** — Full 21-stop journey E2E run + screenshots of every room.
3. **C04** — R01 portrait dialogue and popups, all buildings (not just the first).

## Deploying (every chunk)
Push → Vercel builds a preview automatically → once checks pass, create a production deployment of the pushed SHA with the Vercel connector (`create_deployment`, project `prj_N0lCH399sXu6OdzkjzRFANb85mlU`, team `team_AidgC20ca6cfN9tCrVyHymcM`, `target: production`, `gitSource {org JalalGrini, repo portfolio, ref game/stardew-vision, sha}`) → verify <https://portfolio-chi-nine-fwh6p2oz7b.vercel.app/play/> serves the new chunk and run `QA_BASE_URL=<live> QA_STOPS=1 node tools/qa-tour-journey.cjs`. (`request_promote` of a preview returns 422.) Rollback point before the rebuild went live: `dpl_BrENg9LQqzQyG8SAwAuX5yGkNZUw` (`game/jalal-guided-village@43150ca`).

## Log
<!-- newest first -->
- **C02d local QA** — Room camera now reserves the measured lower control dock including safe-area inset; controls no longer paint over the floor/actors. Compact landscape dock; desktop room ribbon moved into the top row. Testing exposed two usability issues: some highlight approaches were behind HUD, and mobile had no indoor follow action. `to-beat` now offers Follow Jalal (not a premature Next stop). Journey test checks dock/camera alignment in each room and uses the visible Follow action when a click target is offscreen or blocked by UI. Desktop 2-stop and 390 px 1-stop tests include early exit/re-entry and reload/resume; screenshots checked. TypeScript/build PASS.
- **Deploy** — C02c production `dpl_DVVCvnAXB2HzafH7MoQuoxt5fex6` READY (`8b380df`); live 1440/390 px journal checks PASS (all 21 rows, exact counts, keyboard tabs, paused movement, exact resume and map locate).
- **C02c local QA** — Atlas now has Town map / Tour journal tabs with arrow/Home/End keyboard navigation. Journal lists 21 stops and separates entering/reading highlights/optional objects; Resume returns to the saved stop and highlight with normal walking (not teleporting), Return to Jalal preserves an active tour, Locate selects the right atlas building. `tools/qa-tour-journal.cjs`: 1440/390 px seeded progress, 21 rows, exact 2/21–2/63–3/100 totals, paused movement, precise resume and map locator PASS. Screenshots visually checked; TypeScript/build PASS.
- **Deploy** — C02e production `dpl_EGGhkXFKpS3nPEB7N1gpfJ4HHwFX` READY (`1746809`); all 29 live art files match deterministic local SHA-256 hashes; live first-stop journey + early exit/re-entry + reload/resume PASS. `check:palette` validates deterministic outputs, facade dimensions and unchanged navigation.
- **C02e local QA** — Inspected the non-main branch tools/sources after owner feedback that the outdoors were dull. Replaced the double-desaturated runtime pipeline with a deterministic Sharp recipe from the retained LPC originals: seven roof/wall ramps, bright spring grass variants, proper gravel path shoulders, full-colour foliage, three flower colourways and matching map. No geometry/facts/character/interior changes. 1440/390 px screenshots visually checked; TypeScript, build, unit tests and all-door/all-object audit PASS.
- **Deploy** — C02b production `dpl_BLHUpvjBagR1T3XMU6hyR9VTHjjv` READY (`44acbcb`); live first-stop journey + early exit/re-entry + reload/resume PASS; live 1440/390 px non-blocking hints, movement and overflow checks PASS.
- **C02b local QA** — Non-blocking follow/arrival/wait reminders. Fixed a CanvasRenderer text-resolution mismatch caught in screenshots. Two stops + early exit/re-entry + reload/resume PASS; 1440/390 px hint screenshots checked; player moves while hints show; ribbon actions fit; 12 unit tests, 21-door/100-object audit, TypeScript and production build PASS.
- **Deploy** — C02a production `dpl_7A4gBUezARtmWQxBe8kiEH2scTTe` READY (`4fd484a`); live 1-stop journey + early exit + reload/resume PASS.
- **C02a** — Ribbon shows the stage line inside rooms too (was `display:none`), a 21-stop progress bar and highlight beads. Journey (1 stop + early exit + resume) PASS, 390 px screenshot checked, `tsc` + build clean.
- **Deploy** — C01e/f went live in production (`dpl_AJAJfqikLgumKadqP87WWD3mHwhn`, sha `dd29343`); live journey smoke test PASS.
- **C01e + C01f** — Tour can no longer be skipped by accident: `exit-room` from intro/beat stages → `arrived` at the door with the current highlight kept; only free-look exit or an explicit *Next stop / Skip this stop* advances. `next` carries the stop index so duplicate events (double click, stale dialogue choice) are no-ops. Saves are v3 with the highlight index; v2 saves still resume. Room intro on re-entry: "Welcome back… highlight 2 of 3", *Continue →*. Unit tests 9 → 12 (all pass). Journey test now walks out after highlight 1, checks the door prompt, goes back in and resumes at highlight 2 (PASS, screenshot `stop1-early-exit.png`); 2 stops + reload-resume PASS; `check:tour` PASS; `tsc` + `next build` clean.
- **C01c** — Tour progress saved on every stage change (versioned `{v:2,index,complete}`; junk/old/complete saves ignored). Returning visitors get a *Welcome back* dialogue (*Resume at X →* / *Start from the beginning* / *Explore freely*); after leaving, the ribbon offers *Resume tour · N/21* and *Start over*. Journey test now also checks leave → reload → resume at the right stop (PASS).
- **C01b + C01d** — Tour machine wired into the game. Inside the target room Jalal now: introduces the room (`Stop N of 21 · name`, choices *Show me →* / *I’ll explore on my own*) → walks to each of up to 3 highlights and stands beside it (never on it) → explains it when the visitor joins him (*Highlight 1 of 3 · title*, *Next highlight →* / *Skip to free exploring*) → walks to the exit and offers *Next stop → X*. Walking out the door also advances. Leaving any other building does not. Inspecting the highlight yourself counts. Ribbon copy per stage. New `tools/qa-tour-journey.cjs` (`npm run test:journey`) passed 3 stops × (intro + 3 highlights + wrap-up) with no page errors; screenshots in `test-results/tour-journey/`. Old `qa-tour-loop.cjs` used removed stages (`stop`/`exploring`) — `test:tour-loop` now points to the journey test.
- **C01a** — Added `game/tour.ts` (pure reducer, no Phaser) + `tools/test-tour.mjs` (9 passing tests: full journey, no-op/duplicate events, waiting, skip, leave/resume, clamping, save validation). `tsc --noEmit` clean. Not wired into the game yet (C01b).
- **C00** — Confirmed local tree is byte-identical to `game/jalal-guided-village@43150ca` (only generated `public/assets/*` differ). Completed publishing the `docs/stardew-vision/` package (35 commits, last `d08d8ff`; fresh clone restores all 7 originals + candidates with matching hashes) (references archive, previews, candidate assets, briefs, plan). Added this tracker. Created branch `game/stardew-vision`.

## Known issues / hypotheses to check
- ~~Early room exit advanced the tour; saves lost the highlight~~ → fixed in C01e/C01f.
- ~~Tour ribbon stage line was hidden inside rooms~~ → fixed in C02a.
- ~~Bottom controls covered room floors/actors~~ → measured camera/control dock in C02d (release pending).
- When the visitor stands next to Jalal at a highlight they can overlap (same depth band). Polish in C15.
- Dialogue panel covers the lower half of the room; R01 wants a low panel with the scene visible (C04).
- `qa-tour-loop.cjs` only checks outdoor door stops, not the guided interior journey (C03).
- ~~Jalal reminders paused the game~~ → fixed and live in C02b.
- Interiors use a shared five-position layout (`stationsFor`) and stretched/tinted facades (C07–C14).
