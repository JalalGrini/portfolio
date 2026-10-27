# Work packages, dependencies and acceptance

Do not mark any ticket done for merely creating files. Every ticket needs a working demo or verifiable planning artifact, relevant tests and visual evidence. No calendar estimate is fabricated; size/dependencies below guide sequencing.

| ID | Priority / size | Work and dependencies | Acceptance evidence |
|---|---|---|---|
| V00 | P0 / S | Restore references, confirm release baseline, log defects | Seven original hashes verified; baseline screenshots and human tour notes |
| V01 | P0 / M | Style lock and cleared art registry; depends V00 | Approved outdoor/home/lab/dialogue samples together at gameplay scale |
| V02 | P0 / L | Room authoring schema, prop anchors, collision/depth validator; V01 | Connected home + research room, all paths/anchors valid; no five-position layout fallback |
| V03 | P0 / L | Pure tour machine, controller and save migration; V00 | Guard/transition tests, idempotency and scene lifecycle tests |
| V04 | P0 / L | Dialogue/choices/overlay system; V01 | All dialogue/choice input/focus states at desktop and 390px, instant text/reduced motion |
| V05 | P0 / L | Excellent 2-stop vertical slice; V02–V04 | Town → home → 3 zones → exit → research room → optional detail → finish, no shortcuts |
| V06 | P1 / L | Hand-authored outdoor districts and 21 facade compositions; V01/V02 | Cohesive world crop + atlas, 21 unique walkable doors and no grid-reskin |
| V07 | P1 / XL | Author remaining 19 interiors; V05 | All 21 room briefs fulfilled, exhibit migration complete, every room visually reviewed |
| V08 | P1 / L | Full 21-stop narration and station routes; V03/V06/V07 | Combined guided interior journey completes with pauses, questions and resume |
| V09 | P1 / M | NPC context/idle, seat/door polish, map/journal; V04/V06 | E/right-click/touch parity, stable seats, no interruption spam |
| V10 | P1 / M | CSS/asset loading/performance cleanup; V07–V09 | No portfolio regressions, measured budgets and import/license audits |
| V11 | P2 / M | Seasons/ambient effects and optional audio; after V10 | Stable geometry/anchors, no visual ambiguity, reduced-motion/mute support |
| V12 | P0 final / M | Human review + production verification; all core gates | Build, public asset hashes, anonymous live journey, recorded limitations |

## Test matrix — combined behavior is mandatory

### Static/data validation
- Exact bijection among 16 source projects, 16 project places, 21 total places and world doors. Every existing exhibit ID is mapped once (100 at baseline); approved additions/deletions must update an explicit migration ledger.
- Every narrative node/choice target exists; source keys, project links and status are correctly scoped.
- Portals have valid paired anchors; all required tour beats and exit anchors are reachable with player and guide bodies, not just a mathematical point. Every seat has valid approach and resting anchors.
- Walls, render bounds and physical footprints are independent; no hidden obstacle or pass-through cabinet. Asset source/license entries exist for every production texture.
- No imports/copies from `docs/stardew-vision/references` or `assets/candidates` into runtime/prebuild/output; no raw paid pack or secret in Git.

### Unit/state tests
- Every allowed transition and guard, out-of-order/double events, skip versus complete, leave in each phase, resume/migrate/stale save, final contact/finish, path failure and overlay pause.
- Route-progress watchdog/replan caps; settings/zoom changes retain the beat. Test keyboard keyup when overlay opens/closes and repeated input suppression.

### Full integration/E2E
1. Fresh storage → creator → welcome → manual full tour through all 21 exteriors **and interiors**, with all required beats. Enter/exit physically through the real portals. Verify actual content identity, not only the stop index.
2. Repeat with follow assist; manual input cancels it correctly, then explicit rejoin resumes.
3. Fall behind before a crossing, while near furniture, and at all allowed zoom levels. Guide stops within the usable viewport; reminders are debounced. Close/reopen map without moving the wrong actor.
4. Inspect optional content mid-beat, close it and return to the same beat; ask an NPC question; leave/restart at outdoor/door/interior/outro/final phases.
5. Exit early, visit a different project, refresh mid-tour, return with an old checkpoint, tab away during transition and double-click the continue action.
6. All 100 baseline objects remain reachable/project-isolated, source links accurate, all 21 doors work in free play after the guide completes.
7. Simulate blocked route and asset failure. Recovery UI is truthful; no silent teleport or infinitely repeated modal.
8. Keep existing studio/customization, atlas, stable sitting and portfolio regressions covered.

Extend `tools/qa-tour-loop.cjs` or replace it with explicit full-journey cases. Keep the existing fast door-loop as a smoke suite but rename/report it honestly. `qa-town-tour.cjs` proves different behavior and cannot substitute for the guided interior scenario. Test selectors should reflect stable accessible controls and explicit scene/tour events, not magic coordinates alone.

### Visual/art review — required, not replaced by E2E
Capture every facade and every interior at useful gameplay zoom, plus every UI state listed in the UI spec. Open each screenshot; compare with the appropriate R01–R07 principles. Checklist: connected zones, purposeful prop adjacency, natural scale, wall/ground continuity, focal hierarchy, believable shadows, correct overlap/depth, discreet prompts, expressive portraits, readable text and no clipping. Reject repeated corner layouts or a pleasant screenshot that masks unreachable gameplay.

### Browser/device/accessibility
Chromium desktop and 390×844 touch emulation are the minimum automation baseline. Also test Firefox and WebKit/Safari plus at least one physical midrange Android and iPhone when available. Record actual coverage and failures; emulation is not physical-device verification. Include 200% text/zoom, keyboard-only, focus return, readable accessible text equivalent to canvas interactions, reduced motion, instant text, contrast and color-independent state cues. No document-level vertical/horizontal scroll during normal play; panels may scroll intentionally for long optional content.

### Performance and live release
Measure payload/frame-time budgets from the plan, scene-change stalls, listener count after repeated room changes and memory after a full tour. Document hardware. Build and check production output for reference/paid art leakage. Deploy only an approved release commit, verify READY state and actual assigned public alias, then validate routes/assets anonymously and run a live smoke + full journey as practical. Do not weaken deployment protection or claim a push is a successful deployment.

## Handoff/review gates
A. Baseline/source and rights lock. B. Style lock. C. Home + research vertical slice. D. All rooms/town. E. Combined tour/conversation acceptance. F. Device/accessibility/performance review. G. Owner-approved release. Pause for review at B/C before mass asset production. Defer P2 without blocking core quality; no endless feature growth disguised as polish.
