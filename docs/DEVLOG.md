# Development log

## Checkpoint 01 — resume and baseline

- Recovered the empty Next.js scaffold and asset research from the prior session.
- Confirmed curated LPC layers and source artwork exist locally.
- Recorded architecture, content truthfulness rules, scope and licensing boundaries.
- Added README, status tracking and application-code license.
- Next: reproducible art pipeline and complete portfolio/game implementation.

## Checkpoint 02 — portfolio and first playable implementation

- Added all 16 substantive projects to a single typed content source.
- Implemented landing, complete classic portfolio, project filters/search/details and public credits.
- Added a layered character creator: body, skin, eyes, 22 hairstyles, hair color, facial hair, clothing, footwear and glasses.
- Generated a seven-building town with licensed art, roads, forest, fountain, props and solid footprints. Retained the source atlases and a deterministic Pillow build script.
- Implemented Phaser boot, town and interior scenes, keyboard/touch movement, A* click-to-walk, NPC dialogue, y-sorting, map, discovery journal, local appearance persistence and reduced-motion controls.
- Included the owner-supplied photograph and a public-facing CV copy without the personal phone number.
- Fixed the Phaser ESM import for Turbopack. Production static build passed for all four routes.
- Runtime, visual and end-to-end interaction validation follows in the next checkpoint; implementation does not yet mean every interaction is verified.

## Checkpoint 03 — validated playable v1

- Fixed seamless grass palette matching and rebuilt the deterministic town artwork.
- Refined the room wall/floor assembly, added licensed office laptops and mailboxes, and corrected furniture crops.
- Fixed character select labels and keyboard-operable tabs; enlarged mobile interaction/color targets.
- Removed unsupported icon glyphs and added a reliable theme icon and pixel-art conversation portrait.
- Diagnosed Phaser's low-frame-rate delta smoothing using its runtime source. Switched to raw frame delta with a 250 ms pause cap, collision substeps of at most 8 px, and waypoint distance clamping.
- Fixed modal Escape handling: game keys no longer prevent native dialog cancellation, keyboard input is suspended while a panel is open, and held keys reset on resume.
- Fixed typewriter message completion and added a visible fallback for failed world assets.
- Added production-browser tests, all-creator-choice asset integrity checks, full asset-to-credit mapping, core text contrast measurements and a GitHub Actions workflow template.
- Added desktop/mobile QA screenshots, readable source formatting, deployment/security documentation and explicit testing limits.
- Four-route static build and TypeScript checks pass. The browser suite has 14 main checks plus five supplemental checks. The supplemental suite deliberately tests a failed request; ordinary browsing records no failed assets or uncaught page exceptions.
- Configured the existing Vercel project explicitly for Next.js. Main-branch pushes are the deployment source; deployment readiness is verified separately during handoff.

### GitHub push permission boundary

The first attempt to push checkpoint 03 was rejected because the token cannot create workflow files. The unpublished checkpoint was revised to save the workflow under `docs/ci/` as a non-executing template. No remote history was rewritten, no force-push was used, and no broader credential was requested. Application deployment remains independent of this optional CI activation.
