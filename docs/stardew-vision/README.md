# Career Town — new vision / implementation handoff

**Planning and reference package, not a completed redesign.** Prepared after the owner rejected the sparse rooms, unfinished-feeling tour and flat dialogue/UI of the first guided-town release.

## Start here
1. Read [NEXT_AGENT_PROMPT.md](NEXT_AGENT_PROMPT.md), then [01 — Reference analysis](01-REFERENCE-ANALYSIS.md).
2. Read [02 — Implementation plan](02-IMPLEMENTATION-PLAN.md), [03 — Room art briefs](03-ROOM-ART-BRIEFS.md), [04 — Tour specification](04-TOUR-SPEC.md), [05 — UI and conversations](05-UI-AND-CONVERSATIONS.md), and [07 — Work packages and QA](07-WORK-PACKAGES-AND-QA.md).
3. Restore the **seven exact new uploaded originals** (GIF animation preserved):
   ```sh
   python3 docs/stardew-vision/restore_references.py
   ```
4. Open `docs/stardew-vision/index.html` for the visual reference board. No build, dependency install, network call or API key is needed. SVG preview copies also live in [references/previews](references/previews).
5. Read [06 — Asset sources and rights](06-ASSET-SOURCES-AND-RIGHTS.md) before downloading or shipping art. The supplied screenshots/mod boards are **reference-only**, not cleared game tiles.

## Why the originals are encoded
The connected repository writer supports text rather than binary files. Following this repository's existing `assets-src` convention, the seven originals are stored **losslessly** as a split base64 ZIP in `references/encoded/`; `references/manifest.json` records original names, dimensions, hashes and rights status. The restore script validates every byte. Preview SVGs are reduced static browsing copies, not the originals. The downloadable handoff ZIP also includes the already-restored image files directly. The four-frame GIF is not reduced to one frame in the source archive.

## Code checkpoint — do not start from the old main branch
- Repository: https://github.com/JalalGrini/portfolio
- Package branch: `docs/stardew-vision-handoff`, created from `game/jalal-guided-village`.
- Implementation baseline: **43150ca1d3f8f3efbc148989846b4cbf0a8acc73**.
- Public game at planning time: https://portfolio-chi-nine-fwh6p2oz7b.vercel.app/play/
- That release was built directly from the release branch in Vercel; do **not** assume `main` contains it.
- This package does not change gameplay, rebuild the town, replace production art, or redeploy the public site.

## Owner's desired outcome
A cohesive, warm, densely art-directed pixel village: connected lived-in interiors rather than isolated information props; memorable architecture and landscape; expressive portrait conversations; Jalal physically guiding an understandable complete journey through the buildings. Aim for the compositional richness in the references using original or properly licensed artwork, not a literal proprietary-art clone.

## Existing identity artwork
Preserve the supplied Jalal identity. Existing derived portrait, happy/thinking expressions and directional sprite sources are in `assets-src/tour/jalal-*.png.b64` (decoded under `public/assets/tour/`). The two earlier identity reference sheets are not counted among the seven newly uploaded files in this package. Reuse the identity; redraw/extend poses only with identity checks.

## Evidence and limits
Source inspection and supplied-image analysis underpin this plan. The earlier route test passes 21 door stops, but does not constitute a seamless full interior tour. No new gameplay completion or cross-browser performance result is claimed by this planning package. Proposed geometry, timing, densities and performance budgets below are design targets to validate, not measurements already achieved.
