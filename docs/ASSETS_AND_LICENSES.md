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
