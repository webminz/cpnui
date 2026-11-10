import { Component, computed, inject, input, output } from '@angular/core';
import { Place, Point } from '../core/model';
import { CanvasStoreService } from '../state/canvas-store.service';
import { NetStoreService } from '../state/net-store.service';

@Component({
  selector: 'g[cpn-place-renderer]',
  standalone: true,
  template: `
    <svg:ellipse
      [attr.cx]="place().position.x"
      [attr.cy]="place().position.y"
      [attr.rx]="rx()"
      [attr.ry]="ry()"
      class="place-shape"
      [class.selected]="selected()"
      [style.stroke]="strokeColor()"
      [style.stroke-width]="place().graphics?.strokeWidth || null"
      [style.fill]="place().graphics?.fillColor || null"
    />
    @if (selected()) {
      <svg:ellipse
        [attr.cx]="place().position.x"
        [attr.cy]="place().position.y"
        [attr.rx]="rx() + selectionGap()"
        [attr.ry]="ry() + selectionGap()"
        class="selection-ring"
        vector-effect="non-scaling-stroke"
      />
      @for (handle of resizeHandles(); track $index) {
        <svg:rect
          [attr.x]="handle.x - handleHalf()"
          [attr.y]="handle.y - handleHalf()"
          [attr.width]="handleSize()"
          [attr.height]="handleSize()"
          class="resize-handle"
          [class.handle-ns]="$index % 2 === 0"
          [class.handle-ew]="$index % 2 === 1"
          (pointerdown)="onResizePointerDown($event, $index)"
        />
      }
    }

    <!-- Token dots or count inside the place -->
    @if (tokenCount(); as tc) {
      @if (tc <= 5) {
        @for (dot of tokenDots(); track $index) {
          <svg:circle
            [attr.cx]="dot.x"
            [attr.cy]="dot.y"
            [attr.r]="tokenDotRadius()"
            class="token-dot"
          />
        }
      } @else {
        <svg:text
          [attr.x]="place().position.x"
          [attr.y]="place().position.y"
          [attr.font-size]="annotFontSize()"
          class="token-count"
          dominant-baseline="central"
        >{{ tc }}</svg:text>
      }
    }

    <!-- Violation indicator -->
    @if (hasViolation()) {
      <svg:circle
        [attr.cx]="place().position.x - rx() + violationBadgeOffset()"
        [attr.cy]="place().position.y - ry() + violationBadgeOffset()"
        [attr.r]="violationBadgeRadius()"
        class="violation-badge"
      />
      <svg:text
        [attr.x]="place().position.x - rx() + violationBadgeOffset()"
        [attr.y]="place().position.y - ry() + violationBadgeOffset()"
        [attr.font-size]="violationBadgeFontSize()"
        class="violation-badge-text"
        dominant-baseline="central"
      >!</svg:text>
    }

    <!-- Name label below -->
    <svg:text
      [attr.x]="nameLabelPos().x"
      [attr.y]="nameLabelPos().y"
      class="element-label"
      [class.label-draggable]="selected()"
      [attr.font-size]="labelFontSize()"
      [style.fill]="place().graphics?.fontColor || null"
      [style.font-family]="fontFamily()"
      [style.font-weight]="place().graphics?.fontBold ? 'bold' : null"
      [style.font-style]="place().graphics?.fontItalic ? 'italic' : null"
      [style.text-decoration]="place().graphics?.fontUnderline ? 'underline' : null"
      (pointerdown)="onLabelPointerDown($event, 'name')"
    >
      @for (line of nameLines(); track $index) {
        <svg:tspan
          [attr.x]="nameLabelPos().x"
          [attr.dy]="$index === 0 ? 0 : lineHeight()"
        >{{ line }}</svg:tspan>
      }
    </svg:text>

    <!-- Colour set label (top-right) -->
    @if (place().colourSetId) {
      <svg:text
        [attr.x]="colsetLabelPos().x"
        [attr.y]="colsetLabelPos().y"
        [attr.font-size]="annotFontSize()"
        class="annotation-label annotation-colset"
        [class.label-draggable]="selected()"
        [style.fill]="colourSetColor()"
        (pointerdown)="onLabelPointerDown($event, 'colourSet')"
      >&#x25A0; {{ place().colourSetId }}</svg:text>
    }

    <!-- Initial marking label (bottom-right, if text but not pure number for dots) -->
    @if (markingLabel()) {
      <svg:text
        [attr.x]="markingLabelPos().x"
        [attr.y]="markingLabelPos().y"
        [attr.font-size]="annotFontSize()"
        class="annotation-label annotation-marking"
        [class.label-draggable]="selected()"
        dominant-baseline="hanging"
        (pointerdown)="onLabelPointerDown($event, 'marking')"
      >{{ markingLabel() }}</svg:text>
    }
  `,
  styles: `
    .place-shape {
      fill: var(--cpn-bg-surface);
      stroke: var(--cpn-place-stroke);
      stroke-width: 2;
      cursor: pointer;
    }
    .place-shape.selected {
      stroke: var(--cpn-selection);
    }
    .selection-ring {
      fill: none;
      stroke: var(--cpn-selection);
      stroke-width: 1;
      stroke-dasharray: 4 3;
    }
    .element-label {
      fill: var(--cpn-text);
      font-size: 12px;
      text-anchor: middle;
      pointer-events: none;
      user-select: none;
    }
    .label-draggable {
      pointer-events: auto;
      cursor: move;
    }
    .annotation-label {
      fill: var(--cpn-text-secondary, #666);
      font-style: italic;
      pointer-events: none;
      user-select: none;
    }
    .annotation-colset {
      fill: var(--cpn-place-stroke);
      font-weight: 600;
      font-style: normal;
    }
    .annotation-marking {
      fill: var(--cpn-text-muted, #999);
    }
    .token-dot {
      fill: var(--cpn-text);
      pointer-events: none;
    }
    .token-count {
      fill: var(--cpn-text);
      text-anchor: middle;
      font-weight: 700;
      pointer-events: none;
      user-select: none;
    }
    .violation-badge {
      fill: #ef4444;
      stroke: white;
      stroke-width: 1;
      pointer-events: none;
    }
    .violation-badge-text {
      fill: white;
      font-weight: 700;
      text-anchor: middle;
      pointer-events: none;
      user-select: none;
    }
    .resize-handle {
      fill: var(--cpn-selection);
      stroke: none;
      cursor: pointer;
    }
    .resize-handle.handle-ns {
      cursor: ns-resize;
    }
    .resize-handle.handle-ew {
      cursor: ew-resize;
    }
  `,
})
export class PlaceRendererComponent {
  private readonly canvasStore = inject(CanvasStoreService);
  private readonly netStore = inject(NetStoreService);

