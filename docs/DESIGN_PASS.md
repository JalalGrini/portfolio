# Two worlds — cinematic portfolio / Career Town

This second design pass supersedes the earlier forest-toned field-notes direction. The normal portfolio and the game intentionally have independent navigation, typography, palettes, layouts, and motion treatments. Both retain Jalal's existing content model and research-status labels.

## Cinematic portfolio (`/` and `/portfolio/`)

The supplied reference, https://yassir-hamri-portfolio.vercel.app/, informed the full-screen mineral-art hero, filled/outlined name treatment, black/cream section rhythm, confident editorial typography, image-led project switching, interactive engineering stack, and drawn career timeline. Its source code, branding, text, shader, and media were not copied.

- Independently generated mineral strata, fine-fiber and server-corridor visual studies, optimized as local WebP files. These are conceptual artwork, not product or infrastructure screenshots.
- Lightweight original texture-displacement WebGL hero; reduced-motion, save-data, unavailable-context and lost-context fallbacks retain static artwork.
- Scroll-responsive manifesto, project transitions, reading progress, interactive technology domains, and oversized contact section.
- All 16 projects remain available in the searchable, filterable index and accessible case-study dialogs.
- Mobile navigation exposes Work, About, Stack and Contact without hiding these sections.
- Persistent theme preference takes priority over the system preference. Hydration and reduced-motion markup were checked against the production export.

## Career Town (`/play/`)

A separate warm parchment / forest visual system uses pixel headings, tactile bordered controls, a sprite-based character studio, illustrated discovery journal, and warm game HUD. No cinematic portfolio navigation is reused here.

- All wardrobe choices use real composited sprite previews or labeled color swatches rather than style-name dropdowns. Selection uses both borders and checkmarks.
- Creator-to-game transitions, coordinated location travel labels and camera fades, first-visit discovery cards, and animated dialog dismissal.
- Fountain ripples, subtle foliage motion, footsteps, NPC waypoint pauses, and animated path-target rings.
- Ambient motion pauses under overlays. Reduced-motion settings skip camera and ambient animation.
- Existing collisions, keyboard/touch movement, pathfinding, seven locations and field-note content remain intact.
- No audio, Stardew Valley assets, or runtime third-party art downloads.

## Assets and builds

`predev` and `prebuild` run `tools/prepare-studio-assets.cjs` to decode versioned `assets-src/studio/*.webp.b64` into local public WebP files. This keeps original artwork reproducible through the available text-only repository writer; no image service is called at build or runtime. Technology logos are local Simple Icons SVGs with the complete CC0 license retained. See `ASSETS_AND_LICENSES.md` and the Credits route.

## Verification

Production export and asset-integrity checks pass. Browser suites exercise:

- 14 baseline checks: desktop/mobile routes, customization persistence, WebGL town rendering, keyboard/touch movement, dialogue, map pathfinding, room entry/notes, all projects, filters and search.
- 5 extended checks: persistent themes, keyboard wardrobe tabs, help/settings, all seven field-note panels, and failed-asset fallback.
- 9 design checks: independent visual systems, project transitions and keyboard tabs, modal dismissal, technology domains/logos, visual wardrobe, normal-motion location travel/return, mobile navigation, mobile layouts, and browser/asset error checks.

Desktop review: 1440 × 1000. Mobile review: 390 × 844. Production screenshots cover the main hero, work, stack, career/contact sections, case-study dialog, character studio, HUD, journal and room discovery. This is a Chromium-tested milestone, not a claim that Safari, Firefox or physical touch devices have been validated.

```sh
npm ci
npm run check:assets
npm run typecheck
npm run build
python3 -m http.server 3001 --directory out
# Another terminal:
QA_BASE_URL=http://localhost:3001 npm run test:e2e
QA_BASE_URL=http://localhost:3001 npm run test:extra
QA_BASE_URL=http://localhost:3001 npm run test:design
```

`CHROMIUM_PATH` selects a browser executable; `QA_OUTPUT` overrides the screenshot directory. Run suites sequentially on CPU-only machines: software-rendered WebGL can materially slow animated pathfinding tests.

## Delivery scope

Changes are on the review branch. A production deployment and a verified Vercel preview depend on the connected account's project/team access. No private tokens are embedded in the application or build. Existing photography, CV, project facts, license files and research labels are preserved. The photorealistic-avatar research remains separate; this work does not invent a rigged digital double from a photograph.
