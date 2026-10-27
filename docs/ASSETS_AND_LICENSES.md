# Assets and licenses

Application code is MIT; third-party artwork retains its own licenses. Changes include cropping, palette grading, layer composition and map assembly. No Stardew Valley files are included.

| Asset family                | Source                                                                                                                                                        | License route / attribution                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LPC characters              | Universal LPC Spritesheet Character Generator, https://github.com/Universal-LPC-Spritesheet-Character-Generator/Universal-LPC-Spritesheet-Character-Generator | File-level credits in `public/licenses/lpc-characters.csv`; CC-BY-SA / OGA-BY / CC-BY 3.0 or 4.0 / CC0 as applicable. Preserve all author names and per-file alternatives. |
| LPC terrain / base atlas    | https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles and composite atlas                                                     | CC-BY-SA 3.0; complete upstream `atlas.txt` retained.                                                                                                                      |
| LPC roofs / colonial        | bluecarrot16 and credited LPC contributors                                                                                                                    | CC-BY-SA 3.0 with upstream component exceptions; full `roofs.txt` and `colonial.txt` retained.                                                                             |
| City outside                | Tuomo Untinen and credited contributors                                                                                                                       | CC-BY-SA 3.0; complete `city.txt` retained.                                                                                                                                |
| House interiors / furniture | LPC contributors in retained credit files                                                                                                                     | CC-BY-SA 3.0; complete `interior.txt` and `furniture.txt` retained.                                                                                                        |
| LPC office props            | Eliza Wyatt and Lanea Zimmerman (Sharm), https://github.com/ElizaWy/LPC                                                                                       | OGA-BY 3.0; full `office.txt` retained.                                                                                                                                    |
| Photographs and CV          | Supplied by Jalal Grini                                                                                                                                       | Personal portfolio use; not reusable stock.                                                                                                                                |

Generated map images and recolored character compositions are adaptations of the corresponding source artwork, distributed under its applicable share-alike terms. These licenses apply to artwork, not a relicensing of independently written application code. Do not strip attribution on redistribution. See the public Credits route for reader-facing links and full source credits.

Pixelify Sans is locally hosted under SIL OFL 1.1; see `public/licenses/pixelify-sans.txt`. The public CV is a portfolio copy with the personal phone contact removed. Colorized glasses PNGs map to the corresponding uncolored animation source entries in the retained LPC credit CSV; all source variants for the four included glasses styles are retained there.

`public/licenses/lpc-asset-map.csv` maps every bundled character PNG—including all generated glasses colors—to its exact upstream credit entry in `lpc-characters.csv`.

## Independent cinematic portfolio

