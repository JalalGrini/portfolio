# Build status — playable v1

## Current checkpoint

The complete portfolio and first playable career town are implemented and locally validated. This is a usable v1, not a claim of exhaustive device testing or final art-direction approval.

- Production URL: https://portfolio-chi-nine-fwh6p2oz7b.vercel.app
- Repository: https://github.com/JalalGrini/portfolio
- Branch: `main`; existing remote history preserved, no force-push.
- CI: [setup template prepared](ci/README.md); not active because the push credential lacks workflow-management permission.
- Main-branch pushes automatically deploy through the existing Vercel project. Readiness is checked independently of Git push success.

## Implemented

- [x] Cinematic landing and a complete semantic classic portfolio.
- [x] All 16 substantive projects in one typed source, with honest project statuses.
- [x] Seven town buildings and data-driven furnished interiors.
- [x] Layered character customization: body, skin, eyes, hair, facial hair, clothing, shoes and glasses.
- [x] Keyboard movement, run, collision-safe A* click-to-walk and touch controls.
- [x] NPC patrols, guide conversations, typewriter text, wave/sit animations.
- [x] Map, location UI, field notes and a local discovery journal.
- [x] Classic navigation always available, reduced-motion controls and silent operation.
- [x] Light/dark portfolio themes, photograph, public CV and contact links.
- [x] Complete artwork credits, source atlases, palette definitions and deterministic world builder.
- [x] TypeScript, static production export, asset integrity and production-browser checks.
- [x] Local quality gates and committed test reports/screenshots.
- [ ] Activate the prepared GitHub Actions template with authorized workflow access.

## Validation evidence

The main Chromium suite covers 14 checks at 1440 × 1000 and 390 × 844. Five supplemental checks cover themes, keyboard tabs, help/settings, all seven content panels and a deliberate asset-loading failure. Machine-readable reports and selected screenshots are in [qa](qa/) and [screenshots](screenshots/). See [TESTING](TESTING.md) for exact reproduction and limits.

Core text contrast pairs exceed 4.5:1. Character integrity checks cover every exposed style/animation, all world textures, the spawn and seven front-door approaches. All 415 bundled character PNGs map to an upstream credit record.

## Content guardrails retained

- **3RB Extreme:** undeployed repository project, no business website link.
- **Sentinel / ORION:** design-stage research, not completed or deployed systems.
- No invented accuracy, adoption or production-use metrics.
- No Stardew Valley code/art, audio, combat, farming or crafting.
- Personal phone contact is not published in the public CV copy.
- No credentials in the repository or browser bundle; no analytics.

## Remaining review

- Physical iOS/Android, Safari and Firefox verification.
- A complete assistive-technology/accessibility audit.
- Owner review of visual direction, copy and character options.
- Optional follow-up optimization of character asset packing on slow mobile networks.

Implementation, testing and deployment decisions are logged in [DEVLOG](DEVLOG.md), [ARCHITECTURE](ARCHITECTURE.md) and [DEPLOYMENT](DEPLOYMENT.md).
