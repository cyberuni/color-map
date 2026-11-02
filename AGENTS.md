# AGENTS.md

## Naming

Exported names treat acronyms as whole words, in camelCase or PascalCase: `Id`, not `ID`; `toDtcg`, not `toDTCG`. This follows the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html#naming-style): "Treat abbreviations like acronyms in names as whole words, i.e. use `loadHttpUrl`, not `loadHTTPURL`, unless required by a platform name (e.g. `XMLHttpRequest`)."

The one exception is the legacy `RGB` and `RGBA` types. They are published and belong to the frozen legacy API, so they keep their names.
