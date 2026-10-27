# Copy-paste implementation brief

You are implementing the next visual/interaction revision of Jalal Grini's Career Town portfolio game in `JalalGrini/portfolio`.

Start from branch `docs/stardew-vision-handoff`, based on guided-town release `43150ca1d3f8f3efbc148989846b4cbf0a8acc73`. Do not start from an older `main`. Read `docs/stardew-vision/README.md`, restore the seven original image files with `python3 docs/stardew-vision/restore_references.py`, and open `index.html`. Inspect all seven originals and all four seasonal GIF frames. Read documents 01–07 and `room-briefs.json` before changing code.

The owner rejected sparse separated interiors, flat popups/conversations and an unfinished-feeling Jalal tour. Build a cohesive, richly composed cozy pixel village, guided by those images. This is not a request for another tint pass or more floating props. R06 guides connected room zones and furnishing groups; R01 guides an original expressive bottom portrait conversation; R02/R05 guide varied architecture and seasonal skins; R03/R04/R07 guide town adjacency, landscape and village life.

First inspect the real current implementation: `content/portfolio.ts`, `game/catalog.ts`, `game/createGame.ts`, `game/navigation.ts`, `game/bus.ts`, `game/tour-world.json`, `components/GameShell.tsx`, `components/Modal.tsx`, scoped game CSS, `tools/build_tour_assets.py` and current QA scripts. Confirm the shortcomings rather than assuming the old tests prove completion. In particular `stationsFor()` uses a shared five-position array, and `qa-tour-loop.cjs` tests 21 outdoor stops without a continuous interior-guided journey.

Implement in this order:
1. Capture/reproduce baseline defects and choose license-cleared palette/tile/scale rules.
2. Create an excellent connected home, one research interior and one integrated dialogue UI; demonstrate a complete two-stop physical tour through their interiors.
3. Add the explicit tour state machine, paired anchors, station beats, wait/rejoin/free/restart, skip semantics, save/resume/migration and failure recovery described in document 04.
4. Review the vertical slice before authoring the whole world. Then complete all 21 authored interiors and facade compositions, non-grid neighborhoods, full route, dialogue/NPC/menu/map/journal system and controlled ambient life.
5. Extend tests to physically enter, narrate, inspect, exit and continue through all 21 places. Review screenshots for every room/UI state at desktop/mobile scale. Build, measure and verify the public release after owner approval.

Keep the cinematic homepage/classic portfolio independent and unchanged. Preserve Jalal's supplied identity and visitor customization. Keep one project per building and 16 project places/21 total places, migrating all 100 baseline exhibits explicitly. Use the factual source of truth: no invented achievements, deployed products, experimental scores, employers or customers. Sentinel and ORION remain design-stage research. 3RB Extreme/PFE is undeployed; no business website claim. Keep the public CV phone redaction.

Use original or properly licensed runtime assets, not ripped Stardew art, portraits, audio, code, UI textures, fonts or mod files. Reference-only pictures are NOT production assets. Follow document 06; no paid asset pack in the public repo. Do not purchase anything or add cloud services without approval. No reference-folder import into prebuild/public/runtime.

Deliver incremental commits with reproducible commands, source-art/license records, tests, before/after screenshots and known limitations. Do not mark a phase complete just because a counter reaches 21 or typecheck passes. The room must look cohesive, the conversation must look intentional, and the human-paced journey must actually work. Defer seasons/optional flourishes until the core is excellent. Do not claim perfect or physical-device coverage without evidence.
