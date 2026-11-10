import { Component, effect, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Completion } from '@codemirror/autocomplete';
import { Extension } from '@codemirror/state';
import { NetStoreService } from '../state/net-store.service';
import { UiStoreService } from '../state/ui-store.service';
import { ColourSet } from '../core/model';
import { COLOUR_SET_PALETTE } from '../core/model/factory';
import { CodeEditorComponent } from '../shared/code-editor/code-editor.component';
import { smlLanguage } from '../shared/code-editor/sml-language';
import { CompletionProvider } from '../shared/code-editor/sml-completion';

/** Parse the name from a colset declaration, e.g. "colset FOO = int;" → "FOO" */
function parseColsetName(declaration: string): string {
  const m = declaration.match(/^\s*colset\s+(\w+)\s*=/);
  return m ? m[1] : '';
}

const SWATCH_COLORS = COLOUR_SET_PALETTE;

@Component({
  selector: 'cpn-declarations-panel',
  standalone: true,
  imports: [FormsModule, CodeEditorComponent],
  template: `
    @if (uiStore.declarationsPanelVisible()) {
      <div class="decl-panel" [style.height.px]="panelHeight()">
        <div class="resize-handle" (pointerdown)="onResizeStart($event)"></div>
        <div class="panel-header">
          <span class="panel-title">Declarations</span>
          <button class="close-btn" (click)="uiStore.declarationsPanelVisible.set(false)" title="Close (Ctrl+D)">
            &times;
          </button>
        </div>
        <div class="panel-content">
          <div class="section">
            <div class="section-header">
              <span class="section-title">Colour Sets</span>
              <button class="add-btn" (click)="addColourSet()" title="Add colour set">+</button>
            </div>
            @for (cs of localColourSets(); track cs.id) {
              <div class="cs-row">
                <div class="cs-color-name">
                  <button
                    class="cs-color-swatch"
                    [style.background]="cs.color || '#6b7280'"
                    (click)="toggleColorPicker(cs.id)"
                    title="Pick colour set colour"
                  ></button>
                  <span class="cs-name-readonly">{{ parseName(cs.declaration) || '(unnamed)' }}</span>
                </div>
                <cpn-code-editor
                  class="cs-decl"
                  [value]="cs.declaration"
                  [extensions]="smlExtensions"
                  [completionProvider]="completionProvider"
                  placeholder="e.g. colset INT = int;"
                  (valueChange)="onDeclarationChange(cs.id, $event)"
                  (blur)="commitColourSet(cs.id)"
                />
                <button class="remove-btn" (click)="removeColourSet(cs.id)" title="Remove">&times;</button>
              </div>
              @if (colorPickerOpenFor() === cs.id) {
                <div class="swatch-picker">
                  @for (c of swatchColors; track c) {
                    <button
                      class="swatch"
                      [style.background]="c"
                      [class.active]="cs.color === c"
                      (click)="pickColor(cs.id, c)"
                    ></button>
                  }
                </div>
              }
            }
            @if (localColourSets().length === 0) {
              <div class="empty-hint">No colour sets defined. Click + to add one.</div>
            }
          </div>

          <div class="section">
            <div class="section-header">
              <span class="section-title">Variables &amp; Values</span>
            </div>
            <cpn-code-editor
              [value]="localDeclarations()"
              [extensions]="smlExtensions"
              [completionProvider]="completionProvider"
              [showLineNumbers]="true"
              minHeight="80px"
              placeholder="e.g. var x : INT;"
              (valueChange)="localDeclarations.set($event)"
              (blur)="commitDeclarations()"
            />
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .decl-panel {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--cpn-bg-surface);
      border-top: 1px solid var(--cpn-border);
      display: flex;
      flex-direction: column;
      z-index: 9;
      box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
    }
    .resize-handle {
      position: absolute;
      top: -3px;
      left: 0;
      right: 0;
      height: 6px;
      cursor: ns-resize;
      z-index: 1;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 12px;
      border-bottom: 1px solid var(--cpn-border);
      background: var(--cpn-bg-surface-alt);
      flex-shrink: 0;
    }
    .panel-title {
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: var(--cpn-text);
    }
    .close-btn {
      background: none;
      border: none;
      color: var(--cpn-text-muted);
      font-size: 18px;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
      &:hover {
        color: var(--cpn-text);
      }
    }
    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--cpn-text-muted);
      letter-spacing: 0.5px;
    }
    .add-btn {
      background: none;
      border: 1px solid var(--cpn-border-subtle);
      border-radius: 4px;
      color: var(--cpn-text-secondary);
      width: 22px;
      height: 22px;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover {
        border-color: var(--cpn-active);
        color: var(--cpn-active);
      }
    }
    .cs-row {
      display: flex;
      gap: 6px;
      align-items: flex-start;
    }
    .cs-color-name {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
      width: 110px;
    }
    .cs-color-swatch {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      border: 2px solid rgba(0, 0, 0, 0.15);
      cursor: pointer;
      flex-shrink: 0;
      padding: 0;
      &:hover {
        border-color: rgba(0, 0, 0, 0.3);
      }
    }
    .cs-name-readonly {
      font-size: 12px;
      font-family: monospace;
      font-weight: 600;
      color: var(--cpn-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .cs-decl {
      flex: 1;
      min-width: 0;
    }
    .remove-btn {
      background: none;
      border: none;
      color: var(--cpn-text-muted);
      font-size: 16px;
      cursor: pointer;
      padding: 2px 4px;
      flex-shrink: 0;
      &:hover {
        color: #ef4444;
      }
    }
    .swatch-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 4px 0 4px 28px;
    }
    .swatch {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 2px solid transparent;
      cursor: pointer;
      padding: 0;
      &:hover {
        border-color: rgba(0, 0, 0, 0.3);
      }
      &.active {
        border-color: var(--cpn-text);
        box-shadow: 0 0 0 1px var(--cpn-bg-surface);
      }
    }
    .empty-hint {
      font-size: 11px;
      color: var(--cpn-text-muted);
      font-style: italic;
      padding: 4px 0;
    }
  `,
})
export class DeclarationsPanelComponent {
  private readonly netStore = inject(NetStoreService);
  readonly uiStore = inject(UiStoreService);

