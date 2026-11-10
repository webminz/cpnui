import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NetStoreService } from '../state/net-store.service';
import { CanvasStoreService } from '../state/canvas-store.service';
import { SelectionStoreService } from '../state/selection-store.service';
import { InteractionModeStoreService } from '../state/interaction-mode-store.service';
import { HistoryService } from '../state/history.service';
import { PlaceRendererComponent } from './place-renderer.component';
import { TransitionRendererComponent } from './transition-renderer.component';
import { ArcRendererComponent } from './arc-renderer.component';
import { Point, Rect, Size } from '../core/model';
import { snapToGrid } from '../shared/geometry.util';
import { ViolationService } from '../state/violation.service';
import { UiStoreService } from '../state/ui-store.service';

type DragState =
  | { type: 'move'; elementIds: string[]; startMouse: Point; startPositions: Map<string, Point> }
  | { type: 'bend-point'; arcId: string; bendPointIndex: number; startMouse: Point; startPosition: Point }
  | { type: 'resize-place'; placeId: string; startMouse: Point; startSize: Size }
  | { type: 'resize-transition'; transitionId: string; startMouse: Point; startSize: Size }
  | { type: 'label'; elementId: string; labelKey: string; startMouse: Point; startOffset: Point };

@Component({
  selector: 'cpn-canvas',
  standalone: true,
  imports: [
    PlaceRendererComponent,
    TransitionRendererComponent,
    ArcRendererComponent,
  ],
  template: `
    <div class="canvas-wrapper">
      <svg
        #svgElement
        class="canvas-svg"
        [style.cursor]="cursor()"
        (wheel)="onWheel($event)"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp($event)"
        (pointerleave)="onPointerLeave()"
        (contextmenu)="$event.preventDefault()"
      >
        <defs>
          @if (canvasStore.showGrid()) {
            @if (showSubGrid()) {
              <pattern
                id="grid-sub"
                [attr.width]="gridSub()"
                [attr.height]="gridSub()"
                patternUnits="userSpaceOnUse"
              >
                <line x1="0" y1="0" [attr.x2]="gridSub()" y2="0" class="grid-line-sub" />
                <line x1="0" y1="0" x2="0" [attr.y2]="gridSub()" class="grid-line-sub" />
              </pattern>
            }
            <pattern
              id="grid-minor"
              [attr.width]="gridMinor()"
              [attr.height]="gridMinor()"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" [attr.x2]="gridMinor()" y2="0" class="grid-line-minor" />
              <line x1="0" y1="0" x2="0" [attr.y2]="gridMinor()" class="grid-line-minor" />
            </pattern>
            <pattern
              id="grid-major"
              [attr.width]="gridMajor()"
              [attr.height]="gridMajor()"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" [attr.x2]="gridMajor()" y2="0" class="grid-line-major" />
              <line x1="0" y1="0" x2="0" [attr.y2]="gridMajor()" class="grid-line-major" />
            </pattern>
          }
          <marker
            id="arrowhead"
            [attr.markerWidth]="markerWidth()"
            [attr.markerHeight]="markerHeight()"
            [attr.refX]="markerRefX()"
            [attr.refY]="markerRefY()"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <polygon [attr.points]="markerPoints()" class="arrowhead-fill" />
          </marker>
          <marker
            id="arrowhead-selected"
            [attr.markerWidth]="markerWidth()"
            [attr.markerHeight]="markerHeight()"
            [attr.refX]="markerRefX()"
            [attr.refY]="markerRefY()"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <polygon [attr.points]="markerPoints()" class="arrowhead-selected-fill" />
          </marker>
        </defs>

        <g [attr.transform]="canvasStore.canvasTransform()">
          @if (canvasStore.showGrid()) {
            @if (showSubGrid()) {
              <rect x="-5000" y="-5000" width="15000" height="15000" fill="url(#grid-sub)" />
            }
            @if (showMinorGrid()) {
              <rect x="-5000" y="-5000" width="15000" height="15000" fill="url(#grid-minor)" />
            }
            <rect x="-5000" y="-5000" width="15000" height="15000" fill="url(#grid-major)" />
          }

          @for (arc of netStore.arcs(); track arc.id) {
            <g
              cpn-arc-renderer
              [arc]="arc"
              [selected]="selectionStore.isSelected(arc.id)"
              [hasViolation]="violationService.violatingElementIds().has(arc.id)"
              (pointerdown)="onElementPointerDown($event, arc.id)"
              (dblclick)="onArcDblClick($event, arc.id)"
              (bendPointPointerDown)="onBendPointPointerDown($event, arc.id)"
              (midpointPointerDown)="onMidpointPointerDown($event, arc.id)"
              (bendPointDblClick)="onBendPointDblClick($event, arc.id)"
              (labelPointerDown)="onLabelPointerDown($event, arc.id)"
            />
          }

          @for (place of netStore.places(); track place.id) {
            <g
              cpn-place-renderer
              [place]="place"
              [selected]="selectionStore.isSelected(place.id)"
              [hasViolation]="violationService.violatingElementIds().has(place.id)"
              (pointerdown)="onElementPointerDown($event, place.id)"
              (dblclick)="onElementDblClick($event, place.id)"
              (resizePointerDown)="onPlaceResizePointerDown($event, place.id)"
              (labelPointerDown)="onLabelPointerDown($event, place.id)"
            />
          }

          @for (transition of netStore.transitions(); track transition.id) {
            <g
              cpn-transition-renderer
              [transition]="transition"
              [selected]="selectionStore.isSelected(transition.id)"
              [hasViolation]="violationService.violatingElementIds().has(transition.id)"
              (pointerdown)="onElementPointerDown($event, transition.id)"
              (dblclick)="onElementDblClick($event, transition.id)"
              (resizePointerDown)="onTransitionResizePointerDown($event, transition.id)"
              (labelPointerDown)="onLabelPointerDown($event, transition.id)"
            />
          }

          @if (arcPreviewLine()) {
            <line
              [attr.x1]="arcPreviewLine()!.x1"
              [attr.y1]="arcPreviewLine()!.y1"
              [attr.x2]="arcPreviewLine()!.x2"
              [attr.y2]="arcPreviewLine()!.y2"
              class="arc-preview-line"
              vector-effect="non-scaling-stroke"
            />
          }

          @if (rubberBandRect()) {
            <rect
              [attr.x]="rubberBandRect()!.x"
              [attr.y]="rubberBandRect()!.y"
              [attr.width]="rubberBandRect()!.width"
              [attr.height]="rubberBandRect()!.height"
              class="rubber-band"
              vector-effect="non-scaling-stroke"
            />
          }

          @if (ghostPosition(); as gp) {
            @if (interactionStore.mode() === 'place') {
              <circle
                [attr.cx]="gp.x" [attr.cy]="gp.y" r="25"
                class="ghost-element ghost-place"
                vector-effect="non-scaling-stroke"
              />
            }
            @if (interactionStore.mode() === 'transition') {
              <rect
                [attr.x]="gp.x - 30" [attr.y]="gp.y - 20"
                width="60" height="40"
                class="ghost-element ghost-transition"
                vector-effect="non-scaling-stroke"
              />
            }
          }
        </g>
      </svg>

      @if (inlineEditId()) {
        <input
          #inlineInput
          class="inline-edit-input"
          [style.left.px]="inlineEditScreenPos()!.x"
          [style.top.px]="inlineEditScreenPos()!.y"
          [value]="inlineEditValue()"
          (input)="inlineEditValue.set(inlineInput.value)"
          (blur)="commitInlineEdit()"
          (keydown.enter)="commitInlineEdit()"
          (keydown.escape)="cancelInlineEdit()"
        />
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .canvas-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .canvas-svg {
      width: 100%;
      height: 100%;
      background: var(--cpn-bg-canvas);
    }
    .grid-dot {
      fill: var(--cpn-grid-dot);
    }
    .grid-line-sub {
      stroke: var(--cpn-grid-line-sub);
      stroke-width: 0.5;
    }
    .grid-line-minor {
      stroke: var(--cpn-grid-line-minor);
      stroke-width: 0.5;
    }
    .grid-line-major {
      stroke: var(--cpn-grid-line-major);
      stroke-width: 1;
    }
    .arrowhead-fill {
      fill: var(--cpn-arrowhead);
    }
    .arrowhead-selected-fill {
      fill: var(--cpn-selection);
    }
    .arc-preview-line {
      stroke: var(--cpn-arc-preview);
      stroke-width: 2;
      stroke-dasharray: 6 4;
      pointer-events: none;
    }
    .rubber-band {
      fill: var(--cpn-rubber-band-fill, rgba(37, 99, 235, 0.08));
      stroke: var(--cpn-rubber-band-stroke, rgba(37, 99, 235, 0.5));
      stroke-width: 1;
      stroke-dasharray: 4 2;
      pointer-events: none;
    }
    .ghost-element {
      pointer-events: none;
      opacity: 0.3;
      stroke-dasharray: 6 4;
      fill: none;
      stroke-width: 2;
    }
    .ghost-place {
      stroke: var(--cpn-place-stroke);
    }
    .ghost-transition {
      stroke: var(--cpn-transition-stroke);
    }
    .inline-edit-input {
      position: absolute;
      transform: translate(-50%, -50%);
      border: 1px solid var(--cpn-active);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 12px;
      font-family: inherit;
      background: var(--cpn-bg-surface);
      color: var(--cpn-text);
      outline: none;
      min-width: 60px;
      text-align: center;
    }
  `,
})
export class CanvasComponent {
  readonly netStore = inject(NetStoreService);
  readonly canvasStore = inject(CanvasStoreService);
  readonly selectionStore = inject(SelectionStoreService);
  readonly interactionStore = inject(InteractionModeStoreService);
  private readonly historyService = inject(HistoryService);
  readonly violationService = inject(ViolationService);
  readonly uiStore = inject(UiStoreService);
  private readonly destroyRef = inject(DestroyRef);

