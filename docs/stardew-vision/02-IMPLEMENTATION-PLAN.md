# Implementation plan — a cohesive village, not a reskin

## Product contract
This is a portfolio game. Preserve the cinematic homepage and classic portfolio, source-backed project facts, one building per project, the existing Jalal identity and visitor customization. The vision is a richer Stardew-inspired spatial and conversational language, realized with original/license-cleared work. No copied proprietary UI, extracted game maps, asset scraping, new farming economy, combat, romance or backend service.

**Priority:** P0 complete the tour and establish an excellent interior/dialogue vertical slice. P1 author the entire cohesive village and all rooms. P2 seasons and ambient flourishes. Never postpone basic navigation or readability to implement weather.

## 1. Establish a reproducible baseline
- Start from the package branch, whose parent is release `43150ca1d3f8f3efbc148989846b4cbf0a8acc73`. Inspect `git log` and deployment source; do not rebuild the old seven-house `main` by accident.
- Run `npm ci`, `npm run typecheck`, `npm run check:tour`, `npm run build`. Serve the static export for baseline browser tests. Read `docs/GUIDED_TOWN.md` and `docs/TESTING.md`.
- Capture town, first home, a research room, project dialogue, NPC choices, map, settings and character studio at 1440×900 and 390×844. Record exact viewport/zoom/seed/state.
- Record the existing 21 place IDs, 16 project IDs, 100 exhibit IDs and all approved source links. They are migration constraints, not permission to keep weak layouts. Existing derived exhibit prose can be rewritten concisely but must remain factually faithful.
- Reproduce a human-paced tour with default settings and no test shortcuts. Add a defect log for wrong target, unreachable stop, unclear call-to-action and scene/persistence issues. Distinguish confirmed defects from new requirements.

## 2. Lock an art direction before mass production
Create one outdoor crop, one **three-zone connected home**, one four-zone research interior and one portrait conversation at actual gameplay scale. Review all together. The next model must not multiply 21 unreviewed prototypes.

Proposed art rules to validate:
- Adopt a **32-world-pixel terrain tile** to match the current LPC-oriented renderer. Import 16px sources only at consistent integer 2× scale after palette/outline checks; do not stretch one axis. Changing the logical grid is a deliberate migration, not a per-sprite shortcut.
- Establish a shared master palette with shaded wood, muted stone, leaf greens, warm paper and cool water; one accent family per district. Match light direction, outline weight and contact shadow treatment. Do not merely apply a color filter to incompatible packs.
- Camera uses crisp nearest sampling for pixel textures; snap render transforms where needed without quantizing physics. Avoid blurred CSS scaling and shimmering fractional camera positions. Large portrait illustrations may use their own sampling and should not be treated as tiles.
- Proposed characters: retain current 64×64 frame containers and foot anchors while checking visible-body scale against doors/chairs. Artwork must look naturally proportioned, not giant characters among miniature props.
- A room has 1 dominant focal composition and 3–5 supporting activity zones. Target 3–8 secondary set-dressing items per zone, not interactive markers on every item. These are art-direction starting points, not quotas that justify clutter.
- Main two-person path: target 2 tiles clear (64 world px); tight optional side aisles no less than a validated single-character clearance. Door waiting/arrival pads must fit both characters and not overlap swing/threshold art. Test with the actual collision body, not only a centerline.
- At common camera settings, surfaces, furniture and lighting fill the room intentionally. Useful open space is allowed; large empty centers with five corner props are not. Do not chase a numeric density score at the expense of composition.

## 3. Author maps and rooms as data
Retain Phaser/Next/React; no engine rewrite. Use explicit typed authoring data (Tiled export is optional, not mandatory). Separate story facts from geometry.

Proposed files/modules:
- `game/world/`: outdoor layout, portals, districts, navigation, seasonal variants.
- `game/layouts/`: 21 authored room layouts, shared room-kit primitives, validation.
- `game/props/`: footprint, foot anchor, visual bounds, occlusion group, interaction anchors, seat poses and animated states.
- `game/tour/`: pure reducer/state machine, effects/controller, checkpoint migration.
- `game/dialogue/`: typed nodes, content registry and validation; React renders UI.
- `components/game-ui/`: DialogueFrame, Portrait, ChoiceList, TourRibbon, MapPanel, JournalPanel.

Proposed room data contract (design sketch, not implemented API):
```ts
type RoomLayout = {
  id: string; placeId: string; bounds: { w: number; h: number };
  floorRegions: FloorRegion[]; walls: WallSegment[];
  portals: Portal[]; // exterior return + internal archways if needed
  zones: Zone[]; props: PlacedProp[];
  collisions: CollisionShape[]; interactionAnchors: InteractionAnchor[];
  tourBeats: TourBeat[]; lights: LightSpec[];
};
// Every PlacedProp has explicit asset, x/y, footAnchor and optional exhibitId.
// Every TourBeat references a valid zone + reachable player/guide anchor.
```
Define referenced types before implementation; this pseudocode is a contract outline, not drop-in compiling code. Prefer one continuous room scene with irregular floor mask and open archways. Use sub-scenes only where composition/performance require them; then preserve guide/player state through explicit portals.

