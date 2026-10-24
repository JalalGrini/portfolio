# Field notes — portfolio design pass

This pass refines the existing Next.js / Phaser application. It does not replace the working movement, collisions, content model, or locally served artwork.

## Direction

The supplied portfolio reference, https://yassir-hamri-portfolio.vercel.app/, informed the pacing, confident typography, project storytelling, and interaction depth. Its layouts, source code, text, shader, branding, and media were not copied.

Jalal's interpretation stays forest-toned, quiet, and exploratory:

- An editorial portfolio opening, with the personal photograph moved to the About identity block.
- A four-project notebook with animated case-study switching, followed by the complete searchable project index.
- A four-domain skills workbench with keyboard-accessible tabs and links to related project notes.
- A reading-progress indicator and restrained scroll reveals.
- Dark / light themes initialized before hydration to prevent a navigation flash; saved preference takes priority over the system theme.

## Character creator

All style dropdowns are replaced with actual composited sprite choices: body, hairstyle, facial hair, tops, bottoms, footwear, and glasses. Eyes and other colors use labeled color swatches. Selection is communicated with both a border and a check mark.

Static choice previews compose only a single 64 × 64 frame, rather than recoloring a complete animation sheet for every thumbnail. The full animation sheets remain in use for the main preview and Phaser characters. All artwork remains local and retains its existing attribution.

## Town polish

- Camera fades when entering and leaving rooms, with repeat transitions guarded.
- A first-visit discovery toast and a seven-place progress indicator.
- Animated water ripples inside the fountain, subtle foliage sway, and small movement dust puffs.
- Pauses at NPC waypoints rather than constant uninterrupted walking.
- Animated path-target rings, contextual interaction prompts, and native-dialog opening / closing transitions.
- Ambient tweens pause while an overlay is open. Reduced-motion settings skip or stop the ambient animation and camera transitions.
- No audio, borrowed Stardew assets, or third-party runtime art downloads are introduced.

## Verification

Production export and asset integrity checks pass. The browser suites cover:

- 14 baseline checks: desktop/mobile routes, customization/persistence, town rendering, keyboard/touch movement, dialogue, pathfinding, room entry, field notes, project search/filtering, and empty states.
- 5 extended checks: persistent themes, keyboard character tabs, help/settings dismissal, all seven field-note panels, and failed-asset fallback.
- 6 design checks: project switching, skills-to-project interaction, animated dialog dismissal, normal-motion room transitions and discovery, and mobile story/wardrobe layouts.

Desktop review: 1440 × 1000. Mobile review: 390 × 844. Dark and light themes were inspected. The new project, skills, wardrobe, and discovery states were also checked visually.

Reproduce against the static export:

```sh
npm ci
npm run check:assets
npm run typecheck
npm run build
python3 -m http.server 3001 --directory out
# In another terminal:
QA_BASE_URL=http://localhost:3001 npm run test:e2e
QA_BASE_URL=http://localhost:3001 npm run test:extra
QA_BASE_URL=http://localhost:3001 npm run test:design
```

Set `CHROMIUM_PATH` if Chromium is not at the standard sandbox path. All three browser suites honor it. Screenshots go to `test-results` by default; `QA_OUTPUT` overrides this.

## Scope and follow-up

This is a tested design milestone, not a claim that every device or browser has been validated. Chromium was exercised locally; Safari, Firefox, and physical touch devices remain to be checked. The photorealistic avatar research remains separate: this pass does not invent a rigged digital double from a single photograph. Existing project descriptions and research-status labels are preserved.
