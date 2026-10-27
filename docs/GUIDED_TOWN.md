# Jalal’s guided village

The game at `/play/` is independent of the cinematic portfolio. Its content comes from the same reviewed `content/portfolio.ts` facts, without linking one project’s room to another project’s reading panel.

## Places and objects
- 21 buildings: four introductory places, 16 individual project buildings and the contact/CV post office.
- Eight interior footprints, from 544 × 416 to 832 × 576 world pixels.
- 100 individually inspectable exhibits, distributed beside furniture. Each project has an idea, workbench, implementation details, status and source exhibit.
- Research, AI/data and software use different focal props. Telephone, printer and notebook objects carry contact actions; project links belong only to their own source exhibit.
- Six fictional town residents offer greetings and prepared answers. They are not representations of real collaborators.

## Guide behavior
On the first visit, Jalal offers an ordered tour or free exploration. The tour begins with background, education, experience and tools; continues through research, AI/data and software; and ends at contact.

Jalal follows collision-checked paths, pauses when the visitor falls behind, and offers a follow reminder while still visible. Follow Jalal enables automatic following; direct keyboard/touch walking takes manual control. Inside rooms, Jalal stays near the visitor while they inspect objects. Next stop continues the route. Leaving a tour immediately restores unrestricted exploration; completion does the same. The ribbon can restart the full tour at any time.

## Input and presentation
- WASD/arrows, Shift run, E inspect/talk/enter, F wave, Q sit/stand; M toggles the atlas.
- Clicking a path walks there. Clicking furniture walks to its reading spot, then opens its own explanation.
- Right-click a nearby resident for choices, or use E/touch for the same menu.
- Sitting holds a final pose; it does not alternate between sitting and standing. Movement or Stand exits the pose. Nearby chairs provide a seat position.
- Bottom portrait dialogue uses native focus-trapped dialogs, Escape, visible close controls, elapsed-time typewriter text and a skip control.
- The game and character studio fit the viewport. Choice lists, atlas and long text can scroll within their own panels; the page itself does not need scrolling.
- Visitor appearance presets supplement the existing detailed wardrobe. Name, walking pace, camera distance, day/evening light, interface palette, dust and reduced motion are customizable. Discoveries and preferences are local to this browser.
- The renderer uses Canvas for this 2D scene, avoiding unnecessary WebGL overhead on devices without accelerated graphics. Movement uses delta time, collision substeps and a smoothed manual velocity. The route planner uses a binary-heap A* search.

## Local validation
Run `npm ci`, `npm run check:tour`, `npm run typecheck`, `npm run build`, then serve `out/` on port 3001.

- `npm run test:tour`: welcome/entry, persistent sitting, atlas, settings, desktop/mobile viewport and studio.
- `npm run test:town`: real walking to every building and object dialogues. Set `QA_ALL_OBJECTS=1` to exercise all 100 objects instead of two representative objects per building.
- `npm run test:tour-loop`: NPC context choices, keyboard movement/sitting, 21 ordered guide stops, completion, free exploration and restart.
- `QA_BASE_URL`, `QA_OUTPUT`, and `CHROMIUM_PATH` can override the local test environment.

The old seven-house screenshot scripts are historical and do not validate this new town. Physical iOS/Android, Safari/Firefox and a complete assistive-technology audit remain separate review work. Browser emulation does not substitute for those checks.

## Artwork
The supplied character reference provides Jalal’s portrait, expressions and directional poses. The new domain props are original generated artwork, not copied game assets. Existing LPC licenses still cover the village’s adapted house silhouettes, surfaces and scenery. No Stardew Valley art, interface textures, audio or code are included.

Versioned text-backed PNG assets decode offline during prebuild. Optional re-extraction uses `node tools/export-catalog.cjs` and `python3 tools/build_tour_assets.py --character-sheet <owner-reference.png> --prop-atlas <original-props.jpg>`; those originals are not needed to build or serve the committed assets.
