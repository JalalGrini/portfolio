# Build status

## Current checkpoint — first playable, QA in progress

The first complete implementation is present. All four routes statically build. The baseline was pushed without rewriting the remote history. Runtime and visual QA are now in progress.

### Decisions locked
- Next.js static export + client-only Phaser 3, TypeScript throughout.
- Seven buildings: About, Academy, AI Lab, Office, Workshop, Library, Post Office.
- LPC layered character creator; locally hosted, attributed artwork.
- Classic, accessible portfolio remains available beside the game.
- No audio, combat, farming, crafting, tracking or copied Stardew assets.
- 3RB Extreme is presented as an **undeployed repository project**. No business-site link.
- Sentinel and ORION are design-stage research, not completed systems.

### Build sequence
1. Document and commit the baseline.
2. Generate licensed world/character assets and typed content.
3. Implement classic portfolio, creator and playable town.
4. Add interiors, dialogue, discovery and responsive controls.
5. Run type checks, production build, desktop/mobile visual and interaction checks.
6. Push tested checkpoint and verify hosting separately.

Do not interpret a code checkpoint as a claim of production readiness. Final test and deployment outcomes will be recorded here.

## Implemented in checkpoint 02

- Shared typed content with all 16 substantive projects.
- Classic portfolio, search/filter/detail views, contact, CV and credits.
- Layered character customization and local persistence.
- Town, interiors, collisions, pathfinding, dialogue, discovery, map and touch controls.
- Deterministic asset pipeline and retained upstream credits.

**Verified so far:** TypeScript and static production build. Browser behavior, visual QA and hosting are not yet certified.