  readonly place = input.required<Place>();
  readonly selected = input(false);
  readonly hasViolation = input(false);

  readonly resizePointerDown = output<{ event: PointerEvent; direction: number }>();
  readonly labelPointerDown = output<{ event: PointerEvent; labelKey: string }>();

  readonly rx = computed(() => this.place().size.width / 2);
  readonly ry = computed(() => this.place().size.height / 2);

  readonly handleSize = computed(() => 8 / this.canvasStore.zoom());
  readonly handleHalf = computed(() => 4 / this.canvasStore.zoom());
  readonly selectionGap = computed(() => 4 / this.canvasStore.zoom());

  readonly labelFontSize = computed(() => {
    const custom = this.place().graphics?.fontSize ?? 12;
    return custom / this.canvasStore.zoom();
  });
  readonly labelOffsetY = computed(() => 16 / this.canvasStore.zoom());
  readonly lineHeight = computed(() => this.labelFontSize() * 1.2);
  readonly nameLines = computed(() => this.place().name.split(/\r?\n/));

  /** Colour assigned to the place's colour set (declarations panel swatch), if any. */
  readonly colourSetColor = computed<string | null>(() => {
    const csName = this.place().colourSetId;
    if (!csName) return null;
    return this.netStore.colourSets().find((cs) => cs.name === csName)?.color ?? null;
  });

  /** Explicit per-element stroke wins; otherwise the colour set colour; otherwise the theme. */
  readonly strokeColor = computed<string | null>(
    () => this.place().graphics?.strokeColor || this.colourSetColor(),
  );
  readonly annotFontSize = computed(() => 10 / this.canvasStore.zoom());
  readonly annotPadX = computed(() => 6 / this.canvasStore.zoom());
  readonly tokenDotRadius = computed(() => 4 / this.canvasStore.zoom());
  readonly violationBadgeRadius = computed(() => 7 / this.canvasStore.zoom());
  readonly violationBadgeOffset = computed(() => -2 / this.canvasStore.zoom());
  readonly violationBadgeFontSize = computed(() => 10 / this.canvasStore.zoom());

  /** Default + user-offset label positions */
  readonly nameLabelPos = computed<Point>(() => {
    const p = this.place();
    const off = p.labelOffsets?.name ?? { x: 0, y: 0 };
    return {
      x: p.position.x + off.x,
      y: p.position.y + this.ry() + this.labelOffsetY() + off.y,
    };
  });

