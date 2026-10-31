---
"color-map": patch
---

Fix names such as `constructor`, `__proto__` and `toString` reaching `Object.prototype` in `parse`, `parseExpr`, `meets`, `harmony`, `createScale` and `toDTCG`; they are now unknown names like any other, and `toDTCG` returns groups without a prototype. Make `toCss` about 2.7 times faster with an exact rounding fast path; its output is unchanged.
