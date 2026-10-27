# Career Town — Stardew-style rebuild: progress tracker

> **Start here in every new chat.** This file is the single source of truth for what is done, what is in progress and what is next. Update it at the end of every chunk and push it with the chunk's code.

## Where things live

| Thing | Location |
|---|---|
| Working branch (all rebuild work) | `game/stardew-vision` (created from `docs/stardew-vision-handoff`, which itself starts from the live release `game/jalal-guided-village` @ `43150ca`) |
| Live release (do not break) | `game/jalal-guided-village` → deployed to <https://portfolio-chi-nine-fwh6p2oz7b.vercel.app/play/> |
| `main` | Older cinematic release (`8a0930c`). **Does not** contain the guided town. Do not assume it is current. |
| Vision/plan package | [`docs/stardew-vision/`](docs/stardew-vision/README.md) — reference analysis, implementation plan, 21 room briefs, tour spec, UI spec, asset rights, work packages (V00–V12) |
| The 7 user reference images (lossless) | `docs/stardew-vision/references/` — run `python3 docs/stardew-vision/restore_references.py` to decode + hash-verify the originals into `references/originals/` (git-ignored) |
| Candidate free assets (Kenney Tiny Town CC0, LPC wooden furniture) | `docs/stardew-vision/assets/` — run `python3 docs/stardew-vision/restore_candidate_assets.py` |
| Jalal identity art | `assets-src/tour/jalal-*.png.b64` (decoded by `npm run predev` / `prebuild`) |

### Pushing from an agent sandbox
Command-line `git push` has no credentials. Push through the GitHub connector (`push_files`) in commits of ≤ ~60 KB of JSON each; binary art is stored as base64 text (`*.b64`) and decoded at build time by `tools/prepare-studio-assets.cjs`. Never commit decoded PNG/WebP outputs under `public/assets/{tour,rooms,studio}`.

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
| C01 | **Tour engine**: pure, tested tour state machine (`game/tour.ts`) with stages door → enter → room intro → guided interior beats → free look → exit → next stop; Jalal *leads* inside rooms (instead of following); save + resume; restart/leave idempotent | V03 | ⬜ |
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

## Log
<!-- newest first -->
- **C00** — Confirmed local tree is byte-identical to `game/jalal-guided-village@43150ca` (only generated `public/assets/*` differ). Completed publishing the `docs/stardew-vision/` package (references archive, previews, candidate assets, briefs, plan). Added this tracker. Created branch `game/stardew-vision`.

## Known issues / hypotheses to check
- Tour inside rooms: Jalal only follows the visitor; there is no narrated interior route (fixing in C01).
- `qa-tour-loop.cjs` only checks outdoor door stops, not the guided interior journey (C03).
- `GameShell` pauses the game for every dialogue; hints need a non-blocking channel (C02).
- Interiors use a shared five-position layout (`stationsFor`) and stretched/tinted facades (C07–C14).