  // Grid level sizes
  readonly gridMinor = computed(() => this.canvasStore.gridSize());
  readonly gridMajor = computed(() => this.canvasStore.gridSize() * 5);
  readonly gridSub = computed(() => this.canvasStore.gridSize() / 4);
  readonly showSubGrid = computed(() => this.canvasStore.zoom() >= 1.5);
  readonly showMinorGrid = computed(() => this.canvasStore.zoom() >= 0.3);

  // Marker dimensions scaled by inverse zoom so arrowheads appear constant size on screen
  private readonly BASE_MARKER_W = 14;
  private readonly BASE_MARKER_H = 10;
  private readonly BASE_MARKER_REF_X = 13;
  private readonly BASE_MARKER_REF_Y = 5;
  readonly markerWidth = computed(() => this.BASE_MARKER_W / this.canvasStore.zoom());
  readonly markerHeight = computed(() => this.BASE_MARKER_H / this.canvasStore.zoom());
  readonly markerRefX = computed(() => this.BASE_MARKER_REF_X / this.canvasStore.zoom());
  readonly markerRefY = computed(() => this.BASE_MARKER_REF_Y / this.canvasStore.zoom());
  readonly markerPoints = computed(() => {
    const w = this.markerWidth();
    const h = this.markerHeight();
    return `0 0, ${w} ${h / 2}, 0 ${h}`;
  });

