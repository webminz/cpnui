import { Component, computed, inject, input, output } from '@angular/core';
import { Arc, Point } from '../core/model';
import { NetStoreService } from '../state/net-store.service';
import { CanvasStoreService } from '../state/canvas-store.service';
import {
  buildArcPath,
  computeEllipseEdgePoint,
  computeRectEdgePoint,
} from '../shared/svg-path.util';
import { midpoint } from '../shared/geometry.util';

@Component({
  selector: 'g[cpn-arc-renderer]',
  standalone: true,
  template: `
    @if (pathData()) {
      <svg:path
        [attr.d]="pathData()"
        class="arc-line"
        [class.selected]="selected()"
        [attr.marker-end]="selected() ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'"
        [style.stroke]="arc().graphics?.strokeColor || null"
        [style.stroke-width]="arc().graphics?.strokeWidth || null"
        vector-effect="non-scaling-stroke"
      />
      <svg:path
        [attr.d]="pathData()"
        class="arc-hit-area"
        vector-effect="non-scaling-stroke"
      />
    }
    @if (selected()) {
      @for (mp of segmentMidpoints(); track $index) {
        <svg:circle
          [attr.cx]="mp.x"
          [attr.cy]="mp.y"
          [attr.r]="midpointRadius()"
          class="midpoint-knob"
          vector-effect="non-scaling-stroke"
          (pointerdown)="onMidpointPointerDown($event, $index)"
        />
      }
      @for (bp of bendPointKnobs(); track $index) {
        <svg:circle
          [attr.cx]="bp.x"
          [attr.cy]="bp.y"
          [attr.r]="bendPointRadius()"
          class="bend-point-knob"
          (pointerdown)="onBendPointPointerDown($event, $index)"
          (dblclick)="onBendPointDblClick($event, $index)"
        >
          <svg:title>Double-click to remove</svg:title>
        </svg:circle>
      }
    }
    @if (hasViolation()) {
      <svg:circle
        [attr.cx]="labelPosition().x + inscriptionFontSize()"
        [attr.cy]="labelPosition().y - labelOffset() * 1.8"
        [attr.r]="violationBadgeRadius()"
        class="violation-badge"
      />
      <svg:text
        [attr.x]="labelPosition().x + inscriptionFontSize()"
        [attr.y]="labelPosition().y - labelOffset() * 1.8"
        [attr.font-size]="violationBadgeFontSize()"
        class="violation-badge-text"
        dominant-baseline="central"
      >!</svg:text>
    }
    @if (inscriptionLabel(); as label) {
      <svg:text
        [attr.x]="inscriptionPos().x"
        [attr.y]="inscriptionPos().y"
        [attr.font-size]="inscriptionFontSize()"
        [style.font-family]="fontFamily()"
        class="arc-inscription-label"
        [class.label-draggable]="selected()"
        (pointerdown)="onLabelPointerDown($event)"
      >{{ label }}</svg:text>
    }
  `,
  styles: `
    .arc-line {
      fill: none;
      stroke: var(--cpn-arc-stroke);
      stroke-width: 2;
    }
    .arc-line.selected {
      stroke: var(--cpn-selection);
    }
    .arc-hit-area {
      fill: none;
      stroke: transparent;
      stroke-width: 12;
      cursor: pointer;
    }
    .bend-point-knob {
      fill: var(--cpn-selection);
      stroke: none;
      cursor: grab;
    }
    .midpoint-knob {
      fill: var(--cpn-bg-surface, white);
      stroke: var(--cpn-text-muted, #999);
      stroke-width: 1.5;
      cursor: pointer;
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
    .arc-inscription-label {
      fill: var(--cpn-text);
      text-anchor: middle;
      pointer-events: none;
      user-select: none;
    }
    .label-draggable {
      pointer-events: auto;
      cursor: move;
    }
  `,
})
export class ArcRendererComponent {
  private readonly netStore = inject(NetStoreService);
  private readonly canvasStore = inject(CanvasStoreService);

  readonly arc = input.required<Arc>();
  readonly selected = input(false);
  readonly hasViolation = input(false);

  readonly bendPointRadius = computed(() => 5 / this.canvasStore.zoom());
  readonly midpointRadius = computed(() => 4 / this.canvasStore.zoom());
  readonly violationBadgeRadius = computed(() => 6 / this.canvasStore.zoom());
  readonly violationBadgeFontSize = computed(() => 9 / this.canvasStore.zoom());

