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

### Public production verification

Vercel marked application checkpoint `a113318` READY. Response-content checks caught that the owner/branch aliases redirect to Vercel sign-in; a superficial final HTTP 200 was the login page, not the portfolio. The assigned production domain was then independently verified to serve the actual four routes, seven-building town JSON and PDF. Documentation now points to that public domain; protection settings were preserved. See `docs/qa/deployment.json`.


## Cinematic portfolio and seven-house follow-up

- Replaced the conservative normal-portfolio presentation with an independent cinematic black/cream design: original mineral imagery, image-displacement hero, image-led project carousel, technology domains, career timeline and responsive navigation.
- Deployed commit `09dbfe6ce1b4f106880a3bc2bdf8789528312221` to production via Vercel; verified READY, production aliases and public HTTP 200 responses for the portfolio, town route and hero artwork.
- Added seven LPC-derived room surfaces and unique furniture layouts, desktop whole-room camera framing and small-screen camera following.
- Refined native reading dialogs with sticky close controls, house stamps, room-specific accents, previous/next field-guide pages and smoother discovery notices.
- Fixed a walking-planner defect: free cell centers could hide a small obstruction between them. Neighbor edges now validate the swept walking segment; off-center starts are normalized before following waypoints.
- Added reproducible room-asset extraction, offline text-backed PNG preparation, furniture/spawn/route audits and a real seven-house browser walking tour. No copied Stardew art, audio or credentials were added.
