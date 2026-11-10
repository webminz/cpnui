import { Component, HostListener, computed, inject } from '@angular/core';
import { CanvasStoreService } from '../state/canvas-store.service';
import { NetStoreService } from '../state/net-store.service';
import { UiStoreService } from '../state/ui-store.service';

@Component({
  selector: 'cpn-cheatsheet-overlay',
  standalone: true,
  template: `
    @if (uiStore.cheatsheetVisible()) {
      <div class="cheatsheet-overlay">
        <!-- Origin crosshair -->
        <div
          class="origin-marker"
          [style.left.px]="originScreen().x"
          [style.top.px]="originScreen().y"
        >
          <div class="origin-crosshair-h"></div>
          <div class="origin-crosshair-v"></div>
          <span class="origin-label">(0, 0)</span>
        </div>

        <!-- Element coordinates -->
        @for (info of elementInfos(); track info.id) {
          <div
            class="element-info"
            [style.left.px]="info.screenX"
            [style.top.px]="info.screenY"
          >
            <span class="coord-label">{{ info.label }}</span>
          </div>
        }

        <!-- Keyboard shortcuts panel -->
        <div class="shortcuts-panel">
          <div class="shortcuts-title">Keyboard Shortcuts</div>
          <div class="shortcuts-grid">
            <div class="shortcut-section">
              <div class="section-title">Tools</div>
              @for (s of toolShortcuts; track s.key) {
                <div class="shortcut-row">
                  <kbd>{{ s.key }}</kbd>
                  <span>{{ s.desc }}</span>
                </div>
              }
            </div>
            <div class="shortcut-section">
              <div class="section-title">File</div>
              @for (s of fileShortcuts; track s.key) {
                <div class="shortcut-row">
                  <kbd>{{ s.key }}</kbd>
                  <span>{{ s.desc }}</span>
                </div>
              }
            </div>
            <div class="shortcut-section">
              <div class="section-title">Edit</div>
              @for (s of editShortcuts; track s.key) {
                <div class="shortcut-row">
                  <kbd>{{ s.key }}</kbd>
                  <span>{{ s.desc }}</span>
                </div>
              }
            </div>
            <div class="shortcut-section">
              <div class="section-title">Panels</div>
              @for (s of panelShortcuts; track s.key) {
                <div class="shortcut-row">
                  <kbd>{{ s.key }}</kbd>
                  <span>{{ s.desc }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .cheatsheet-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 20;
      overflow: hidden;
    }
    .origin-marker {
      position: absolute;
      transform: translate(-50%, -50%);
    }
    .origin-crosshair-h,
    .origin-crosshair-v {
      position: absolute;
      background: #ef4444;
      opacity: 0.6;
    }
    .origin-crosshair-h {
      width: 24px;
      height: 2px;
      top: -1px;
      left: -12px;
    }
    .origin-crosshair-v {
      width: 2px;
      height: 24px;
      top: -12px;
      left: -1px;
    }
    .origin-label {
      position: absolute;
      top: 6px;
      left: 6px;
      font-size: 10px;
      font-family: monospace;
      color: #ef4444;
      white-space: nowrap;
      font-weight: 600;
    }
    .element-info {
      position: absolute;
      transform: translate(8px, -100%);
    }
    .coord-label {
      display: inline-block;
      font-size: 10px;
      font-family: monospace;
      color: var(--cpn-text);
      background: var(--cpn-bg-surface);
      border: 1px solid var(--cpn-border);
      border-radius: 3px;
      padding: 1px 4px;
      white-space: nowrap;
      opacity: 0.9;
    }
    .shortcuts-panel {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--cpn-bg-surface);
      border: 1px solid var(--cpn-border);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      padding: 12px 16px;
      opacity: 0.95;
    }
    .shortcuts-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--cpn-text);
      margin-bottom: 8px;
      text-align: center;
      letter-spacing: 0.5px;
    }
    .shortcuts-grid {
      display: flex;
      gap: 20px;
    }
    .shortcut-section {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .section-title {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--cpn-text-muted);
      margin-bottom: 2px;
    }
    .shortcut-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: var(--cpn-text-secondary);
    }
    kbd {
      display: inline-block;
      min-width: 24px;
      text-align: center;
      padding: 1px 5px;
      font-size: 10px;
      font-family: monospace;
      background: var(--cpn-bg-surface-alt);
      border: 1px solid var(--cpn-border);
      border-radius: 3px;
      color: var(--cpn-text);
    }
  `,
})
export class CheatsheetOverlayComponent {
  readonly canvasStore = inject(CanvasStoreService);
  private readonly netStore = inject(NetStoreService);
  readonly uiStore = inject(UiStoreService);

  readonly toolShortcuts = [
    { key: 'V', desc: 'Select' },
    { key: 'P', desc: 'Place' },
    { key: 'T', desc: 'Transition' },
    { key: 'A', desc: 'Arc' },
    { key: 'H', desc: 'Pan' },
    { key: 'Esc', desc: 'Back to Select' },
  ];

  readonly fileShortcuts = [
    { key: '\u2318/Ctrl+N', desc: 'New' },
    { key: '\u2318/Ctrl+L', desc: 'Load' },
    { key: '\u2318/Ctrl+S', desc: 'Save' },
  ];

  readonly editShortcuts = [
    { key: '\u2318/Ctrl+Z', desc: 'Undo' },
    { key: '\u2318/Ctrl+Y', desc: 'Redo' },
    { key: 'Del', desc: 'Delete' },
  ];

  readonly panelShortcuts = [
    { key: 'G', desc: 'Declarations' },
    { key: 'I', desc: 'Issues' },
    { key: '\u2318/Ctrl+D', desc: 'Declarations' },
  ];

  /** Screen position of world origin (0,0) */
  readonly originScreen = computed(() => {
    const pan = this.canvasStore.panOffset();
    const z = this.canvasStore.zoom();
    return { x: pan.x + 0 * z, y: pan.y + 0 * z };
  });

  /** Info for each place and transition */
  readonly elementInfos = computed(() => {
    const pan = this.canvasStore.panOffset();
    const z = this.canvasStore.zoom();
    const infos: { id: string; screenX: number; screenY: number; label: string }[] = [];

    for (const place of this.netStore.places()) {
      const sx = place.position.x * z + pan.x;
      const sy = place.position.y * z + pan.y;
      const w = Math.round(place.size.width);
      const h = Math.round(place.size.height);
      infos.push({
        id: place.id,
        screenX: sx,
        screenY: sy,
        label: `(${Math.round(place.position.x)}, ${Math.round(place.position.y)}) ${w}\u00D7${h}`,
      });
    }

    for (const trans of this.netStore.transitions()) {
      // top-left corner
      const tlx = trans.position.x - trans.size.width / 2;
      const tly = trans.position.y - trans.size.height / 2;
      const sx = tlx * z + pan.x;
      const sy = tly * z + pan.y;
      const w = Math.round(trans.size.width);
      const h = Math.round(trans.size.height);
      infos.push({
        id: trans.id,
        screenX: sx,
        screenY: sy,
        label: `(${Math.round(tlx)}, ${Math.round(tly)}) ${w}\u00D7${h}`,
      });
    }

    return infos;
  });

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === '?') {
      this.uiStore.cheatsheetVisible.set(true);
    }
  }

  @HostListener('document:keyup', ['$event'])
  onKeyup(event: KeyboardEvent): void {
    if (event.key === '?') {
      this.uiStore.cheatsheetVisible.set(false);
    }
  }
}
