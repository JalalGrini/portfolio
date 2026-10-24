# Architecture

## Surface and runtime boundaries

Next.js App Router statically exports four routes. `/` introduces two equally valid paths. `/portfolio` is the complete semantic HTML portfolio. `/play` hosts a React character creator followed by Phaser. `/credits` exposes artwork provenance. Phaser is dynamically imported only on the game route and never evaluated during server rendering.

React owns content panels, settings, character creation and accessible navigation. Phaser owns rendering, collisions, movement, NPCs, camera and world interaction. A typed event bus decouples them. Scenes are disposed on route unmount; no persistent global game instance.

## Content

One typed source in `content/portfolio.ts` supplies classic project cards and building panels. Project status is explicit. Design-stage projects carry no invented metrics. Repositories are linked by exact slug. Photos and CV are local assets provided by the owner. No runtime GitHub API/token is needed.

## Art pipeline

Python/Pillow assembles LPC source tiles into a ground image and individual world-object textures. JSON describes world bounds, solid rectangles, building doors and objects. Objects sort by their foot position; collision footprints intentionally cover trunks/building bases rather than canopies. Interior maps use licensed floor, wall and furniture tiles. Source atlases and credits are committed for reproducibility.

The character compositor loads curated LPC PNG layers and palette ramps. Exact RGB substitutions preserve the original pixel shading. Layers compose in body/feet/legs/top/head/beard/glasses/hair order. Animation rows preserve LPC's up/left/down/right direction order. Browser composition caches source images. Appearance is stored locally; no account or remote persistence.

## Controls and accessibility

WASD/arrows, Shift run, E interaction, pointer pathfinding, touch controls. Modal content is native HTML with visible focus and keyboard dismissal. Opening a panel pauses movement. The classic route supplies the full no-canvas alternative. Reduced-motion mode removes decorative camera and ambient movement. Audio is intentionally absent. No analytics.

## Security and deployment

Only public content is bundled. GitHub and Vercel credentials stay outside this repository and are never used by client code. `next build` produces static files. Hosting status must be verified rather than inferred from a push. Dependencies are locked in `package-lock.json`.
