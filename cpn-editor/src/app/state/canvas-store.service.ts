import { computed, Injectable, signal } from '@angular/core';
import { Point, Rect } from '../core/model';

@Injectable({ providedIn: 'root' })
export class CanvasStoreService {
  private readonly _zoom = signal(1);
  private readonly _panOffset = signal<Point>({ x: 0, y: 0 });
  private readonly _gridSize = signal(20);
  private readonly _snapToGrid = signal(true);
  private readonly _showGrid = signal(true);
  private readonly _darkMode = signal(false);
  private readonly _viewportSize = signal<Point>({ x: 800, y: 600 });

  readonly zoom = this._zoom.asReadonly();
  readonly panOffset = this._panOffset.asReadonly();
  readonly gridSize = this._gridSize.asReadonly();
  readonly snapToGrid = this._snapToGrid.asReadonly();
  readonly showGrid = this._showGrid.asReadonly();
  readonly darkMode = this._darkMode.asReadonly();

  readonly inverseZoom = computed(() => 1 / this._zoom());

  readonly viewportCenter = computed(() => {
    const pan = this._panOffset();
    const z = this._zoom();
    const vp = this._viewportSize();
    return {
      x: Math.round((vp.x / 2 - pan.x) / z),
      y: Math.round((vp.y / 2 - pan.y) / z),
    };
  });

  readonly canvasTransform = computed(() => {
    const z = this._zoom();
    const pan = this._panOffset();
    return `translate(${pan.x},${pan.y}) scale(${z})`;
  });

  screenToWorld(screenPoint: Point, svgEl: SVGSVGElement): Point {
    const rect = svgEl.getBoundingClientRect();
    const pan = this._panOffset();
    const z = this._zoom();
    return {
      x: (screenPoint.x - rect.left - pan.x) / z,
      y: (screenPoint.y - rect.top - pan.y) / z,
    };
  }

  zoomAtScreen(screenPoint: Point, delta: number, svgEl: SVGSVGElement): void {
    const rect = svgEl.getBoundingClientRect();
    const factor = delta > 0 ? 0.9 : 1.1;
    const oldZoom = this._zoom();
    const newZoom = Math.max(0.1, Math.min(50, oldZoom * factor));
    const oldPan = this._panOffset();

    // Screen-space cursor position relative to SVG element
    const sx = screenPoint.x - rect.left;
    const sy = screenPoint.y - rect.top;

    // Focal zoom: keep the world point under the cursor fixed
    this._panOffset.set({
      x: sx - (newZoom / oldZoom) * (sx - oldPan.x),
      y: sy - (newZoom / oldZoom) * (sy - oldPan.y),
    });
    this._zoom.set(newZoom);
  }

  pan(screenDx: number, screenDy: number): void {
    const current = this._panOffset();
    this._panOffset.set({
      x: current.x + screenDx,
      y: current.y + screenDy,
    });
  }

  panWorld(dx: number, dy: number): void {
    const z = this._zoom();
    const current = this._panOffset();
    this._panOffset.set({
      x: current.x + dx * z,
      y: current.y + dy * z,
    });
  }

  zoomCenter(factor: number): void {
    const oldZoom = this._zoom();
    const newZoom = Math.max(0.1, Math.min(50, oldZoom * factor));
    const vp = this._viewportSize();
    const oldPan = this._panOffset();
    // Zoom toward viewport center
    const cx = vp.x / 2;
    const cy = vp.y / 2;
    this._panOffset.set({
      x: cx - (newZoom / oldZoom) * (cx - oldPan.x),
      y: cy - (newZoom / oldZoom) * (cy - oldPan.y),
    });
    this._zoom.set(newZoom);
  }

  setViewportSize(width: number, height: number): void {
    this._viewportSize.set({ x: width, y: height });
  }

  /** Reset zoom to 100% and put the world origin in the viewport centre. */
  resetView(): void {
    this._zoom.set(1);
    this.centerOnPoint({ x: 0, y: 0 });
  }

  /**
   * Zoom and pan so that the given world-space rectangle is fully visible and
   * centred in the viewport. The zoom is capped at `maxZoom` so that tiny nets
   * are not blown up beyond their natural size.
   */
  fitToBounds(bounds: Rect, padding = 40, maxZoom = 1): void {
    const vp = this._viewportSize();
    const availW = Math.max(1, vp.x - padding * 2);
    const availH = Math.max(1, vp.y - padding * 2);
    const w = Math.max(bounds.width, 1);
    const h = Math.max(bounds.height, 1);
    const fitZoom = Math.min(availW / w, availH / h);
    const zoom = Math.max(0.1, Math.min(maxZoom, fitZoom));
    this._zoom.set(zoom);
    this.centerOnPoint({
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    });
  }

  centerOnPoint(worldPoint: Point): void {
    const z = this._zoom();
    const vp = this._viewportSize();
    this._panOffset.set({
      x: vp.x / 2 - worldPoint.x * z,
      y: vp.y / 2 - worldPoint.y * z,
    });
  }

  toggleGrid(): void {
    this._showGrid.update((v) => !v);
  }

  toggleSnapToGrid(): void {
    this._snapToGrid.update((v) => !v);
  }

  toggleTheme(): void {
    this._darkMode.update((v) => !v);
  }
}
