---
name: update-compare
description: Check whether the website's Compare page is stale and refresh it. Use when asked to 'update the compare page', 'refresh the compare numbers', 'is compare.json stale', or after a color-map release, a feature added to color-map, or a competitor release.
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

## Rules

- Never hand-edit `compare.json`; rerun the script.
- Keep competitor versions pinned exactly, never a range.
- Report a failed or unexpectedly large change (a size that moved over 10%) to the user instead of explaining it away.