- `assets-src/studio/*.webp.b64`: original AI-generated conceptual imagery created for this portfolio. The image source files are text-encoded for the available repository writer; `tools/prepare-studio-assets.cjs` decodes the exact WebP bytes before development and production builds. No external image service is used at runtime. They are decorative visual studies, not screenshots of deployed products or real project infrastructure.
- `public/assets/brands/*.svg`: selected technology logos from https://github.com/simple-icons/simple-icons, under CC0 1.0. The complete license is retained in `public/licenses/simple-icons.md`. Logos are local, static SVG paths; brand trademarks remain their respective owners’ marks.
- The hero’s lightweight image-displacement shader is independently implemented in `components/FlowArtwork.tsx`. It retains static-art fallbacks for reduced motion, data saving, and unavailable/lost WebGL contexts.
- Motion (https://github.com/motiondivision/motion) and Phaser (https://github.com/phaserjs/phaser) are existing application dependencies. This pass does not import code, art, text, or the shader from Yassir Hamri’s portfolio.

## Seven-house interior pass

`assets-src/rooms/*.png.b64` contains reproducible PNG adaptations of the retained LPC `interior.png` and `furniture.png` atlases. `tools/build_room_assets.py` records all crop coordinates, palette transformations, floor tiling and rug scaling. These are licensed source-art adaptations, **not original AI imagery**. The same complete contributor credits and CC-BY-SA terms in `public/licenses/interior.txt` and `public/licenses/furniture.txt` apply. `tools/prepare-studio-assets.cjs` decodes them offline before dev/build. Interior-specific texture names prevent these palette/crop changes from replacing outdoor props.

## Guided-town rebuild
- Jalal portraits and directional character sprites are extracted from the two owner-supplied reference images. Owner-supplied material is not relicensed as LPC artwork.
- New server, telescope, microscope, phone, security console, workstation, kitchen, filing cabinet, planning board, notebook, printer and chair sprites are original generated artwork, with source-color-key extraction retained in `tools/build_tour_assets.py`.
- House variants, room surfaces, plants, roads and trees derive from the already credited LPC source bundle. Existing upstream notices and attribution requirements still apply.
- No Stardew Valley artwork, portraits, code, UI textures, music or sound effects are bundled.
- Production art is decoded offline from `assets-src/tour/*.png.b64` during prebuild. Re-extraction requires the owner reference images and original generated atlas; decoded versioned bytes do not require them.

## Daylight town palette (C02e)

`tools/build_town_palette.cjs` runs after legacy decoding during `predev` / `prebuild`. It rebuilds the **game-only** terrain, 21 facade colour adaptations, tree/pine/plant sprites, three flower colourways and the atlas preview from the already retained LPC sources. Roof and wall ramps preserve source pixel shading; no screenshots/reference-image pixels are used. Exact crops and ramps are recorded in the script. Ground/path quadrant autotiling reuses the licensed source coordinates already recorded in `tools/build_assets.py`.

Source files: `tools/source/{houses,base,city,terrain}.png`. The complete `public/licenses/{roofs,atlas,city}.txt` notices and applicable CC-BY-SA terms continue to cover these art adaptations. Independently written builder code remains under the repository code license. No new external pack or purchase is required.

Generated PNGs and `public/assets/tour/town-style.json` are build outputs, not new source assets. The latter records dimensions, reproducible SHA-256 hashes and the unchanged navigation-data hash. Run `npm run check:palette` to verify deterministic output, all 29 textures and the 21 existing facade footprints. This is a colour/terrain-edge pass only: the inherited facade stretching and grid topology remain scheduled for C13/C14. Cinematic art, character palettes, room surfaces, project facts, collision solids and door coordinates are unchanged.


## Structural river town (C13a)

`game/town-layout.json` is the authored game-only layout; `tools/build_town_layout.cjs` derives the world geometry and matching street/river masks before the palette builder runs. The 21 doors, irregular neighbourhood links, three crossings and collision envelopes are independently authored; the R03 screenshot is a visual reference only and is never shipped as terrain.

The daylight recipe now renders the river from retained `terrain.png` bank/water tiles (columns 9–11, rows 11–13), sparse water ripples (21,17) and the timber crossings from the same source (deck 14,16, rail strips 20,19–20). Pixel-colour ramps for the brighter grass and orange paths are recorded in `tools/build_town_palette.cjs`. Existing LPC attribution and share-alike terms above remain applicable. No new external artwork was added.

`check:town-layout` validates deterministic geometry, every threshold, connected painted streets, bridge-only river crossings, facade separation and distributed residents. Unit navigation tests validate every canonical tour leg and that automatic walking prefers painted streets; manual exploration may still leave them. C13a supersedes the C02e grid topology, not the remaining unique-facade/interior work.

## Authored furnished home (C07/C08 first slice)

`game/layouts/about.json` replaces the home's shared exhibit grid with connected bedroom, reading, study and kitchen areas. Furniture instances, collision footprints, seat anchors and exhibit approaches are explicit authored data. `game/room-props.json` records the exact atlas crop for every source prop; `tools/build_authored_rooms.cjs` builds them offline with Sharp after legacy decoding. The first 14 crops are full-colour adaptations of the retained LPC `tools/source/{furniture,interior,base}.png`; their complete contributor notices and CC-BY-SA terms remain in `public/licenses/{furniture,interior,atlas}.txt`. Floor, wall panels, wood trim, rugs and actual window frames are source-art crops, not screenshot pixels or generated stand-ins. Exact furniture-atlas floor colours are removed for transparency; no global desaturation is applied.

Two additional tabletop details are cropped from the existing original generated `prop-notebook.png` and `prop-workstation.png` (book only / monitors only, without their old stands and tables). They are not LPC art and retain the original generated-art provenance above. The `authored-` runtime prefix deliberately distinguishes this mixed, explicitly credited registry from LPC-only assets.

Generated `public/assets/rooms/authored-*.png`, `authored-rooms.json`, `home-overview.png` and the overridden `public/assets/tour/room-about.png` remain build outputs. `authored-rooms.json` records reproducible hashes. The registry is currently the home slice only: other buildings retain their legacy layouts pending separate authored conversions. No cinematic routes or project facts were changed.


## Layered garden town (C13b)

`game/town-scenery.json` records exact retained-source crops and physical footprints for shrubs, hedges, reeds, produce beds/plants and proper wood park benches. `tools/town_landscape.cjs` authors yard groups, produce gardens, riverbank planting and meadow islands while keeping the shared street mask and door approaches clear. Trees are denser; the blossom variant recolours only foliage, preserving the original trunk. No reference screenshot pixels are used.

All planting comes from the already credited LPC `tools/source/terrain.png`; the park bench comes from `tools/source/furniture.png` with its exact atlas-floor palette removed. Existing complete `public/licenses/{atlas,furniture}.txt` contributor notices and applicable share-alike terms remain in force. The reed adaptation removes source cyan water-edge pixels before placing it on grass. Soil is a floor layer below crops, not a tall prop that hides them. `town-style.json` now covers 38 deterministic art outputs.

Source-art ripples (terrain crop 672,544,64,32) remove their flat source-water background and use a gentle light-blue adaptation. They are baked into the terrain; normal-motion mode adds a very subtle 2-pixel drift/fade overlay. Reduced-motion mode keeps the static art only. Scenery details are generated separately in `game/town-details.json` for release-sized text payloads; collision solids remain in the canonical world file.
