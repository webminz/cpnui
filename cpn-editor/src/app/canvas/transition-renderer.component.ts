import { Component, computed, inject, input, output } from '@angular/core';
import { Transition, Point } from '../core/model';
import { CanvasStoreService } from '../state/canvas-store.service';

@Component({
  selector: 'g[cpn-transition-renderer]',
  standalone: true,
  template: `
    <svg:rect
      [attr.x]="transition().position.x - transition().size.width / 2"
      [attr.y]="transition().position.y - transition().size.height / 2"
      [attr.width]="transition().size.width"
      [attr.height]="transition().size.height"
      class="transition-shape"
      [class.selected]="selected()"
      [style.stroke]="transition().graphics?.strokeColor || null"
      [style.stroke-width]="transition().graphics?.strokeWidth || null"
      [style.fill]="transition().graphics?.fillColor || null"
    />
    @if (selected()) {
      <svg:rect
        [attr.x]="transition().position.x - transition().size.width / 2 - selectionGap()"
        [attr.y]="transition().position.y - transition().size.height / 2 - selectionGap()"
        [attr.width]="transition().size.width + selectionGap() * 2"
        [attr.height]="transition().size.height + selectionGap() * 2"
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
          [class.handle-nwse]="$index === 0 || $index === 2"
          [class.handle-nesw]="$index === 1 || $index === 3"
          (pointerdown)="onResizePointerDown($event, $index)"
        />
      }
    }

    <!-- Violation indicator -->
    @if (hasViolation()) {
      <svg:circle
        [attr.cx]="transition().position.x - transition().size.width / 2 + violationBadgeOffset()"
        [attr.cy]="transition().position.y - transition().size.height / 2 + violationBadgeOffset()"
        [attr.r]="violationBadgeRadius()"
        class="violation-badge"
      />
      <svg:text
        [attr.x]="transition().position.x - transition().size.width / 2 + violationBadgeOffset()"
        [attr.y]="transition().position.y - transition().size.height / 2 + violationBadgeOffset()"
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
      [style.fill]="transition().graphics?.fontColor || null"
      [style.font-family]="fontFamily()"
      [style.font-weight]="transition().graphics?.fontBold ? 'bold' : null"
      [style.font-style]="transition().graphics?.fontItalic ? 'italic' : null"
      [style.text-decoration]="transition().graphics?.fontUnderline ? 'underline' : null"
      (pointerdown)="onLabelPointerDown($event, 'name')"
    >
      @for (line of nameLines(); track $index) {
        <svg:tspan
          [attr.x]="nameLabelPos().x"
          [attr.dy]="$index === 0 ? 0 : lineHeight()"
        >{{ line }}</svg:tspan>
      }
    </svg:text>

    <!-- Guard annotation (top-left) -->
    @if (guardText()) {
      <svg:text
        [attr.x]="guardLabelPos().x"
        [attr.y]="guardLabelPos().y"
        [attr.font-size]="annotFontSize()"
        class="annotation-label annotation-guard"
        [class.label-draggable]="selected()"
        text-anchor="end"
        (pointerdown)="onLabelPointerDown($event, 'guard')"
      >{{ guardText() }}</svg:text>
    }

    <!-- Duration annotation (bottom-right) -->
    @if (durationText()) {
      <svg:text
        [attr.x]="durationLabelPos().x"
        [attr.y]="durationLabelPos().y"
        [attr.font-size]="annotFontSize()"
        class="annotation-label annotation-duration"
        [class.label-draggable]="selected()"
        dominant-baseline="hanging"
        (pointerdown)="onLabelPointerDown($event, 'duration')"
      >&#x23F3; {{ durationText() }}</svg:text>
    }
  `,
  styles: `
    .transition-shape {
      fill: var(--cpn-bg-surface);
      stroke: var(--cpn-transition-stroke);
      stroke-width: 2;
      cursor: pointer;
    }
    .transition-shape.selected {
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
    .annotation-guard {
      fill: var(--cpn-transition-stroke);
      font-weight: 500;
    }
    .annotation-duration {
      fill: var(--cpn-text-muted, #999);
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
    .resize-handle.handle-nwse {
      cursor: nwse-resize;
    }
    .resize-handle.handle-nesw {
      cursor: nesw-resize;
    }
  `,
})
export class TransitionRendererComponent {
  private readonly canvasStore = inject(CanvasStoreService);

  readonly transition = input.required<Transition>();
  readonly selected = input(false);
  readonly hasViolation = input(false);

  readonly resizePointerDown = output<{ event: PointerEvent; direction: number }>();
  readonly labelPointerDown = output<{ event: PointerEvent; labelKey: string }>();

  readonly handleSize = computed(() => 8 / this.canvasStore.zoom());
  readonly handleHalf = computed(() => 4 / this.canvasStore.zoom());
  readonly selectionGap = computed(() => 4 / this.canvasStore.zoom());

  readonly labelFontSize = computed(() => {
    const custom = this.transition().graphics?.fontSize ?? 12;
    return custom / this.canvasStore.zoom();
  });
  readonly labelOffsetY = computed(() => 16 / this.canvasStore.zoom());
  readonly lineHeight = computed(() => this.labelFontSize() * 1.2);
  readonly nameLines = computed(() => this.transition().name.split(/\r?\n/));
  readonly annotFontSize = computed(() => 10 / this.canvasStore.zoom());
  readonly annotPadX = computed(() => 6 / this.canvasStore.zoom());
  readonly violationBadgeRadius = computed(() => 7 / this.canvasStore.zoom());
  readonly violationBadgeOffset = computed(() => -2 / this.canvasStore.zoom());
  readonly violationBadgeFontSize = computed(() => 10 / this.canvasStore.zoom());

  /** Default + user-offset label positions */
  readonly nameLabelPos = computed<Point>(() => {
    const t = this.transition();
    const off = t.labelOffsets?.name ?? { x: 0, y: 0 };
    return {
      x: t.position.x + off.x,
      y: t.position.y + t.size.height / 2 + this.labelOffsetY() + off.y,
    };
  });

  readonly guardLabelPos = computed<Point>(() => {
    const t = this.transition();
    const off = t.labelOffsets?.guard ?? { x: 0, y: 0 };
    return {
      x: t.position.x - t.size.width / 2 - this.annotPadX() + off.x,
      y: t.position.y - t.size.height / 2 + off.y,
    };
  });

  readonly durationLabelPos = computed<Point>(() => {
    const t = this.transition();
    const off = t.labelOffsets?.duration ?? { x: 0, y: 0 };
    return {
      x: t.position.x + t.size.width / 2 + this.annotPadX() + off.x,
      y: t.position.y + t.size.height / 2 + off.y,
    };
  });

  readonly guardText = computed<string | null>(() => {
    const text = this.transition().guard.text.trim();
    return text || null;
  });

  readonly durationText = computed<string | null>(() => {
    const text = this.transition().duration.text.trim();
    return text || null;
  });

  readonly resizeHandles = computed<Point[]>(() => {
    const t = this.transition();
    const cx = t.position.x;
    const cy = t.position.y;
    const hw = t.size.width / 2;
    const hh = t.size.height / 2;
    // NW, NE, SE, SW
    return [
      { x: cx - hw, y: cy - hh },
      { x: cx + hw, y: cy - hh },
      { x: cx + hw, y: cy + hh },
      { x: cx - hw, y: cy + hh },
    ];
  });

  readonly fontFamily = computed(() => {
    const ff = this.transition().graphics?.fontFamily;
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