  readonly bendPointPointerDown = output<{ event: PointerEvent; bendPointIndex: number }>();
  readonly midpointPointerDown = output<{ event: PointerEvent; segmentIndex: number }>();
  readonly bendPointDblClick = output<{ event: MouseEvent; bendPointIndex: number }>();
  readonly labelPointerDown = output<{ event: PointerEvent; labelKey: string }>();

  readonly pathEndpoints = computed(() => {
    const a = this.arc();
    const source = this.netStore.findElement(a.sourceId);
    const target = this.netStore.findElement(a.targetId);
    if (!source || !target) return null;

    const lastBendOrSource =
      a.bendPoints.length > 0
        ? a.bendPoints[a.bendPoints.length - 1]
        : source.position;
    const firstBendOrTarget =
      a.bendPoints.length > 0 ? a.bendPoints[0] : target.position;

    let startPoint = source.position;
    if (source.kind === 'place') {
      startPoint = computeEllipseEdgePoint(
        firstBendOrTarget,
        source.position,
        source.size.width,
        source.size.height,
      );
    } else {
      startPoint = computeRectEdgePoint(
        firstBendOrTarget,
        source.position,
        source.size.width,
        source.size.height,
      );
    }

    let endPoint = target.position;
    if (target.kind === 'place') {
      endPoint = computeEllipseEdgePoint(
        lastBendOrSource,
        target.position,
        target.size.width,
        target.size.height,
      );
    } else {
      endPoint = computeRectEdgePoint(
        lastBendOrSource,
        target.position,
        target.size.width,
        target.size.height,
      );
    }

    return { startPoint, endPoint };
  });

  readonly pathData = computed(() => {
    const endpoints = this.pathEndpoints();
    if (!endpoints) return null;
    const a = this.arc();
    return buildArcPath(endpoints.startPoint, endpoints.endPoint, a.bendPoints, a.drawMode);
  });

  readonly inscriptionLabel = computed(() => {
    const text = this.arc().inscription.text;
    if (!text) return null;
    if (text.length > 25) return text.slice(0, 25) + '\u2026';
    return text;
  });

  readonly inscriptionFontSize = computed(() => 13 / this.canvasStore.zoom());
  readonly labelOffset = computed(() => 14 / this.canvasStore.zoom());

  readonly labelPosition = computed<Point>(() => {
    const endpoints = this.pathEndpoints();
    if (!endpoints) return { x: 0, y: 0 };
    const a = this.arc();
    const allPoints = [endpoints.startPoint, ...a.bendPoints, endpoints.endPoint];
    const midIdx = Math.floor((allPoints.length - 1) / 2);
    return midpoint(allPoints[midIdx], allPoints[midIdx + 1]);
  });

  readonly inscriptionPos = computed<Point>(() => {
    const base = this.labelPosition();
    const off = this.arc().labelOffsets?.inscription ?? { x: 0, y: 0 };
    return {
      x: base.x + off.x,
      y: base.y - this.labelOffset() + off.y,
    };
  });

  readonly fontFamily = computed(() => {
    const ff = this.arc().graphics?.fontFamily;
    if (!ff || ff === 'System Default') return null;
    switch (ff) {
      case 'Serif': return 'serif';
      case 'Sans Serif': return 'sans-serif';
      case 'Monospace': return 'monospace';
      default: return ff;
    }
  });

  readonly bendPointKnobs = computed<Point[]>(() => {
    return this.arc().bendPoints;
  });

  readonly segmentMidpoints = computed<Point[]>(() => {
    const endpoints = this.pathEndpoints();
    if (!endpoints) return [];
    const a = this.arc();
    const allPoints = [endpoints.startPoint, ...a.bendPoints, endpoints.endPoint];
    const mids: Point[] = [];
    for (let i = 0; i < allPoints.length - 1; i++) {
      mids.push(midpoint(allPoints[i], allPoints[i + 1]));
    }
    return mids;
  });

  onBendPointPointerDown(event: PointerEvent, index: number): void {
    event.stopPropagation();
    this.bendPointPointerDown.emit({ event, bendPointIndex: index });
  }

  onMidpointPointerDown(event: PointerEvent, index: number): void {
    event.stopPropagation();
    this.midpointPointerDown.emit({ event, segmentIndex: index });
  }

  onBendPointDblClick(event: MouseEvent, index: number): void {
    event.stopPropagation();
    this.bendPointDblClick.emit({ event, bendPointIndex: index });
  }

  onLabelPointerDown(event: PointerEvent): void {
    if (!this.selected()) return;
    event.stopPropagation();
    this.labelPointerDown.emit({ event, labelKey: 'inscription' });
  }
}
