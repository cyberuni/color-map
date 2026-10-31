---
"color-map": patch
---

An unknown preset, scheme, mode, strategy, contrast algorithm or hue method now throws `color-map: unknown <thing> "<value>"; use one of ...` instead of a raw `TypeError` (`createScale({ seed, steps: 'nope' })`) or a silent fallback (`mode`, harmony `space`). An unknown color space also lists the valid ones, and `meets` words its unknown-level error the same way.