  private static readonly STORAGE_KEY_HEIGHT = 'cpn-declarations-panel-height';
  private static readonly MIN_HEIGHT = 120;
  private static readonly MAX_HEIGHT = 600;
  private static readonly DEFAULT_HEIGHT = 250;

  readonly panelHeight = signal(DeclarationsPanelComponent.loadStoredHeight());

  readonly localColourSets = signal<ColourSet[]>([]);
  readonly localDeclarations = signal('');
  readonly colorPickerOpenFor = signal<string | null>(null);

  readonly swatchColors = SWATCH_COLORS;

  readonly smlExtensions: Extension[] = [smlLanguage];

  readonly completionProvider: CompletionProvider = () => {
    const completions: Completion[] = [];
    for (const cs of this.netStore.colourSets()) {
      if (cs.name) completions.push({ label: cs.name, type: 'type', detail: 'colour set' });
    }
    return completions;
  };

  private resizeStartY = 0;
  private resizeStartHeight = 0;
  private onResizeMoveBound = this.onResizeMove.bind(this);
  private onResizeEndBound = this.onResizeEnd.bind(this);

  constructor() {
    effect(() => {
      const cs = this.netStore.colourSets();
      this.localColourSets.set(cs.map((c) => ({ ...c })));
    });

    effect(() => {
      this.localDeclarations.set(this.netStore.declarations());
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
      event.preventDefault();
      this.uiStore.toggleDeclarationsPanel();
    }
  }

  parseName(declaration: string): string {
    return parseColsetName(declaration);
  }

  addColourSet(): void {
    this.netStore.addColourSet();
  }

  removeColourSet(id: string): void {
    this.netStore.removeColourSet(id);
  }

  onDeclarationChange(id: string, value: string): void {
    const name = parseColsetName(value);
    this.localColourSets.update((list) =>
      list.map((cs) => (cs.id === id ? { ...cs, declaration: value, name } : cs))
    );
  }

  toggleColorPicker(id: string): void {
    this.colorPickerOpenFor.update((cur) => (cur === id ? null : id));
  }

  pickColor(id: string, color: string): void {
    this.localColourSets.update((list) =>
      list.map((cs) => (cs.id === id ? { ...cs, color } : cs))
    );
    this.netStore.updateColourSet(id, { color });
    this.colorPickerOpenFor.set(null);
  }

  commitColourSet(id: string): void {
    const cs = this.localColourSets().find((c) => c.id === id);
    if (cs) {
      this.netStore.updateColourSet(id, { name: cs.name, declaration: cs.declaration });
    }
  }

  commitDeclarations(): void {
    this.netStore.updateDeclarations(this.localDeclarations());
  }

  onResizeStart(event: PointerEvent): void {
    event.preventDefault();
    this.resizeStartY = event.clientY;
    this.resizeStartHeight = this.panelHeight();
    document.addEventListener('pointermove', this.onResizeMoveBound);
    document.addEventListener('pointerup', this.onResizeEndBound);
  }

  private onResizeMove(event: PointerEvent): void {
    const delta = this.resizeStartY - event.clientY;
    const newHeight = Math.max(
      DeclarationsPanelComponent.MIN_HEIGHT,
      Math.min(DeclarationsPanelComponent.MAX_HEIGHT, this.resizeStartHeight + delta)
    );
    this.panelHeight.set(newHeight);
  }

  private onResizeEnd(): void {
    document.removeEventListener('pointermove', this.onResizeMoveBound);
    document.removeEventListener('pointerup', this.onResizeEndBound);
    try {
      localStorage.setItem(
        DeclarationsPanelComponent.STORAGE_KEY_HEIGHT,
        String(this.panelHeight())
      );
    } catch {
      // localStorage unavailable
    }
  }

  private static loadStoredHeight(): number {
    try {
      const stored = localStorage.getItem(DeclarationsPanelComponent.STORAGE_KEY_HEIGHT);
      if (stored) {
        const val = Number(stored);
        if (
          !isNaN(val) &&
          val >= DeclarationsPanelComponent.MIN_HEIGHT &&
          val <= DeclarationsPanelComponent.MAX_HEIGHT
        ) {
          return val;
        }
      }
    } catch {
      // localStorage unavailable
    }
    return DeclarationsPanelComponent.DEFAULT_HEIGHT;
  }
}