  readonly svgRef = viewChild.required<ElementRef<SVGSVGElement>>('svgElement');

  constructor() {
    afterNextRender(() => {
      const el = this.svgRef().nativeElement;
      const ro = new ResizeObserver((entries) => {
        const rect = entries[0].contentRect;
        this.canvasStore.setViewportSize(rect.width, rect.height);
      });
      ro.observe(el);
      this.destroyRef.onDestroy(() => ro.disconnect());
      const rect = el.getBoundingClientRect();
      this.canvasStore.setViewportSize(rect.width, rect.height);
    });
  }

  // --- Drag state ---
  private drag = signal<DragState | null>(null);
  private isPanning = signal(false);
  private lastPanPoint = signal<Point | null>(null);

  // --- Arc preview ---
  readonly arcPreviewLine = signal<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  // --- Rubber band ---
  private rubberBandStart = signal<Point | null>(null);
  private rubberBandEnd = signal<Point | null>(null);
  readonly rubberBandRect = computed<Rect | null>(() => {
    const start = this.rubberBandStart();
    const end = this.rubberBandEnd();
    if (!start || !end) return null;
    return {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
  });

  // --- Ghost element ---
  readonly ghostPosition = signal<Point | null>(null);

  // --- Inline edit ---
  readonly inlineEditId = signal<string | null>(null);
  readonly inlineEditValue = signal('');
  readonly inlineEditScreenPos = signal<Point | null>(null);

  readonly cursor = computed(() => {
    if (this.isPanning()) return 'grabbing';
    const mode = this.interactionStore.mode();
    switch (mode) {
      case 'pan': return 'grab';
      case 'select': return 'default';
      default: return 'crosshair';
    }
  });

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.canvasStore.zoomAtScreen(
      { x: event.clientX, y: event.clientY },
      event.deltaY,
      this.svgRef().nativeElement
    );
  }

