# Reference analysis — translate pictures into build rules

## The essential change
The references feel like places people occupy. The current rooms read like an information grid: unrelated props in separated corners, large empty floors, large labels, flat walls and a repeated centered entrance. More props alone will not solve this. Build **enclosure → zones → purposeful groups → path → focal point → light → micro-detail**, in that order.

## Image-by-image requirements

### R01 — portrait dialogue / 385 × 216
See [preview](references/previews/R01.svg); exact file after restore: `references/originals/R01-portrait-dialogue.webp`.
- The low wooden/parchment panel is visually attached to the game, not a generic website card. Text occupies the left; framed portrait/name occupy the right. Strong dark outlines and inset highlights give the border depth.
- The room is still legible behind the panel. The expressive portrait carries personality while small UI elements stay subordinate.
- Translate to an **original** nine-slice wood frame, warm paper interior, stable portrait slot, short paginated lines, deliberate next indicator and integrated choice rows.
- Do not copy Leah's portrait, exact border texture, original dialogue or proprietary font. Do not retain the source's tiny text at modern mobile sizes.
- Acceptance: one screenshot shows a rich room, matching Jalal portrait, readable message and obvious next action without looking like a SaaS modal.

### R02 — Italian Countryside Buildings / 1280 × 720
See [preview](references/previews/R02.svg). Visible board credit: Latterborn; source/permission unverified.
- Buildings differ by **silhouette, roof pitch, wall material, number of levels, porch, chimney and attached structures**, not simply tint or stretched dimensions.
- Ivy, window boxes, stones, lanterns and thresholds connect each facade to its surroundings. Stone church/mill/greenhouse/cottage archetypes share a palette without sharing an outline.
- Translate into 21 authored facade compositions across civic, research, data and maker districts; at least one distinct focal silhouette per district. Porches/gardens take part in the ground composition.
- No direct extraction of this mod board. Repaint or use license-cleared equivalents; preserve creator credit in the reference registry.

### R03 — river town / 602 × 509
See [preview](references/previews/R03.svg).
- A winding river forms a spatial spine. Bridges create memorable crossings and route choices. Irregular tree/flower masses define edges; buildings cluster rather than occupy an evenly spaced spreadsheet.
- Translate into four connected neighborhoods with a civic square, river footbridge, research court and maker lane. Keep accessible alternate walking loops and useful signposts.
- Preserve a 21-place bijection and actual walkable doors while breaking the current five-column grid. A pretty map with disconnected paths is a failure.

### R04 — compact settlement / 496 × 403
See [preview](references/previews/R04.svg).
- The cropped farm has strong enclosure and adjacency: paths, gardens, buildings and water share edges. Small courtyards have distinct activities; varied water shapes break rectangles.
- Translate adjacency, not farming systems. Place a workshop yard next to makers, reading garden next to the library and document counter at contact. Decorative crops/gardens are scenery, not a new farming game.
- Dense does not mean impassable. Protect entry clearances, two-person guide routes and readable silhouettes.

### R05 — Seasonal Vanilla Buildings / 1378 × 990, 4 frames
See [preview](references/previews/R05.svg); restore the original GIF to inspect **all four** frames. Visible credits: magimatica; holiday decorations Brandon007.
- Frame 1 has blossom/flower dressing; frame 2 greener summer dressing; frame 3 orange leaves, pumpkins and autumn decorations; frame 4 snow cover, icicles and winter/holiday dressing.
- The identity and footprint of each house remain readable. Decoration is attached to architecture, not a global screen tint.
- Translate to layered seasonal skins with stable doors, anchors and navigation solids. First deliver a single coherent season; add the others only after the core town/interior/tour gates pass.
- Do not reuse these exact building sprites or assume a mod permits standalone redistribution. The GIF is a design reference, not a character animation sheet.

### R06 — connected interiors / 569 × 539
See [preview](references/previews/R06.svg). Board labels Beebalm Farm, Anne & Leah; creator/terms unverified.
- The farmhouse has an irregular silhouette and internally connected rooms. Rugs, wall finishes, shelves and windows create subrooms. Sofas/tables, beds/nightstands and kitchens/counters are **functional clusters**.
- The bottom production rooms are separate purpose-built examples, not proof that every space should be one giant room. Repetition is appropriate within a specific activity (storage, workshop), not across unrelated projects.
- Translate to three–five meaningful zones in each building, connected through open archways or short halls. Keep one project per building. A research building may have an entry nook, working lab, evidence alcove and reading corner; never a portal to the other 15 projects.
- Reject five floating exhibits with headings over each. Make furniture look furnished before adding hotspots.

### R07 — close village life / 678 × 452
See [preview](references/previews/R07.svg).
- A doorway, fenced garden, stone borders, trellises, pond and people compose a dense eye-level scene. Paths have worn texture and the environment explains what people are doing.
- Translate into thresholds, layered foliage, small seating/social pockets, idle activities and restrained movement. NPCs should have a reason to stand somewhere.
- Do not invent farming, marriage, combat, NPC biographies or professional claims about real people. Fictional residents remain clearly fictional.

## Reference-to-system traceability
| Need | Primary references | Concrete systems |
|---|---|---|
| Warm portrait conversations | R01 | DialogueFrame, portrait states, paginated graph, choice input |
| Interesting facade identity | R02, R05 | Facade composition, attachments, stable seasonal anchors |
| Cohesive walkable town | R03, R04, R07 | Hand-authored map, river/bridge, district routes, landscape layers |
| Lived-in connected rooms | R06, R01 | Room layouts, archways, furniture clusters, walls/lights, occlusion |
| People and world feel alive | R07, R05 | Idle schedules, contextual lines, bounded ambient animation |
| Complete guided journey | All, plus owner feedback | Explicit stop lifecycle, interior route, narration, recovery and persistence |

## Current-code diagnosis — confirmed vs unproven
- **Confirmed:** `game/catalog.ts::stationsFor()` reuses five corner/edge positions and rotates their assignment. This is not a room composition system.
- **Confirmed:** `tools/build_tour_assets.py` assembles a regular five-column road grid, resizes/tints seven house bases and tiles room backgrounds. This explains the repeated silhouettes, sparse geometry and uniform floor/wall hierarchy.
- **Confirmed:** `game/createGame.ts::updateGuide()` follows the player inside rooms rather than leading an authored interior story route. The current `TourState` lacks narrated station/substep and resume checkpoint fields.
- **Confirmed:** `tools/qa-tour-loop.cjs` visits door states and presses Next stop; it does not enter and experience every interior on the guided route. The separate all-object test proves object reachability/isolation, not the combined experience.
- **Confirmed:** every open dialogue/map/settings/help panel shares a broad pause mechanism in `GameShell`; a speech-bubble reminder should not necessarily require a blocking modal.
- **Hypotheses to reproduce:** unclear next action inside a room, accidental skip, confusing departure/re-entry, offscreen guide at zoom/portrait change, route stall after scene change, stale tour state after refresh. Do not claim a specific one is the owner's exact bug without reproducing it.

## Style lock
Choose one tile-density family and one shared palette; no arbitrary pixel stretching to create variation. Use true wall thickness and contact shadows; layer tall furniture behind/in front of characters at the feet. Exaggerate meaningful silhouettes, not UI size. Cluster clutter around activities, leave intentional two-person circulation, minimize permanent labels, and keep long factual content in optional deeper pages.
