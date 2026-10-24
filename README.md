# Jalal Grini — Portfolio / Career Town

[CI setup template](docs/ci/README.md)

**[Live portfolio & career town](https://portfolio-pinats.vercel.app)** · [Build status](docs/STATUS.md) · [QA screenshots](docs/screenshots/README.md)

A professional AI & software engineering portfolio with an optional, silent, explorable pixel-art town. Built with **Next.js, TypeScript, React and Phaser**. The classic portfolio is always available; no game interaction is required to access any professional information.

## Development

```sh
npm ci
npm run dev
# in another terminal
npm run typecheck
npm run build
```

The site is statically exported to `out/`. No backend or secret environment variables are needed. Assets are served locally, not from a third-party game CDN.

## Project map

- `app/`: landing, character creator/game, classic portfolio, credits
- `components/`: accessible React UI and game overlays
- `content/`: typed portfolio content, project status and building definitions
- `game/`: event bus, character compositor, Phaser world and movement
- `tools/`: reproducible Python asset-build scripts and licensed source artwork
- `public/assets/`: generated town art, character layers and user-provided photographs
- `docs/`: architecture, content policy, asset provenance, progress and testing

## Track the work

Read [STATUS](docs/STATUS.md) for the current checkpoint, [DEVLOG](docs/DEVLOG.md) for changes, and [ARCHITECTURE](docs/ARCHITECTURE.md) for implementation choices. Commit-sized checkpoints distinguish planned work from verified functionality.

## Rights

Original application code: MIT (see `LICENSE`). Third-party artwork is **not MIT**. See [ASSETS_AND_LICENSES](docs/ASSETS_AND_LICENSES.md) and `public/licenses/`. Photographs, CV and personal portfolio content remain Jalal Grini's; not offered as reusable stock assets. No Stardew Valley assets, code or branding are included.

## Quality gates

`npm run check:assets`, `npm run typecheck`, and `npm run build` validate the source bundle. `npm run test:e2e` checks the production export in Chromium after a local static server is started. See [TESTING](docs/TESTING.md) for reproduction, screenshot coverage and explicit limits. A GitHub Actions template is prepared in `docs/ci/`; it is not activated because the supplied push credential cannot manage workflow files.

Rebuild the town artwork with `pip install -r tools/requirements.txt && python tools/build_assets.py`. Curated character source PNGs and the source-credit alias map are committed alongside the terrain sources; no network access is required to regenerate the town images.
