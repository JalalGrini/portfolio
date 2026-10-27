# Asset sources, licensing and acquisition plan

## Non-negotiable split
- **User reference images:** archived for this requested design handoff; underlying Stardew Valley/mod/screenshot rights remain with their owners. Upload by the user is not a new runtime license. Do not extract, recolor, trace into game tiles, strip visible credits or publish them as reusable stock.
- **Candidate assets:** potential sources, not automatically selected or bundled. Check per-file license and visual compatibility before production use.
- **Approved runtime assets:** registry entry, exact credits/license text, permitted source/adaptation path, hash and source-art provenance required.

The code repository's MIT license does not cover every image in this folder. The seven uploads are reference-only. No source URL is invented for them; the manifest records unknown attribution/terms honestly. If public reference redistribution is disputed, remove the reference from the public repo and retain a private owner-approved copy; never assert authorship or a sublicense we do not have.

## Recommended acquisition order
1. **Existing retained LPC sources** — first choice for this codebase. Read `docs/ASSETS_AND_LICENSES.md`, `public/licenses/interior.txt`, `furniture.txt`, the roofs/colonial/terrain notices and per-file character credits. Current adaptations have applicable share-alike requirements. Improve composition using these before buying another incompatible style.
2. **LPC Wooden Furniture by bluecarrot16 and credited contributors** — strong modular tables, shelving and cabinets for connected clusters. Source lists CC-BY-SA 4.0 / CC-BY-SA 3.0 / GPL 3.0 alternatives; choose and document a compatible route per included file, retain all contributor/component notices and adaptation obligations. The source explicitly asks for the complete CREDITS files. Source: https://opengameart.org/content/lpc-wooden-furniture
3. **Kenney Tiny Town** — CC0 candidate for town prototypes and topology studies. Simpler/lower-density art than the target screenshots, so not an unreviewed drop-in facade replacement. Kenney's asset license policy: https://kenney.nl/support ; pack: https://kenney.nl/assets/tiny-town . Preserve license text even though attribution is not required.
4. **LimeZu Serene Village revamped** — 16×16 CC-BY 4.0 countryside candidate with varied houses, terrain and animated objects. Credit LimeZu, link source/license and document modifications. Must undergo integer-scale/palette compatibility review. Characters shown in previews come from Modern Interiors, not automatically this pack. Source: https://limezu.itch.io/serenevillagerevamped
5. **LimeZu Modern Interiors** — optional paid/licensed source only. Product page prohibits reselling/distributing the assets themselves; the free-version page restricts use to private purposes. Do not upload the paid pack to a public GitHub repo or deploy the free sample as a public portfolio without appropriate permission. Confirm the current license/download entitlement with the creator before purchase/use; do not rely on scraped price text. Sources: https://limezu.itch.io/moderninteriors and https://limezu.itch.io/moderninteriors/devlog/207713/free-version-overview . No files from this pack are included here.
6. **Original commissioned/drawn pixel art** — preferred for the exact new facade silhouettes, Jalal animation extensions, nine-slice dialogue frame and domain-specific project props. Require documented usage/redistribution rights and editable source. Original generation is only acceptable if visually inspected, consistent and accurately labeled; no fake-text atlases, softened pixels or “looks fine from afar” acceptance.

## Actual downloaded candidate material in this package
Run `python3 docs/stardew-vision/restore_candidate_assets.py` to materialize the bundled candidate archives from text-backed sources. `assets/candidate-manifest.json` pins hashes and URLs. They are **not** imported by the game/build.
- Kenney Tiny Town original ZIP: retain the included license file.
- LPC Wooden Furniture dark-wood source sheet and upstream credits ZIP: inspect the complete notices before any runtime adaptation.

These are working alternatives in the cozy pixel-art family, not Stardew's proprietary game data. Source previews, mod screenshots and official game pages are not permission to rip assets. No payment, bulk scraping or account sign-in was performed for this package.

## Proposed asset registry fields
`id, family, sourceUrl, downloadedFilename, sha256, creators[], licenseIdentifier, licenseFile, rightsStatus, intendedUsage, sourceTileSize, runtimeScale, paletteChanges, cropRect, adaptationNotes, runtimeApproved, approvedBy`.

Asset gate: verify license compatibility → preserve notices → inspect at actual scale beside Jalal → inspect wall/prop anchors → test opacity/depth/collision → register → ship. Keep source-art share-alike obligations distinct from independently written code; request qualified review if unsure about a composite/adaptation.
