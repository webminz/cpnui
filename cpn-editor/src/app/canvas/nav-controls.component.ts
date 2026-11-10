import { Component, inject } from '@angular/core';
import { CanvasStoreService } from '../state/canvas-store.service';

@Component({
  selector: 'cpn-nav-controls',
  standalone: true,
  template: `
    <div class="nav-controls">
      <div class="nav-arrows">
        <button class="nav-btn" (click)="panUp()" title="Pan up">&uarr;</button>
        <div class="nav-row">
          <button class="nav-btn" (click)="panLeft()" title="Pan left">&larr;</button>
          <button class="nav-btn" (click)="panRight()" title="Pan right">&rarr;</button>
        </div>
        <button class="nav-btn" (click)="panDown()" title="Pan down">&darr;</button>
      </div>
      <div class="nav-zoom">
        <button class="nav-btn" (click)="zoomIn()" title="Zoom in">+</button>
        <button class="nav-btn" (click)="zoomOut()" title="Zoom out">&minus;</button>
      </div>
    </div>
  `,
  styles: `
    .nav-controls {
      position: absolute;
      bottom: 12px;
      right: 12px;
      display: flex;
      gap: 8px;
      z-index: 10;
    }
    .nav-arrows {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .nav-row {
      display: flex;
      gap: 2px;
    }
    .nav-zoom {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .nav-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--cpn-border-subtle);
      border-radius: 4px;
      background: var(--cpn-bg-surface);
      color: var(--cpn-text);
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      padding: 0;
      &:hover {
        background: var(--cpn-bg-surface-alt);
      }
      &:active {
        background: var(--cpn-border-subtle);
      }
    }
  `,
})
export class NavControlsComponent {
  private readonly canvasStore = inject(CanvasStoreService);

  private readonly panStep = 100;

  panUp(): void { this.canvasStore.panWorld(0, this.panStep); }
  panDown(): void { this.canvasStore.panWorld(0, -this.panStep); }
  panLeft(): void { this.canvasStore.panWorld(this.panStep, 0); }
  panRight(): void { this.canvasStore.panWorld(-this.panStep, 0); }
  zoomIn(): void { this.canvasStore.zoomCenter(1.2); }
  zoomOut(): void { this.canvasStore.zoomCenter(1 / 1.2); }
}
