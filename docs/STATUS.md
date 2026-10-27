# Build status — cinematic portfolio / Jalal’s guided village

## Current checkpoint

The cinematic portfolio remains independent. The game at `/play/` now contains 21 individual buildings, eight interior footprints and 100 object exhibits. Details, controls, source artwork and test reproduction are in [GUIDED_TOWN](GUIDED_TOWN.md).

- Production domain: https://portfolio-chi-nine-fwh6p2oz7b.vercel.app
- Repository: https://github.com/JalalGrini/portfolio
- Production branch: `main`; review work uses `game/jalal-guided-village`. No force-push or protection changes.
- The existing Vercel project deploys `main`. Public release assets are verified separately from GitHub push success.
- Optional CI remains a template; no broader workflow credential is requested.

## Implemented

- [x] Owner-reference Jalal portrait, expressions and directional sprite.
- [x] First-visit guided-tour offer, ordered leading/waiting/stop/exploring states, follow mode, leave/restart and completion.
- [x] Screen-space guide protection and collision-checked routes.
- [x] One room per project, with project-isolated object content and truthful source/status details.
- [x] Variable room sizes and field-specific props, including servers, microscopes, telescopes, workstations, phones and kitchen furniture.
- [x] Bottom portrait dialogue with prepared NPC choices; E/touch and nearby right-click access.
- [x] Stable sit/stand behavior, nearby seats, wave and smoother manual movement.
- [x] Detailed selectable atlas, discoveries, touch controls and viewport-fit layouts.
- [x] Existing detailed appearance editor plus presets, visitor name, pace, camera, light, interface palette and motion settings.
- [x] Silent operation, reduced motion, native modal focus containment and classic navigation.

## Validation

The reproducible checks audit every room boundary, every furniture approach, every town door and one-to-one project coverage. Browser suites cover actual walking, isolated object dialogues, tour states, NPC choices, keyboard/touch controls and desktop/mobile layouts. `QA_ALL_OBJECTS=1` expands the room browser tour to all 100 exhibits. The older seven-house scripts and screenshot reports are historical, not evidence for this rebuild.

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
