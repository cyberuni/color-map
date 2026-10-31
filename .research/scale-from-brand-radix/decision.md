# scaleFromBrand: do not vendor Radix's 31 scales (closes #250)

Decision: keep the single fixed shape. Do not vendor Radix's scale data.

## Why

- **Size.** The 31 Radix scales (`@radix-ui/colors` 3.0.0) hold 744 colors in the light and dark sets. As bare hex they gzip to about 2.4 kB, before any lookup code. `color-map/scale` measures 8.04 kB gzip against a limit of 8.05 kB, so it has about 1 kB of headroom to the 9 kB budget in the issue. The data alone is over twice that. Fitting it means raising the limit past 9 kB, which breaks the issue's budget.
- **Benefit.** Against Radix's own scales, `scaleFromBrand(step 9)` differs by CIEDE2000 ΔE of at most 3.5 for blue, 3.8 for tomato and 5.7 for grass in steps 1 to 8 and 10 to 12 (except step 11 at 6.5 to 7.3 for blue and tomato). Light hues such as amber differ by up to 13.7, because Radix hand-tunes them. Only those hues gain from a nearest-scale lookup.

## License

`@radix-ui/colors` is MIT. Vendoring would be allowed with the notice kept, but the size rules it out.

## Comparison

Ran `scaleFromBrand(<Radix step 9>)` for blue, tomato, grass and amber and compared each step with the Radix light scale in OKLab, ΔE2000. The website palette builder calls the same function, so its output is the same.

## Revisit if

Light hues (yellow, amber, lime, sky, mint) matter to users. A smaller option is to store only a lightness and chroma curve for those few scales, not all 31.
