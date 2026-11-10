import { Component, ElementRef, HostListener, inject, viewChild } from '@angular/core';
import { CanvasStoreService } from '../state/canvas-store.service';
import { HistoryService } from '../state/history.service';
import { NetStoreService } from '../state/net-store.service';
import { UiStoreService } from '../state/ui-store.service';
import { createDefaultNet } from '../core/model';
import { normalizeNetScale, parseCpnXml } from '../cpn/cpn-import';
import { serializeCpnXml } from '../cpn/cpn-export';
import { exportSvg, exportPng } from '../shared/export.util';
import { computeNetBounds } from '../shared/net-bounds.util';

@Component({
  selector: 'cpn-toolbar',
  standalone: true,
  template: `
    <div class="toolbar">
      <span class="app-title">CPN Editor</span>
      <div class="toolbar-actions">
        <button class="toolbar-btn" (click)="onNew()" title="New net (Ctrl+N)">
          <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z"/></svg>
          New
        </button>
        <button class="toolbar-btn" (click)="onOpen()" title="Open .cpn file (Ctrl+L)">
          <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clip-rule="evenodd"/><path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z"/></svg>
          Open
        </button>
        <button class="toolbar-btn" (click)="onSave()" title="Save as .cpn file (Ctrl+S)">
          <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2V7.414a1 1 0 00-.293-.707l-2.414-2.414A1 1 0 0013.586 4H5zm5 2a1 1 0 011 1v3.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586V7a1 1 0 011-1z"/></svg>
          Save
        </button>
        <input
          #fileInput
          type="file"
          accept=".cpn"
          class="hidden-file-input"
          (change)="onFileSelected($event)"
        />
        <span class="separator"></span>
        <button class="toolbar-btn" (click)="onExportSvg()" title="Export as SVG">
          <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          SVG
        </button>
        <button class="toolbar-btn" (click)="onExportPng()" title="Export as PNG">
          <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          PNG
        </button>
        <span class="separator"></span>
        <button
          class="toolbar-btn"
          [class.active]="uiStore.declarationsPanelVisible()"
          (click)="uiStore.toggleDeclarationsPanel()"
          title="Toggle declarations panel (Ctrl+D)"
        >
          Declarations
        </button>
        <span class="separator"></span>
        <button
          class="toolbar-btn"
          [disabled]="!history.canUndo()"
          (click)="history.undo()"
          title="Undo (Ctrl+Z)"
        >
          <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
          Undo
        </button>
        <button
          class="toolbar-btn"
          [disabled]="!history.canRedo()"
          (click)="history.redo()"
          title="Redo (Ctrl+Y)"
        >
          <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 9H9a5 5 0 00-5 5v2a1 1 0 11-2 0v-2a7 7 0 017-7h5.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          Redo
        </button>
      </div>
      <div class="toolbar-controls">
        <span class="coord-display" title="Viewport center (world coordinates)">{{ canvasStore.viewportCenter().x }}, {{ canvasStore.viewportCenter().y }}</span>
        <span class="zoom-display">{{ zoomPercent() }}%</span>
        <button
          class="toolbar-btn"
          [class.active]="canvasStore.showGrid()"
          (click)="canvasStore.toggleGrid()"
          title="Toggle grid"
        >
          Grid
        </button>
        <button
          class="toolbar-btn"
          [class.active]="canvasStore.snapToGrid()"
          (click)="canvasStore.toggleSnapToGrid()"
          title="Toggle snap to grid"
        >
          Snap
        </button>
        <button
          class="toolbar-btn"
          (click)="canvasStore.toggleTheme()"
          title="Toggle light/dark theme"
        >
          {{ canvasStore.darkMode() ? 'Light' : 'Dark' }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      height: 100%;
      background: var(--cpn-bg-surface);
      border-bottom: 1px solid var(--cpn-border);
    }
    .app-title {
      font-weight: 600;
      font-size: 14px;
      color: var(--cpn-text);
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .toolbar-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .coord-display {
      font-size: 11px;
      color: var(--cpn-text-secondary);
      font-family: monospace;
      min-width: 80px;
      text-align: right;
    }
    .zoom-display {
      font-size: 12px;
      color: var(--cpn-text-secondary);
      min-width: 40px;
      text-align: right;
    }
    .btn-icon {
      width: 14px;
      height: 14px;
      vertical-align: -2px;
      flex-shrink: 0;
    }
    .toolbar-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--cpn-bg-surface-alt);
      border: 1px solid var(--cpn-border-subtle);
      color: var(--cpn-text);
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      &:hover {
        background: var(--cpn-border-subtle);
      }
      &.active {
        background: var(--cpn-border-subtle);
        border-color: var(--cpn-active);
      }
      &:disabled {
        opacity: 0.4;
        cursor: default;
      }
    }
    .separator {
      width: 1px;
      height: 20px;
      background: var(--cpn-border-subtle);
      margin: 0 4px;
    }
    .hidden-file-input {
      display: none;
    }
  `,
})
export class ToolbarComponent {
  readonly canvasStore = inject(CanvasStoreService);
  readonly history = inject(HistoryService);
  private readonly netStore = inject(NetStoreService);
  readonly uiStore = inject(UiStoreService);
  readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  readonly zoomPercent = () => Math.round(this.canvasStore.zoom() * 100);

  onNew(): void {
    this.netStore.loadNet(createDefaultNet());
    this.canvasStore.resetView();
  }

  onOpen(): void {
    this.fileInput().nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const xml = reader.result as string;
      // Legacy CPN Tools files are laid out at a tiny scale; bring them up to the
      // editor's native scale, then show the whole net.
      const net = normalizeNetScale(parseCpnXml(xml));
      this.netStore.loadNet(net);
      const bounds = computeNetBounds(net);
      if (bounds) this.canvasStore.fitToBounds(bounds);
      else this.canvasStore.resetView();
    };
    reader.readAsText(file);

    // Reset so the same file can be re-opened
    input.value = '';
  }

  onExportSvg(): void {
    const svgEl = document.querySelector<SVGSVGElement>('.canvas-svg');
    if (svgEl) exportSvg(svgEl, this.netStore.net(), this.canvasStore.zoom());
  }

  onExportPng(): void {
    const svgEl = document.querySelector<SVGSVGElement>('.canvas-svg');
    if (svgEl) exportPng(svgEl, this.netStore.net(), this.canvasStore.zoom());
  }

  onSave(): void {
    const net = this.netStore.net();
    const xml = serializeCpnXml(net);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${net.name || 'cpn-net'}.cpn`;
    a.click();
    URL.revokeObjectURL(url);
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
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      this.onSave();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
      event.preventDefault();
      this.onOpen();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
      event.preventDefault();
      this.onNew();
    }
  }
}