  onPointerDown(event: PointerEvent): void {
    const mode = this.interactionStore.mode();

    // Middle button or pan mode with left button → pan
    if (event.button === 1 || (event.button === 0 && mode === 'pan')) {
      event.preventDefault();
      this.isPanning.set(true);
      this.lastPanPoint.set({ x: event.clientX, y: event.clientY });
      (event.target as Element).setPointerCapture(event.pointerId);
      return;
    }

    if (event.button !== 0) return;

    const worldPos = this.getWorldPosition(event);

    switch (mode) {
      case 'place': {
        const pos = this.maybeSnap(worldPos);
        this.netStore.addPlace(pos);
        break;
      }
      case 'transition': {
        const pos = this.maybeSnap(worldPos);
        this.netStore.addTransition(pos);
        break;
      }
      case 'arc': {
        this.interactionStore.cancelArcCreation();
        this.arcPreviewLine.set(null);
        break;
      }
      case 'select': {
        // Start rubber band
        this.rubberBandStart.set(worldPos);
        this.rubberBandEnd.set(worldPos);
        (event.target as Element).setPointerCapture(event.pointerId);
        break;
      }
    }
  }

  onElementPointerDown(event: PointerEvent, elementId: string): void {
    if (event.button !== 0) return;
    event.stopPropagation();

    const mode = this.interactionStore.mode();

    if (mode === 'arc') {
      this.handleArcClick(elementId);
      return;
    }

    if (mode === 'pan') return;

    // Select mode: handle selection + drag
    if (event.shiftKey) {
      this.selectionStore.toggle(elementId);
    } else if (!this.selectionStore.isSelected(elementId)) {
      this.selectionStore.select(elementId);
    }

    // Start drag — drag all selected elements
    const selectedIds = [...this.selectionStore.getSelectedIds()];
    // If clicked element is not in selection (shouldn't happen after above logic), just drag it alone
    const dragIds = selectedIds.includes(elementId) ? selectedIds : [elementId];
    const startPositions = new Map<string, Point>();
    for (const id of dragIds) {
      const el = this.netStore.findElement(id);
      if (el) startPositions.set(id, { ...el.position });
    }

    if (startPositions.size > 0) {
      this.historyService.beginBatch();
      const worldPos = this.getWorldPosition(event);
      this.drag.set({
        type: 'move',
        elementIds: dragIds,
        startMouse: worldPos,
        startPositions,
      });
      (event.target as Element).setPointerCapture(event.pointerId);
    }
  }

