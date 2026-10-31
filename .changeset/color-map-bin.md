---
"color-map": minor
---

Add the `color-map` command and an agent skill to the package. `npx color-map` runs `convert`, `mix`, `contrast`, `find-contrast`, `scale`, `palette`, `harmony`, `export` and `schema`; output is TOON by default (`--format json` for JSON), errors are coded, and WCAG 2 is the contrast measure. The package also ships JSON Schemas for every command's options (`color-map/schemas/*`), an `llms.txt`, and a `color-map` skill as a plugin for Claude Code, Cursor, Codex and Copilot CLI. The package still has no runtime dependencies, and the library entry points do not load the command.
