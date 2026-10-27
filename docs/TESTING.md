# Testing the guided village

See [GUIDED_TOWN](GUIDED_TOWN.md#local-validation) for the current commands and scope. The current game has 21 buildings, not seven. The historical suites below describe earlier checkpoints and are retained as development history only.

# Testing and quality gates

## Reproduce locally

```sh
npm ci
npm run check:assets
npm run typecheck
npm run build
# Serve the actual static export (not the development server):
python3 -m http.server 3000 --directory out
# In a second terminal:
npm run test:e2e
```

The test runner uses `/usr/local/bin/chromium` when available, otherwise Playwright's installed Chromium. Set `CHROMIUM_PATH` to override it. Use `npx playwright install chromium` if no browser is installed. Screenshots and a machine-readable result are written to `test-results/` (`QA_OUTPUT` can override this). The prepared CI template uploads them as a retained artifact once an owner activates it.

## Coverage

The production-browser smoke suite checks:

1. All four routes at 1440 × 1000, with no horizontal overflow.
2. Body, hair, outfit, footwear and glasses customization; stored appearance.
3. Phaser/canvas startup with locally served character layers.
4. Real keyboard movement and the guide's conversation.
5. Map-driven A* navigation, door entry, an interior, field-note interaction and return outside.
6. All 16 projects; research filter, title/technology search, detail modal and empty state.
7. No link to the 3RB Extreme business website.
8. All four routes at 390 × 844, with no horizontal overflow.
9. Touch-direction movement and mobile map access.
10. Uncaught page exceptions and failed HTTP asset responses.

Asset checks verify every exposed character choice, animation, world texture, spawn footprint, seven front-door approaches and required credit files. Source documents distinguish repository projects, CV-listed work and design-stage research.

## Timing and collision design

Browser QA exposed Phaser's default smoothed-delta behavior under software rendering: long frames were discarded, making walking slower than wall time. The runtime now uses unsmoothed frame delta, caps long pauses at 250 ms, and moves in collision-tested steps of at most 8 pixels. Click-to-walk clamps travel to each waypoint to avoid oscillating around it. This is a runtime fix, not merely an increased test timeout.

## Visual and accessibility review

Desktop/mobile screenshots cover landing, portfolio hero/work/contact, creator and customization states, game, interior, dialogue, map, field notes, project details, empty search and credits. Native dialog focus trapping, Escape dismissal, visible focus, labeled controls, keyboard-operable tabs and a full semantic no-canvas portfolio are provided. Reduced motion disables decoration and camera easing. Theme text colors are checked against their surfaces; essential state is not color-only.

## Scope limits

Automated Chromium and a 390 px responsive viewport are not a substitute for physical-device testing. Safari/iOS, Firefox, real touch hardware, gamepad input and a full assistive-technology audit are not certified by this suite. No claim of exhaustive accessibility compliance or universal performance is made. A public deployment being ready is checked separately from the local static build.

## Core text contrast

| Pair            | Foreground | Background | Contrast |
| --------------- | ---------- | ---------- | -------- |
| Dark body       | `#eff0e5`  | `#101a17`  | 15.45:1  |
| Dark secondary  | `#b1bcb0`  | `#17251f`  | 8.09:1   |
| Primary button  | `#1a3023`  | `#c6dfaa`  | 9.75:1   |
| Light body      | `#223a35`  | `#f4f1e9`  | 10.79:1  |
| Light secondary | `#586961`  | `#fffdf6`  | 5.72:1   |
| Light button    | `#fffdf6`  | `#375e67`  | 6.97:1   |

All listed normal-text pairs exceed 4.5:1. Decorative borders are not counted as text or sole state indicators.

## Supplemental checks

`npm run test:extra` runs five additional checks: theme persistence across routes, arrow-key creator tabs, Escape dismissal for help/settings, all seven map-linked content panels, and an intentionally failed game-asset request with a visible classic-portfolio fallback. It writes `extra-results.json`. The prepared CI template runs this suite after activation.


## Cinematic and interior follow-ups

`npm run test:design` adds nine normal-motion checks for independent visual systems, project/stack interactions, modal dismissal, wardrobe, room travel, mobile navigation/layouts and browser/asset errors.

`npm run check:rooms` decodes the shipped interior art and checks seven unique floor surfaces, furniture bounds, clear entry points and reachable reading stations. `npm run test:rooms` performs a real walking tour of all seven houses, enters each door, walks to its reading station and checks its corresponding field notes. It also tests field-guide paging, sticky close controls, mobile room framing and long mobile popup scrolling.

Run browser suites sequentially on software-rendered WebGL machines. `QA_OUTPUT` keeps their screenshots/reports separate. Current baseline content remains in the original checked-in reports; fresh follow-up screenshots are generated by these commands rather than overwriting historical evidence.