  onElementDblClick(event: MouseEvent, elementId: string): void {
    if (this.interactionStore.mode() !== 'select') return;
    event.stopPropagation();

    const el = this.netStore.findElement(elementId);
    if (!el) return;

    // Compute screen position of the label (below the element)
    const svgRect = this.svgRef().nativeElement.getBoundingClientRect();
    const zoom = this.canvasStore.zoom();
    const pan = this.canvasStore.panOffset();
    const labelOffsetY = el.size.height / 2 + 16;
    const screenX = el.position.x * zoom + pan.x + svgRect.left;
    const screenY = (el.position.y + labelOffsetY) * zoom + pan.y + svgRect.top;

    // Convert to wrapper-relative coords
    const wrapperRect = this.svgRef().nativeElement.parentElement!.getBoundingClientRect();
    this.inlineEditId.set(elementId);
    this.inlineEditValue.set(el.name);
    this.inlineEditScreenPos.set({
      x: screenX - wrapperRect.left,
      y: screenY - wrapperRect.top,
    });

    // Focus the input on next tick
    requestAnimationFrame(() => {
      const input = this.svgRef().nativeElement.parentElement!.querySelector<HTMLInputElement>('.inline-edit-input');
      if (input) {
        input.focus();
        input.select();
      }
    });
  }

  onArcDblClick(event: MouseEvent, arcId: string): void {
    if (this.interactionStore.mode() !== 'select') return;
    event.stopPropagation();
    this.selectionStore.select(arcId);
    this.selectionStore.focusField.set('inscription');
  }

  onBendPointPointerDown(
    payload: { event: PointerEvent; bendPointIndex: number },
    arcId: string,
  ): void {
    this.historyService.beginBatch();
    const arc = this.netStore.arcs().find((a) => a.id === arcId);
    if (!arc) return;
    const bp = arc.bendPoints[payload.bendPointIndex];
    const worldPos = this.getWorldPosition(payload.event);
    this.drag.set({
      type: 'bend-point',
      arcId,
      bendPointIndex: payload.bendPointIndex,
      startMouse: worldPos,
      startPosition: { ...bp },
    });
    // Do NOT setPointerCapture here — it prevents dblclick from firing on the
    // bend point circle (mouseup is redirected to the SVG, so click/dblclick
    // never target the circle). Drag still works via event bubbling.
  }

  onMidpointPointerDown(
    payload: { event: PointerEvent; segmentIndex: number },
    arcId: string,
  ): void {
    const worldPos = this.getWorldPosition(payload.event);
    const snappedPos = this.maybeSnap(worldPos);
    this.netStore.insertBendPoint(arcId, payload.segmentIndex, snappedPos);
    // Now start dragging the newly inserted bend point
    this.historyService.beginBatch();
    this.drag.set({
      type: 'bend-point',
      arcId,
      bendPointIndex: payload.segmentIndex,
      startMouse: worldPos,
      startPosition: { ...snappedPos },
    });
    this.svgRef().nativeElement.setPointerCapture(payload.event.pointerId);
  }

  onBendPointDblClick(
    payload: { event: MouseEvent; bendPointIndex: number },
    arcId: string,
  ): void {
    this.netStore.removeBendPoint(arcId, payload.bendPointIndex);
  }

