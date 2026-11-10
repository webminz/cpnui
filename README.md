# CPN Editor

A browser-based editor for **Coloured Petri Nets (CPNs)**, built with Angular and plain SVG. Everything runs client-side: draw places, transitions and arcs on a zoomable canvas, write Standard ML declarations, guards and arc inscriptions, and import/export CPN Tools (`.cpn`) files.

> **About this project:** CPN Editor started as a small hobby side project to explore
> *"vibe coding"* / *agentic coding*: how far you can get building a non-trivial
> application mostly by steering AI coding agents, and where that approach hits its limits.
> Most of the code was written by an AI agent (Claude Code), guided by the phased plans in
> [`backlog/`](backlog/). Expect rough edges. It is an experiment, not a polished product.

## Features

- Palette and keyboard-driven editing (`V` select, `P` place, `T` transition, `A` arc, `H` pan)
- Zoom/pan canvas with grid, snap-to-grid, light/dark themes
- Property panel and Standard ML declarations editor (CodeMirror, syntax highlighting)
- Semantic checks (colour sets, types) with an issues panel
- Import/export of CPN Tools files, plus SVG/PNG export
- Undo/redo; hold `?` for a shortcut cheatsheet

PNML import/export and hierarchical nets are planned (see [`backlog/`](backlog/)).

## Getting started

Requires Node.js (LTS) and npm.

```bash
cd cpn-editor
npm install
npm start        # dev server on http://localhost:4200
npm run build    # production build in dist/cpn-editor
npx ng test --watch=false   # unit tests (vitest)
```

## Repository layout

| Path | Contents |
|------|----------|
| `cpn-editor/` | The Angular application |
| `backlog/` | Phase-by-phase plans used to drive the agent |
| `product_vision.md` | The original goals of the project |
| `definitions/` | PNML / CPN schema definitions (RNG, DTD) |
| `samples/` | Example nets |
| `CLAUDE.md` | Architecture notes for humans and AI agents |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2026 Patrick Stünkel
