---
name: update-compare
description: Check whether the website's Compare page is stale and refresh it, or add a new competitor library to it. Use this skill when asked to 'update the compare page', 'refresh the compare numbers', 'is compare.json stale', 'add X to the compare page', or after a color-map release, a feature added to color-map, or a competitor release.
---

# Update the Compare page

Two files carry the page: `apps/website/src/data/compare.json` (sizes, speed, versions; written by a script) and `apps/website/src/content/docs/compare.mdx` (prose, partly hand-written). `apps/website/src/data/features.json` holds the feature table and is edited by hand.

## Steps

1. Run `pnpm --filter color-map-compare check`. It lists competitor releases newer than the pins, a `color-map` version mismatch, and `color-map` source commits since the data was committed. If it prints "current", stop.
2. If a competitor has a new release, bump its exact pin in `packages/compare/package.json`, then `pnpm install`. Read the release notes for features the table could now mark differently.
3. Run `pnpm --filter color-map build`, then `pnpm --filter color-map-compare measure`. It rewrites `compare.json`. Run it on an idle machine: speed figures are noisy under load.
4. Read the new numbers against the old (`git diff` on `compare.json`). Re-check every claim in `compare.mdx` that a number supports and is not computed: the Summary bullets ("within about 15%", "faster at parsing, mixing and gamut mapping", "clearly slower only at `toCss` and `toHex`") and the Size bullets. Rewrite any that no longer hold.
5. If `color-map` gained or lost a capability (for example APCA, issue #255), or a competitor did, update `features.json` with a source link for each changed cell. Do not mark a cell "No" without a source or a stated source search; mark it "unverified" instead.
6. Check the `description` frontmatter and the library list in `compare.mdx` still match `features.json`.
7. Run the website build to confirm the page renders, then commit `compare.json`, `compare.mdx`, `features.json` and any pin change together.

## Add a competitor

Done once for `@colordx/core`. Follow the same order for the next library. Steps 1 to 5 add the library; step 6 is the refresh above.

1. Pin it exactly (`pnpm --filter color-map-compare add -D --save-exact <pkg>`). The speed benchmark runs from `packages/color-map` and resolves libraries from that package, so add the same exact pin to `packages/color-map/package.json` `devDependencies` too, then `pnpm install`. When you bump the library later, bump both pins.
2. Read its README and `exports` map first: what the core covers, what is a plugin or subpath, and whether the bundle is tree-shakeable.
3. Measurement code, in `packages/compare/scripts/measure.mjs`:
   - Add an `ENTRIES` item with a `convert` entry (parse `#3b82f6`, convert to `oklch`, serialize; use the nearest space if it has no `oklch`) and a `whole` entry (`export * from '<pkg>'`). Say in `compare.mdx` when plugins are left out of `whole`.
   - Add the name to the `versions` list.
   - Add an adapter to `packages/color-map/scripts/bench.mjs` (and the name to `LIBS`) for the operations it supports; leave out the ones it lacks. Load the plugins the operations need and say so in the speed paragraph of `compare.mdx`.
   - Time the conversion, not a field read. A class that converts when it is constructed (`@colordx/core`) reports tens of millions of ops/s on `toRgb()` of a pre-made instance. Build inputs as plain objects and construct inside the timed call. Treat any figure that is 5x or more above every other library as this bug until shown otherwise.
4. Website:
   - `apps/website/src/components/CompareSizes.astro`: add a row.
   - `apps/website/src/components/CompareSpeed.astro`: add the library to `libs`, a colour class for its bar and legend swatch, and a ratio column if the page compares against it.
   - `apps/website/src/data/features.json`: add the name to `libraries` and a cell to every row. Each cell has `value`, `note` and a `source` link. Prefer the README or docs at the pinned version's tag; `https://github.com/<owner>/<repo>/blob/<tag>/README.md#anchor` (URL-encode `@` and `/` in scoped tags). Where nothing confirms a cell, use `unverified`.
5. Run `pnpm --filter color-map build`, then `pnpm --filter color-map-compare measure`. Report to the user: every size move over 10% in the existing rows, and any result that looks surprising (a new library far ahead or behind). Do not explain them away.
6. Rewrite the `compare.mdx` description, the intro count ("seven other color libraries"), the "Measured on" line, the Summary and Size bullets, and the Method caveats, using computed values (`{...}`) for numbers. Then run the website build and commit. `check.mjs` needs no change: it reads the pins and `compare.json` versions.

## Rules

- Never hand-edit `compare.json`; rerun the script.
- Keep competitor versions pinned exactly, never a range.
- Report a failed or unexpectedly large change (a size that moved over 10%) to the user instead of explaining it away.