  onLabelPointerDown(
    payload: { event: PointerEvent; labelKey: string },
    elementId: string,
  ): void {
    const obj = this.netStore.findObject(elementId);
    if (!obj) return;
    this.historyService.beginBatch();
    const worldPos = this.getWorldPosition(payload.event);

    // Get current offset for this label key
    let startOffset: Point = { x: 0, y: 0 };
    if (obj.kind === 'place' && obj.labelOffsets) {
      const key = payload.labelKey as keyof typeof obj.labelOffsets;
      startOffset = obj.labelOffsets[key] ?? { x: 0, y: 0 };
    } else if (obj.kind === 'transition' && obj.labelOffsets) {
      const key = payload.labelKey as keyof typeof obj.labelOffsets;
      startOffset = obj.labelOffsets[key] ?? { x: 0, y: 0 };
    } else if (obj.kind === 'arc' && obj.labelOffsets) {
      const key = payload.labelKey as keyof typeof obj.labelOffsets;
      startOffset = obj.labelOffsets[key] ?? { x: 0, y: 0 };
    }

    this.drag.set({
      type: 'label',
      elementId,
      labelKey: payload.labelKey,
      startMouse: worldPos,
      startOffset: { ...startOffset },
    });
  }

  onPlaceResizePointerDown(
    payload: { event: PointerEvent; direction: number },
    placeId: string,
  ): void {
    const place = this.netStore.findElement(placeId);
    if (!place || place.kind !== 'place') return;
    this.historyService.beginBatch();
    const worldPos = this.getWorldPosition(payload.event);
    this.drag.set({
      type: 'resize-place',
      placeId,
      startMouse: worldPos,
      startSize: { ...place.size },
    });
    this.svgRef().nativeElement.setPointerCapture(payload.event.pointerId);
  }

  onTransitionResizePointerDown(
    payload: { event: PointerEvent; direction: number },
    transitionId: string,
  ): void {
    const trans = this.netStore.findElement(transitionId);
    if (!trans || trans.kind !== 'transition') return;
    this.historyService.beginBatch();
    const worldPos = this.getWorldPosition(payload.event);
    this.drag.set({
      type: 'resize-transition',
      transitionId,
      startMouse: worldPos,
      startSize: { ...trans.size },
    });
    this.svgRef().nativeElement.setPointerCapture(payload.event.pointerId);
  }

  commitInlineEdit(): void {
    const id = this.inlineEditId();
    const value = this.inlineEditValue();
    if (id && value.trim()) {
      const el = this.netStore.findObject(id);
      if (el?.kind === 'place') {
        this.netStore.updatePlace(id, { name: value.trim() });
      } else if (el?.kind === 'transition') {
        this.netStore.updateTransition(id, { name: value.trim() });
      }
    }
    this.inlineEditId.set(null);
  }

  cancelInlineEdit(): void {
    this.inlineEditId.set(null);
  }