## 4. Compose interiors rather than scatter props
For each room, author these layers:
1. Irregular floor silhouette and wall thickness; door threshold aligned to the exterior.
2. Floor subregions/rugs/steps and connecting openings that establish zones.
3. Wall-connected storage, windows, curtains, beams and built-in counters.
4. Activity clusters: desk + chair + papers + lamp; table + seating + rug; workbench + tools + storage. Props share surfaces, scale and light.
5. Authored focal object linked to the actual project story: graph wall, document press, library counter, kitchen pass or instrument bench.
6. Small, noninteractive environmental detail: plants, cables, crates, pinned diagrams, mugs and worn floor edges. No fake legible labels or invented performance dashboards.
7. Contact shadows and localized warm light; subtle ambient animation that can be stopped.
8. Discreet proximity affordances. One short active prompt; no large permanent headings above every prop. Optional accessible list of room objects remains available.

Replace `stationsFor()`'s shared spot array with lookup by authored layout/exhibit anchor. Replace tiled rectangular background generation with layered room kits; keep deterministic generation only for minor dressing, never the essential room plan. Do not introduce global project navigation inside a project's room. Keep the old `game/rooms.ts` clearly marked as legacy or remove it only after verifying imports; it is not the current 21-room layout source.

## 5. Rebuild town composition
Start with a legible hand-authored plan, not random scatter:
- **Arrival / civic green:** home, academy, experience office, skills library. A fountain/tree cluster is the first landmark.
- **Research ridge/court:** Sentinel, ORION, Deep Learning Research; differentiated observatory/workshop/archive shapes.
- **Data riverside:** MatchWork, OCR, phishing/spam, HR intelligence, RAG. River, bridge, shared courtyard and distinct professional activity.
- **Maker/commercial lane:** finance, ComptaPilot, 3RB Extreme/PFE, employees, todo, recipe, sports hall, TVA. Use adjacent clusters and short branch paths, not another rectangular grid.
- **Contact/post office:** a natural final stop near a return shortcut to the civic green.

District names/layout are proposed, not biographical facts. Validate all current place IDs after moving them. Author roof/facade kits without stretching seven source silhouettes. Share architectural language but vary massing, entry type, roof and attached yards. Give each district a recognizable silhouette and each of 21 doors a unique map entry.

Add water banks/bridges, path edge transitions, fences, hedges, trees, lamps, seating and small pockets of life. Every solid decorative object needs a matching navigation footprint; tall art may overlap walkable space but must depth-sort correctly. Avoid tree canopies masking important prompts/doors. Regenerate atlas/map from the actual layout and maintain coordinate conversion for camera zoom and touch picking.

## 6. Finish the guide as a narrative interaction system
Implement [04 — Tour specification](04-TOUR-SPEC.md). Do not just extend the `tour-next` counter. Jalal must lead to a door, invite entry, enter with the visitor, introduce the room, lead 2–4 authored points, allow questions/exploration, conclude, escort to the exit and continue. A full tour must be optional and interruptible.

## 7. Replace the entire UI language coherently
Implement [05 — UI and conversations](05-UI-AND-CONVERSATIONS.md) as one system. Scope styles to `/play` and game UI; do not add another cascade of global CSS overrides. Audit `app/village.css`, `app/town.css`, `app/studio.css` and `app/refinements.css` for ownership and import order before consolidation. Preserve classic portfolio styles exactly unless explicitly approved.

## 8. Motion, input and customization
- State-driven 4-direction idle/walk/run/sit/emote animation; no walking-in-place after path completion, repeated sit toggling or input leakage when closing dialogue.
- Door transitions approximately 150–250ms out/in, configurable and instant for reduced motion; relocate both entities atomically at the covered transition midpoint.
- Path following uses delta time, collision-aware smoothing, robust failure feedback, bounded replans and no silent teleports. Click, keyboard and touch paths must use the same collision semantics.
- Keep sitting stable. Author seat anchor/facing and approach point for every seat; player/guide cannot reserve the same seat.
- Keep wardrobe/presets, pace/zoom and accessibility settings. Theme options should stay within one coherent game UI grammar. P2 season/day palettes must not break contrast or collision maps.
- NPC activity loops: sit/read/water/check a board, with short contextual lines. No random interruptions while a guide beat is running. Fictional residents remain explicit fiction.
- Sound is optional and **off by default**; add only cleared audio and separate volume/mute controls if requested. Do not treat audio as required to follow a tour.

## 9. Asset pipeline and content integrity
Use an asset registry with source URL, creators, license route, local file/hash, crop coordinates, modifications and runtime/reference flags. Keep original layered source files when required by licenses; retain all applicable notices, including share-alike obligations for adapted artwork. Never assume one project's MIT license covers all art.

No screenshots/mod boards from `references/` may be imported by `app/`, `game/`, `public/` or prebuild. Keep candidates out of production bundles. Use a production asset manifest and an import/path audit to enforce this. Approved runtime art belongs in the existing decoded asset pipeline or a documented successor.

## 10. Performance and delivery gates
Proposed budgets, to measure and revise on agreed hardware: near-60fps movement on a mainstream desktop, near-30fps minimum on a representative midrange phone, no sustained pathfinding/scene-entry stalls over 100ms, initial necessary art target ≤6MiB compressed with room/district art loaded on demand. Report measured payload, frame times and device/browser; do not fabricate results. Keep Canvas as a safe baseline unless profiling supports a deliberate renderer change.

Deliver in reviewable vertical slices, not one enormous rewrite. Each slice includes source, source-art/license entries, tests, desktop/mobile screenshots and a defect list. Final release needs a full no-shortcuts guided walk, all-room geometry/interaction audits, visual inspection of every room/facade/UI state, production build and public-domain verification. Automated passing results alone are not visual approval.
