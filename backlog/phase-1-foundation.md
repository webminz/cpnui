# Phase 1: Foundation & Interactive Canvas

## Status: DONE

### Completed
- [x] Scaffold Angular project
- [x] Core data model interfaces (Place, Transition, Arc, CpnNet, Page, ColourSet)
- [x] Factory functions (createDefaultPlace, createDefaultTransition, createDefaultArc, createDefaultNet)
- [x] Shared utilities (id-generator, geometry, svg-path)
- [x] Signal-based state stores (NetStore, CanvasStore, SelectionStore, InteractionModeStore)
- [x] App shell layout (CSS Grid: toolbar top, palette left, canvas center)
- [x] Toolbar (app title, zoom display, grid toggle, snap toggle)
- [x] Palette (Select/Place/Transition/Arc tools with keyboard shortcuts V/P/T/A)
- [x] SVG canvas with dot grid pattern
- [x] Zoom (scroll wheel at cursor focal point)
- [x] Pan (middle-click drag)
- [x] Place creation (click in Place mode)
- [x] Transition creation (click in Transition mode)
- [x] Arc creation (click source then target, bipartite constraint enforced)
- [x] Selection (click to select with visual highlight, click empty to deselect)
- [x] Drag to move (selected elements, connected arcs follow)
- [x] Delete (Delete/Backspace removes selected elements + connected arcs)
- [x] Arc preview line during arc creation
- [x] Escape key to cancel arc creation and clear selection