  onPointerMove(event: PointerEvent): void {
    const worldPos = this.getWorldPosition(event);

    // Update ghost position
    const mode = this.interactionStore.mode();
    if (mode === 'place' || mode === 'transition') {
      this.ghostPosition.set(this.maybeSnap(worldPos));
    }

    // Pan
    if (this.isPanning()) {
      const last = this.lastPanPoint();
      if (last) {
        this.canvasStore.pan(
          event.clientX - last.x,
          event.clientY - last.y,
        );
        this.lastPanPoint.set({ x: event.clientX, y: event.clientY });
      }
      return;
    }

    // Arc preview line
    if (this.interactionStore.arcCreation()) {
      const source = this.netStore.findElement(
        this.interactionStore.arcCreation()!.sourceId
      );
      if (source) {
        this.arcPreviewLine.set({
          x1: source.position.x,
          y1: source.position.y,
          x2: worldPos.x,
          y2: worldPos.y,
        });
      }
    }

    // Rubber band
    if (this.rubberBandStart()) {
      this.rubberBandEnd.set(worldPos);
      this.updateRubberBandSelection();
      return;
    }

    // Drag
    const dragState = this.drag();
    if (dragState) {
      this.handleDragMove(dragState, worldPos);
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (this.isPanning()) {
      this.isPanning.set(false);
      this.lastPanPoint.set(null);
      return;
    }

    // Rubber band finalize
    if (this.rubberBandStart()) {
      const rect = this.rubberBandRect();
      this.rubberBandStart.set(null);
      this.rubberBandEnd.set(null);
      // If band was tiny (< 3px world), treat as background click → clear selection
      if (!rect || (rect.width < 3 && rect.height < 3)) {
        this.selectionStore.clear();
      }
      return;
    }

    if (this.drag()) {
      this.drag.set(null);
      this.historyService.endBatch();
    }
  }

  onPointerLeave(): void {
    this.ghostPosition.set(null);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target as HTMLElement).closest?.('.cm-editor') !== null
    ) {
      return;
    }
    // Undo / Redo
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.historyService.undo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && (event.key === 'Z' || (event.key === 'z' && event.shiftKey) || event.key === 'y')) {
      event.preventDefault();
      this.historyService.redo();
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      const ids = this.selectionStore.getSelectedIds();
      if (ids.size > 0) {
        event.preventDefault();
        this.netStore.deleteElements(ids);
        this.selectionStore.clear();
      }
    }
    if (event.key === 'Escape') {
      const mode = this.interactionStore.mode();
      if (mode === 'place' || mode === 'transition' || mode === 'arc' || mode === 'pan') {
        this.interactionStore.setMode('select');
        this.arcPreviewLine.set(null);
        this.ghostPosition.set(null);
      } else {
        this.selectionStore.clear();
      }
    }

    if (event.key === 'g' || event.key === 'G') {
      this.uiStore.toggleDeclarationsPanel();
      return;
    }
    if (event.key === 'i' || event.key === 'I') {
      this.uiStore.toggleViolationsPanel();
      return;
    }

    const panStep = this.canvasStore.gridSize() * 5;
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.canvasStore.panWorld(panStep, 0);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.canvasStore.panWorld(-panStep, 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.canvasStore.panWorld(0, panStep);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.canvasStore.panWorld(0, -panStep);
        break;
    }
  }

  private handleDragMove(dragState: DragState, worldPos: Point): void {
    switch (dragState.type) {
      case 'move': {
        const dx = worldPos.x - dragState.startMouse.x;
        const dy = worldPos.y - dragState.startMouse.y;
        let snappedDelta = { x: dx, y: dy };
        if (this.canvasStore.snapToGrid()) {
          const firstId = dragState.elementIds[0];
          const startPos = dragState.startPositions.get(firstId)!;
          const rawPos = { x: startPos.x + dx, y: startPos.y + dy };
          const snappedPos = snapToGrid(rawPos, this.canvasStore.gridSize());
          snappedDelta = { x: snappedPos.x - startPos.x, y: snappedPos.y - startPos.y };
        }
        if (dragState.elementIds.length === 1) {
          const startPos = dragState.startPositions.get(dragState.elementIds[0])!;
          this.netStore.moveElement(dragState.elementIds[0], {
            x: startPos.x + snappedDelta.x,
            y: startPos.y + snappedDelta.y,
          });
        } else {
          const moves = new Map<string, Point>();
          for (const id of dragState.elementIds) {
            const startPos = dragState.startPositions.get(id)!;
            moves.set(id, {
              x: startPos.x + snappedDelta.x,
              y: startPos.y + snappedDelta.y,
            });
          }
          this.netStore.moveElements(moves);
        }
        break;
      }
      case 'bend-point': {
        const dx = worldPos.x - dragState.startMouse.x;
        const dy = worldPos.y - dragState.startMouse.y;
        let newPos = {
          x: dragState.startPosition.x + dx,
          y: dragState.startPosition.y + dy,
        };
        newPos = this.maybeSnap(newPos);
        this.netStore.moveBendPoint(dragState.arcId, dragState.bendPointIndex, newPos);
        break;
      }
      case 'resize-place': {
        const place = this.netStore.findElement(dragState.placeId);
        if (place && place.kind === 'place') {
          const dx = Math.abs(worldPos.x - place.position.x) * 2;
          const dy = Math.abs(worldPos.y - place.position.y) * 2;
          let newSize = { width: dx, height: dy };
          if (this.canvasStore.snapToGrid()) {
            const gs = this.canvasStore.gridSize();
            newSize = {
              width: Math.round(dx / gs) * gs,
              height: Math.round(dy / gs) * gs,
            };
          }
          this.netStore.resizePlace(dragState.placeId, newSize);
        }
        break;
      }
      case 'resize-transition': {
        const trans = this.netStore.findElement(dragState.transitionId);
        if (trans && trans.kind === 'transition') {
          const dx = Math.abs(worldPos.x - trans.position.x) * 2;
          const dy = Math.abs(worldPos.y - trans.position.y) * 2;
          let newSize = { width: dx, height: dy };
          if (this.canvasStore.snapToGrid()) {
            const gs = this.canvasStore.gridSize();
            newSize = {
              width: Math.round(dx / gs) * gs,
              height: Math.round(dy / gs) * gs,
            };
          }
          this.netStore.resizeTransition(dragState.transitionId, newSize);
        }
        break;
      }
      case 'label': {
        const dx = worldPos.x - dragState.startMouse.x;
        const dy = worldPos.y - dragState.startMouse.y;
        const newOffset = {
          x: dragState.startOffset.x + dx,
          y: dragState.startOffset.y + dy,
        };
        const obj = this.netStore.findObject(dragState.elementId);
        if (!obj) break;
        if (obj.kind === 'place') {
          const offsets = { ...(obj.labelOffsets ?? {}), [dragState.labelKey]: newOffset };
          this.netStore.updatePlace(dragState.elementId, { labelOffsets: offsets });
        } else if (obj.kind === 'transition') {
          const offsets = { ...(obj.labelOffsets ?? {}), [dragState.labelKey]: newOffset };
          this.netStore.updateTransition(dragState.elementId, { labelOffsets: offsets });
        } else if (obj.kind === 'arc') {
          const offsets = { ...(obj.labelOffsets ?? {}), [dragState.labelKey]: newOffset };
          this.netStore.updateArc(dragState.elementId, { labelOffsets: offsets });
        }
        break;
      }
    }
  }

  private handleArcClick(elementId: string): void {
    const element = this.netStore.findElement(elementId);
    if (!element) return;

    const arcState = this.interactionStore.arcCreation();
    if (!arcState) {
      this.interactionStore.startArcCreation(elementId);
    } else {
      const source = this.netStore.findElement(arcState.sourceId);
      if (source && source.kind !== element.kind) {
        this.netStore.addArc(arcState.sourceId, elementId);
      }
      this.interactionStore.cancelArcCreation();
      this.arcPreviewLine.set(null);
    }
  }

  private updateRubberBandSelection(): void {
    const rect = this.rubberBandRect();
    if (!rect) return;

    const ids = new Set<string>();
    for (const place of this.netStore.places()) {
      if (this.pointInRect(place.position, rect)) ids.add(place.id);
    }
    for (const trans of this.netStore.transitions()) {
      if (this.pointInRect(trans.position, rect)) ids.add(trans.id);
    }
    this.selectionStore.selectMultiple(ids);
  }

  private pointInRect(point: Point, rect: Rect): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  private getWorldPosition(event: PointerEvent | MouseEvent): Point {
    return this.canvasStore.screenToWorld(
      { x: event.clientX, y: event.clientY },
      this.svgRef().nativeElement
    );
  }

  private maybeSnap(point: Point): Point {
    if (this.canvasStore.snapToGrid()) {
      return snapToGrid(point, this.canvasStore.gridSize());
    }
    return point;
  }
}