  readonly colsetLabelPos = computed<Point>(() => {
    const p = this.place();
    const off = p.labelOffsets?.colourSet ?? { x: 0, y: 0 };
    return {
      x: p.position.x + this.rx() + this.annotPadX() + off.x,
      y: p.position.y - this.ry() + off.y,
    };
  });

  readonly markingLabelPos = computed<Point>(() => {
    const p = this.place();
    const off = p.labelOffsets?.marking ?? { x: 0, y: 0 };
    return {
      x: p.position.x + this.rx() + this.annotPadX() + off.x,
      y: p.position.y + this.ry() + off.y,
    };
  });

  /** Parse initial marking to get a token count supporting multiset semantics.
   *  e.g. "1`\"a\"++1`\"b\"++1`\"c\"" → 3, "2`x++3`y" → 5, "5" → 5
   *  Short notation: "x" (without backtick) is treated as 1`x → 1 token */
  readonly tokenCount = computed<number>(() => {
    const text = this.place().initialMarking.text.trim();
    if (!text) return 0;
    // Plain integer — could be a count or a single INT token value.
    // Treat as 1 token (the value itself).
    if (/^\d+$/.test(text)) return 1;
    // Split on ++ (multiset union) and sum coefficients
    const parts = text.split('++');
    let total = 0;
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const m = trimmed.match(/^(\d+)`/);
      if (m) {
        total += parseInt(m[1], 10);
      } else {
        // No coefficient — short notation for 1`value
        total += 1;
      }
    }
    return total;
  });

  /** Positions for token dots (up to 5) arranged inside the ellipse.
   *  1: center, 2: side-by-side, 3: triangle (2 top, 1 bottom),
   *  4: 2×2 grid, 5: pentagon/star pattern */
  readonly tokenDots = computed<Point[]>(() => {
    const n = this.tokenCount();
    if (n <= 0 || n > 5) return [];
    const cx = this.place().position.x;
    const cy = this.place().position.y;
    const sp = 12 / this.canvasStore.zoom();
    switch (n) {
      case 1:
        return [{ x: cx, y: cy }];
      case 2:
        return [{ x: cx - sp / 2, y: cy }, { x: cx + sp / 2, y: cy }];
      case 3:
        return [
          { x: cx - sp / 2, y: cy - sp * 0.4 },
          { x: cx + sp / 2, y: cy - sp * 0.4 },
          { x: cx, y: cy + sp * 0.4 },
        ];
      case 4:
        return [
          { x: cx - sp / 2, y: cy - sp / 2 },
          { x: cx + sp / 2, y: cy - sp / 2 },
          { x: cx - sp / 2, y: cy + sp / 2 },
          { x: cx + sp / 2, y: cy + sp / 2 },
        ];
      case 5: {
        const r = sp * 0.7;
        return [0, 1, 2, 3, 4].map((i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
          return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
        });
      }
      default:
        return [];
    }
  });

  /** For non-numeric markings, show as text label */
  readonly markingLabel = computed<string | null>(() => {
    const text = this.place().initialMarking.text.trim();
    if (!text) return null;
    // If token dots are shown, don't also show the label
    const tc = this.tokenCount();
    if (tc > 0 && tc <= 5) return null;
    // The count is shown inside the place; show the (shortened) expression outside
    if (text.length > 25) return text.slice(0, 25) + '\u2026';
    return text;
  });

  readonly resizeHandles = computed<Point[]>(() => {
    const p = this.place();
    const cx = p.position.x;
    const cy = p.position.y;
    const hw = p.size.width / 2;
    const hh = p.size.height / 2;
    // N, E, S, W
    return [
      { x: cx, y: cy - hh },
      { x: cx + hw, y: cy },
      { x: cx, y: cy + hh },
      { x: cx - hw, y: cy },
    ];
  });

  readonly fontFamily = computed(() => {
    const ff = this.place().graphics?.fontFamily;
    if (!ff || ff === 'System Default') return null;
    switch (ff) {
      case 'Serif': return 'serif';
      case 'Sans Serif': return 'sans-serif';
      case 'Monospace': return 'monospace';
      default: return ff;
    }
  });

  onResizePointerDown(event: PointerEvent, direction: number): void {
    event.stopPropagation();
    this.resizePointerDown.emit({ event, direction });
  }

  onLabelPointerDown(event: PointerEvent, labelKey: string): void {
    if (!this.selected()) return;
    event.stopPropagation();
    this.labelPointerDown.emit({ event, labelKey });
  }
}
