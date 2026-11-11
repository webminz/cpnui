# CPN Editor

A browser-based Coloured Petri Net editor built with Angular 21 and SVG.

## Quick Reference

```bash
cd cpn-editor
npm start          # ng serve → http://localhost:4200
npm run build      # production build → dist/cpn-editor
npm test           # vitest
```

## Project Structure

```
cpn-editor/src/app/
├── core/model/          # Domain types (Place, Transition, Arc, CpnNet) + factories
├── state/               # Signal-based services (net-store, canvas-store, selection-store, interaction-mode-store)
├── canvas/              # SVG canvas + element renderers (place, transition, arc)
├── toolbar/             # Top bar: zoom %, viewport center coords, grid/snap/theme toggles
├── palette/             # Left sidebar: tool buttons (Select V, Place P, Transition T, Arc A, Pan H)
├── shared/              # Utilities: geometry, SVG path math, ID generation
├── pnml/                # (empty — future PNML import/export)
├── properties/          # (empty — future property panel)
├── app.ts               # Root component: CSS grid shell (toolbar | palette | canvas)
└── styles.scss          # Global CSS variables, light/dark themes (Catppuccin Mocha for dark)
```

## Architecture

### State Layer (Angular Signals)

All state lives in four `@Injectable({ providedIn: 'root' })` services using Angular signals (no RxJS for state). Mutations use `structuredClone` for immutability.

| Service | Responsibility |
|---------|---------------|
| `NetStoreService` | CPN model: places, transitions, arcs. Enforces arc constraints (place↔transition only). Cascading arc deletion on element removal. |
| `CanvasStoreService` | Viewport: zoom (0.1–5x), pan offset, grid size/snap/visibility, dark mode, viewport size. Exposes `canvasTransform` and `viewportCenter` computed signals. |
| `SelectionStoreService` | Selected element IDs (`Set<string>`). Single-select by default, shift-click toggles. |
| `InteractionModeStoreService` | Active tool mode (`select|place|transition|arc|pan`) and arc creation state. |

### SVG Rendering — The Transform Group Pattern

The canvas uses a **`<g transform>` approach** instead of SVG `viewBox` manipulation. This is the most important architectural decision to understand:

```
<svg>                              ← pixel-coordinate viewport, no viewBox
  <defs>...</defs>                 ← patterns, markers (coordinate-independent)
  <g transform="translate(panX, panY) scale(zoom)">   ← THE transform group
    <rect fill="url(#grid-pattern)"/>                  ← grid background
    <g cpn-arc-renderer />                             ← arcs (rendered first = behind)
    <g cpn-place-renderer />                           ← places (circles)
    <g cpn-transition-renderer />                      ← transitions (rectangles)
    <line class="arc-preview-line"/>                    ← arc creation preview
  </g>
</svg>
```

**Why not viewBox?** A previous implementation used `viewBox` with a fixed 10000×10000 square. Since the SVG element is rectangular, `preserveAspectRatio` created letterbox bands where clicks were ignored. Zoom also caused pan drift because the math assumed viewBox filled the entire bounding rect. The `<g transform>` approach eliminates these issues entirely — the SVG uses pixel coordinates and all zoom/pan is a simple affine transform on the content group.

**Coordinate conversion** (screen → world):
```
worldX = (screenX - svgRect.left - panX) / zoom
worldY = (screenY - svgRect.top  - panY) / zoom
```

**Focal zoom** (zoom toward cursor):
```
newPan = cursorScreen - (newZoom / oldZoom) * (cursorScreen - oldPan)
```

**Pan**: Direct screen-pixel offset addition. Arrow keys use `panWorld()` which multiplies world units by zoom to get screen pixels.

### Renderers

Each element type has a standalone Angular component used as an SVG `<g>` attribute directive:

- **PlaceRendererComponent** — circle + optional selection ring (dashed) + name label
- **TransitionRendererComponent** — rect + optional selection ring (dashed) + name label
- **ArcRendererComponent** — SVG path with arrowhead marker + transparent fat hit area (12px)

Arc endpoint math (`svg-path.util.ts`) clips arcs to circle perimeters and rectangle edges so arrows point at the shape boundary, not the center.

### Interaction Handling

All pointer events are handled in `CanvasComponent`:

- Element clicks call `onElementPointerDown` which does `stopPropagation()`, so any click that reaches `onPointerDown` is guaranteed to be a background click (no target-checking needed).
- Drag uses a `DragState` that records start mouse position and element position in world coords, then computes deltas on move.
- `ResizeObserver` on the SVG element keeps `CanvasStoreService._viewportSize` in sync for the viewport center display.

### SVG / PNG Export (`shared/export.util.ts`)

Component styles are emulated-encapsulated CSS, so a cloned SVG has no styling. `prepareExportSvg` walks the **live** SVG and its clone in parallel, inlining `getComputedStyle` values from the live element (a detached clone yields empty styles). UI chrome is stripped, the transform group is replaced by a `viewBox` over the rendered bounds (`getBBox` union, model bounds as fallback), and the output size is world size × current zoom so screen-sized decorations (fonts, arrowheads at `n / zoom`) look exactly as in the editor. Background is the computed canvas colour (theme-aware).

### CPN Import Notes (`cpn/cpn-import.ts`)

- Older CPN Tools files (format 2) have no `<layout>`; colour sets, vars and ml declarations are reconstructed from the structured XML.
- `Black`/`White` line/text/fill attributes are CPN Tools defaults and are imported as *unset* so themed defaults apply.
- Legacy nets are laid out at a tiny scale; `normalizeNetScale` scales them so the median place height is 40. The toolbar then calls `CanvasStoreService.fitToBounds`.
- Colour-set colours are editor-specific and round-trip via an XML comment `<!-- cpn-editor:colour=#hex -->` inside `<color>`.

## Data Model

```
CpnNet
  └── Page[]  (currently only pages[0] used)
        ├── Place[]     { kind, id, name, position, radius, colourSetId, initialMarking }
        ├── Transition[] { kind, id, name, position, size, guard }
        └── Arc[]       { kind, id, sourceId, targetId, bendPoints, inscription, arcType }
```

Factory functions in `core/model/factory.ts` auto-name elements (P1, P2, T1, T2...) and assign UUIDs.

## Theming

CSS custom properties prefixed `--cpn-*` defined in `styles.scss`. Dark mode toggles `.theme-dark` on the root component, which overrides all variables. Color scheme:
- Places: blue (`--cpn-place-stroke`)
- Transitions: green (`--cpn-transition-stroke`)
- Arcs: gray (`--cpn-arc-stroke`)
- Selection: orange (`--cpn-selection`)

## Conventions

- All components are `standalone: true` (no NgModules)
- TypeScript strict mode with Angular strict templates
- State mutations always clone before mutating (`structuredClone`)
- Prettier: 100 char width, single quotes
- Keyboard shortcuts are single letters (V, P, T, A, H) handled in `PaletteComponent`

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `webminz/cpnui` (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.
