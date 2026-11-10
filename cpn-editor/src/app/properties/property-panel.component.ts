import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Completion } from '@codemirror/autocomplete';
import { Extension } from '@codemirror/state';
import { NetStoreService } from '../state/net-store.service';
import { SelectionStoreService } from '../state/selection-store.service';
import { UiStoreService } from '../state/ui-store.service';
import { ArcDrawMode, ElementGraphics, NetObject } from '../core/model';
import { CodeEditorComponent } from '../shared/code-editor/code-editor.component';
import { smlLanguage } from '../shared/code-editor/sml-language';
import { CompletionProvider } from '../shared/code-editor/sml-completion';

const SWATCH_COLORS = [
  '#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#ffffff',
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16', '#a855f7', '#e11d48',
];

@Component({
  selector: 'cpn-property-panel',
  standalone: true,
  imports: [FormsModule, CodeEditorComponent],
  template: `
    @if (selectedObject(); as obj) {
      <div class="panel" [class.visible]="true" [style.width.px]="panelWidth()" [style.height.px]="panelHeight()">
        <div class="panel-resize-handle resize-left" (pointerdown)="onResizeStart($event, 'left')"></div>
        <div class="panel-resize-handle resize-bottom" (pointerdown)="onResizeStart($event, 'bottom')"></div>
        <div class="panel-resize-handle resize-corner" (pointerdown)="onResizeStart($event, 'corner')"></div>
        <div class="panel-header">
          <span class="panel-kind">{{ kindLabel(obj) }}</span>
          <span class="panel-id">{{ obj.id.slice(0, 8) }}</span>
        </div>

        <div class="tab-bar">
          <button
            class="tab-btn"
            [class.active]="currentTab() === 'properties'"
            (click)="currentTab.set('properties')"
          >Properties</button>
          <button
            class="tab-btn"
            [class.active]="currentTab() === 'visual'"
            (click)="currentTab.set('visual')"
          >Visual</button>
        </div>

        @if (currentTab() === 'properties') {
          @switch (obj.kind) {
            @case ('place') {
              <div class="panel-body">
                <label class="field">
                  <span class="field-label">Name</span>
                  <input
                    #nameInput
                    class="field-input"
                    [ngModel]="formName()"
                    (ngModelChange)="formName.set($event)"
                    (blur)="commitPlace(obj)"
                    (keydown.enter)="commitPlace(obj); $any($event.target).blur()"
                  />
                </label>
                <label class="field">
                  <span class="field-label">Colour Set</span>
                  <select
                    class="field-input"
                    [ngModel]="formColourSet()"
                    (ngModelChange)="formColourSet.set($event); commitPlace(obj)"
                  >
                    <option value="">(none)</option>
                    @for (cs of availableColourSets(); track cs.id) {
                      <option [value]="cs.name">{{ cs.name }}</option>
                    }
                  </select>
                </label>
                <div class="field">
                  <span class="field-label">Initial Marking</span>
                  <cpn-code-editor
                    [value]="formMarking()"
                    [extensions]="smlExtensions"
                    [completionProvider]="completionProvider"
                    [trapTab]="false"
                    (valueChange)="formMarking.set($event)"
                    (blur)="commitPlace(obj)"
                  />
                </div>
              </div>
            }
            @case ('transition') {
              <div class="panel-body">
                <label class="field">
                  <span class="field-label">Name</span>
                  <input
                    #nameInput
                    class="field-input"
                    [ngModel]="formName()"
                    (ngModelChange)="formName.set($event)"
                    (blur)="commitTransition(obj)"
                    (keydown.enter)="$any($event.target).blur()"
                  />
                </label>
                <div class="field">
                  <span class="field-label">Guard</span>
                  <cpn-code-editor
                    [value]="formGuard()"
                    [extensions]="smlExtensions"
                    [completionProvider]="completionProvider"
                    [trapTab]="false"
                    (valueChange)="formGuard.set($event)"
                    (blur)="commitTransition(obj)"
                  />
                </div>
                <div class="field">
                  <span class="field-label">Duration</span>
                  <cpn-code-editor
                    [value]="formDuration()"
                    [extensions]="smlExtensions"
                    [completionProvider]="completionProvider"
                    [trapTab]="false"
                    (valueChange)="formDuration.set($event)"
                    (blur)="commitTransition(obj)"
                  />
                </div>
              </div>
            }
            @case ('arc') {
              <div class="panel-body">
                <div class="field">
                  <span class="field-label">Inscription</span>
                  <cpn-code-editor
                    #inscriptionInput
                    [value]="formInscription()"
                    [extensions]="smlExtensions"
                    [completionProvider]="completionProvider"
                    [trapTab]="false"
                    (valueChange)="formInscription.set($event)"
                    (blur)="commitArc(obj)"
                  />
                </div>
                <label class="field">
                  <span class="field-label">Draw Mode</span>
                  <select
                    class="field-input"
                    [ngModel]="formDrawMode()"
                    (ngModelChange)="formDrawMode.set($event); commitDrawMode(obj)"
                  >
                    <option value="straight">Straight</option>
                    <option value="rounded">Rounded</option>
                    <option value="bezier">Bezier</option>
                  </select>
                </label>
              </div>
            }
          }
        }

        @if (currentTab() === 'visual') {
          <div class="panel-body">
            <div class="visual-section">
              <span class="section-title">Font</span>
              <div class="visual-row">
                <label class="field field-inline">
                  <span class="field-label">Size</span>
                  <input
                    type="number"
                    class="field-input field-num"
                    min="8"
                    max="48"
                    [ngModel]="gfxFontSize()"
                    (ngModelChange)="gfxFontSize.set($event); commitGraphics(obj)"
                  />
                </label>
                <div class="field field-inline">
                  <span class="field-label">Color</span>
                  <div class="color-picker-wrapper">
                    <button
                      class="color-swatch-btn"
                      [style.background]="gfxFontColor()"
                      (click)="toggleSwatchPicker('fontColor')"
                    ></button>
                    @if (activeSwatchPicker() === 'fontColor') {
                      <div class="swatch-dropdown">
                        @for (c of swatchColors; track c) {
                          <button
                            class="swatch"
                            [style.background]="c"
                            [class.active]="gfxFontColor() === c"
                            (click)="gfxFontColor.set(c); commitGraphics(obj); toggleSwatchPicker(null)"
                          ></button>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>
              <label class="field">
                <span class="field-label">Family</span>
                <select
                  class="field-input"
                  [ngModel]="gfxFontFamily()"
                  (ngModelChange)="gfxFontFamily.set($event); commitGraphics(obj)"
                >
                  <option value="System Default">System Default</option>
                  <option value="Serif">Serif</option>
                  <option value="Sans Serif">Sans Serif</option>
                  <option value="Monospace">Monospace</option>
                </select>
              </label>
              <div class="style-toggles">
                <button
                  class="style-btn"
                  [class.active]="gfxFontBold()"
                  (click)="gfxFontBold.set(!gfxFontBold()); commitGraphics(obj)"
                ><b>B</b></button>
                <button
                  class="style-btn"
                  [class.active]="gfxFontItalic()"
                  (click)="gfxFontItalic.set(!gfxFontItalic()); commitGraphics(obj)"
                ><i>I</i></button>
                <button
                  class="style-btn"
                  [class.active]="gfxFontUnderline()"
                  (click)="gfxFontUnderline.set(!gfxFontUnderline()); commitGraphics(obj)"
                ><u>U</u></button>
              </div>
            </div>

            <div class="visual-section">
              <span class="section-title">Stroke</span>
              <div class="visual-row">
                <div class="field field-inline">
                  <span class="field-label">Color</span>
                  <div class="color-picker-wrapper">
                    <button
                      class="color-swatch-btn"
                      [style.background]="gfxStrokeColor()"
                      (click)="toggleSwatchPicker('strokeColor')"
                    ></button>
                    @if (activeSwatchPicker() === 'strokeColor') {
                      <div class="swatch-dropdown">
                        @for (c of swatchColors; track c) {
                          <button
                            class="swatch"
                            [style.background]="c"
                            [class.active]="gfxStrokeColor() === c"
                            (click)="gfxStrokeColor.set(c); commitGraphics(obj); toggleSwatchPicker(null)"
                          ></button>
                        }
                      </div>
                    }
                  </div>
                </div>
                <label class="field field-inline">
                  <span class="field-label">Width</span>
                  <input
                    type="number"
                    class="field-input field-num"
                    min="1"
                    max="10"
                    [ngModel]="gfxStrokeWidth()"
                    (ngModelChange)="gfxStrokeWidth.set($event); commitGraphics(obj)"
                  />
                </label>
              </div>
            </div>

            @if (obj.kind !== 'arc') {
              <div class="visual-section">
                <span class="section-title">Fill</span>
                <div class="visual-row">
                  <div class="field field-inline">
                    <span class="field-label">Color</span>
                    <div class="color-picker-wrapper">
                      <button
                        class="color-swatch-btn"
                        [style.background]="gfxFillColor()"
                        (click)="toggleSwatchPicker('fillColor')"
                      ></button>
                      @if (activeSwatchPicker() === 'fillColor') {
                        <div class="swatch-dropdown">
                          @for (c of swatchColors; track c) {
                            <button
                              class="swatch"
                              [style.background]="c"
                              [class.active]="gfxFillColor() === c"
                              (click)="gfxFillColor.set(c); commitGraphics(obj); toggleSwatchPicker(null)"
                            ></button>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: `
    .panel {
      position: absolute;
      top: 12px;
      right: 12px;
      background: var(--cpn-bg-surface);
      border: 1px solid var(--cpn-border);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      transform: translateX(calc(100% + 20px));
      transition: transform 0.2s ease;
      z-index: 10;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .panel-resize-handle {
      position: absolute;
      z-index: 1;
    }
    .resize-left {
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      cursor: ew-resize;
    }
    .resize-bottom {
      left: 4px;
      right: 0;
      bottom: 0;
      height: 4px;
      cursor: ns-resize;
    }
    .resize-corner {
      left: 0;
      bottom: 0;
      width: 10px;
      height: 10px;
      cursor: nesw-resize;
    }
    .panel.visible {
      transform: translateX(0);
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid var(--cpn-border);
      background: var(--cpn-bg-surface-alt);
    }
    .panel-kind {
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: var(--cpn-text);
    }
    .panel-id {
      font-size: 10px;
      color: var(--cpn-text-muted);
      font-family: monospace;
    }
    .tab-bar {
      display: flex;
      border-bottom: 1px solid var(--cpn-border);
    }
    .tab-btn {
      flex: 1;
      padding: 6px 8px;
      font-size: 11px;
      font-weight: 500;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--cpn-text-secondary);
      cursor: pointer;
      &:hover {
        color: var(--cpn-text);
      }
      &.active {
        color: var(--cpn-active);
        border-bottom-color: var(--cpn-active);
      }
    }
    .panel-body {
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .field-inline {
      flex-direction: row;
      align-items: center;
      gap: 6px;
    }
    .field-label {
      font-size: 11px;
      color: var(--cpn-text-secondary);
      font-weight: 500;
      white-space: nowrap;
    }
    .field-input {
      background: var(--cpn-bg-surface-alt);
      border: 1px solid var(--cpn-border-subtle);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      color: var(--cpn-text);
      font-family: inherit;
      outline: none;
      &:focus {
        border-color: var(--cpn-active);
      }
    }
    .field-num {
      width: 56px;
    }
    .field-textarea {
      resize: vertical;
      min-height: 36px;
      font-family: monospace;
      font-size: 11px;
    }
    .field-color {
      width: 32px;
      height: 24px;
      padding: 1px;
      border: 1px solid var(--cpn-border-subtle);
      border-radius: 4px;
      background: none;
      cursor: pointer;
    }
    .color-picker-wrapper {
      position: relative;
    }
    .color-swatch-btn {
      width: 28px;
      height: 22px;
      border-radius: 4px;
      border: 2px solid rgba(0, 0, 0, 0.15);
      cursor: pointer;
      padding: 0;
      &:hover {
        border-color: rgba(0, 0, 0, 0.3);
      }
    }
    .swatch-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 20;
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      padding: 6px;
      background: var(--cpn-bg-surface);
      border: 1px solid var(--cpn-border);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      width: 140px;
      margin-top: 4px;
    }
    .swatch {
      width: 20px;
      height: 20px;
      border-radius: 3px;
      border: 2px solid transparent;
      cursor: pointer;
      padding: 0;
      &:hover {
        border-color: rgba(0, 0, 0, 0.3);
      }
      &.active {
        border-color: var(--cpn-text);
      }
    }
    .visual-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .section-title {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--cpn-text-muted);
      letter-spacing: 0.5px;
    }
    .visual-row {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .style-toggles {
      display: flex;
      gap: 4px;
    }
    .style-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--cpn-bg-surface-alt);
      border: 1px solid var(--cpn-border-subtle);
      border-radius: 4px;
      color: var(--cpn-text);
      cursor: pointer;
      font-size: 12px;
      &:hover {
        border-color: var(--cpn-border);
      }
      &.active {
        background: var(--cpn-active);
        color: white;
        border-color: var(--cpn-active);
      }
    }
  `,
})
export class PropertyPanelComponent {
  private readonly netStore = inject(NetStoreService);
  private readonly selectionStore = inject(SelectionStoreService);
  private readonly uiStore = inject(UiStoreService);

  private static readonly STORAGE_KEY_W = 'cpn-property-panel-width';
  private static readonly STORAGE_KEY_H = 'cpn-property-panel-height';
  private static readonly MIN_WIDTH = 180;
  private static readonly MAX_WIDTH = 800;
  private static readonly DEFAULT_WIDTH = 240;
  private static readonly MIN_HEIGHT = 120;
  private static readonly MAX_HEIGHT = 900;
  private static readonly DEFAULT_HEIGHT = 400;

  readonly panelWidth = signal(PropertyPanelComponent.loadStoredWidth());
  readonly panelHeight = signal(PropertyPanelComponent.loadStoredHeight());

  private resizeStartX = 0;
  private resizeStartY = 0;
  private resizeStartWidth = 0;
  private resizeStartHeight = 0;
  private resizeDirection: 'left' | 'bottom' | 'corner' = 'left';
  private onResizeMoveBound!: (e: PointerEvent) => void;
  private onResizeEndBound!: () => void;

  readonly selectedObject = computed<NetObject | null>(() => {
    const ids = this.selectionStore.selectedIds();
    if (ids.size !== 1) return null;
    const id = [...ids][0];
    return this.netStore.findObject(id) ?? null;
  });

  readonly currentTab = signal<'properties' | 'visual'>('properties');

  // Local form state — Properties tab
  readonly formName = signal('');
  readonly formColourSet = signal('');
  readonly formMarking = signal('');
  readonly formGuard = signal('');
  readonly formDuration = signal('');
  readonly formInscription = signal('');
  readonly formDrawMode = signal<ArcDrawMode>('straight');

  // Local form state — Visual tab
  readonly gfxFontSize = signal<number>(12);
  readonly gfxFontColor = signal('#000000');
  readonly gfxFontFamily = signal('System Default');
  readonly gfxFontBold = signal(false);
  readonly gfxFontItalic = signal(false);
  readonly gfxFontUnderline = signal(false);
  readonly gfxStrokeColor = signal('#000000');
  readonly gfxStrokeWidth = signal<number>(2);
  readonly gfxFillColor = signal('#ffffff');

  readonly activeSwatchPicker = signal<string | null>(null);
  readonly swatchColors = SWATCH_COLORS;

  private readonly nameInputRef = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  private readonly inscriptionRef = viewChild<CodeEditorComponent>('inscriptionInput');

  readonly availableColourSets = computed(() => this.netStore.colourSets().filter((cs) => cs.name));

  readonly smlExtensions: Extension[] = [smlLanguage];

  readonly completionProvider: CompletionProvider = () => {
    const completions: Completion[] = [];
    for (const cs of this.netStore.colourSets()) {
      if (cs.name) completions.push({ label: cs.name, type: 'type', detail: 'colour set' });
    }
    return completions;
  };

  private lastSelectedId = '';

  constructor() {
    this.onResizeMoveBound = this.onResizeMove.bind(this);
    this.onResizeEndBound = this.onResizeEnd.bind(this);

    // Publish the space the panel occupies so other overlays (e.g. the
    // diagnostics button) can dock next to it instead of a hard-coded offset.
    effect(() => {
      const visible = this.selectedObject() !== null;
      this.uiStore.propertyPanelWidth.set(visible ? this.panelWidth() : 0);
    });

    effect(() => {
      const obj = this.selectedObject();
      const newId = obj?.id ?? '';
      if (newId !== this.lastSelectedId) {
        this.lastSelectedId = newId;
        this.initForm(obj);
        if (obj) {
          // Auto-focus the first field for the selected element
          requestAnimationFrame(() => {
            if (obj.kind === 'place' || obj.kind === 'transition') {
              const input = this.nameInputRef()?.nativeElement;
              if (input) {
                input.focus();
                input.select();
              }
            } else if (obj.kind === 'arc') {
              this.inscriptionRef()?.focus();
            }
          });
        }
      }
    });

    effect(() => {
      const field = this.selectionStore.focusField();
      if (field === 'inscription' && this.selectedObject()?.kind === 'arc') {
        requestAnimationFrame(() => {
          this.inscriptionRef()?.focus();
          this.selectionStore.focusField.set(null);
        });
      }
    });
  }

  kindLabel(obj: NetObject): string {
    switch (obj.kind) {
      case 'place': return 'Place';
      case 'transition': return 'Transition';
      case 'arc': return 'Arc';
    }
  }

  toggleSwatchPicker(key: string | null): void {
    this.activeSwatchPicker.update((cur) => (cur === key ? null : key));
  }

  commitPlace(obj: NetObject): void {
    if (obj.kind !== 'place') return;
    this.netStore.updatePlace(obj.id, {
      name: this.formName(),
      colourSetId: this.formColourSet() || null,
      initialMarking: { text: this.formMarking() },
    });
  }

  commitTransition(obj: NetObject): void {
    if (obj.kind !== 'transition') return;
    this.netStore.updateTransition(obj.id, {
      name: this.formName(),
      guard: { text: this.formGuard() },
      duration: { text: this.formDuration() },
    });
  }

  commitArc(obj: NetObject): void {
    if (obj.kind !== 'arc') return;
    this.netStore.updateArc(obj.id, {
      inscription: { text: this.formInscription() },
    });
  }

  commitDrawMode(obj: NetObject): void {
    if (obj.kind !== 'arc') return;
    this.netStore.updateArc(obj.id, {
      drawMode: this.formDrawMode(),
    });
  }

  commitGraphics(obj: NetObject): void {
    const graphics: ElementGraphics = {};

    const fontSize = Number(this.gfxFontSize());
    if (fontSize && fontSize !== 12) graphics.fontSize = fontSize;
    const fontColor = this.gfxFontColor();
    if (fontColor && fontColor !== '#000000') graphics.fontColor = fontColor;
    const fontFamily = this.gfxFontFamily();
    if (fontFamily && fontFamily !== 'System Default') graphics.fontFamily = fontFamily;
    if (this.gfxFontBold()) graphics.fontBold = true;
    if (this.gfxFontItalic()) graphics.fontItalic = true;
    if (this.gfxFontUnderline()) graphics.fontUnderline = true;
    const strokeColor = this.gfxStrokeColor();
    if (strokeColor && strokeColor !== '#000000') graphics.strokeColor = strokeColor;
    const strokeWidth = Number(this.gfxStrokeWidth());
    if (strokeWidth && strokeWidth !== 2) graphics.strokeWidth = strokeWidth;
    const fillColor = this.gfxFillColor();
    if (fillColor && fillColor !== '#ffffff') graphics.fillColor = fillColor;

    const gfx = Object.keys(graphics).length > 0 ? graphics : undefined;

    switch (obj.kind) {
      case 'place':
        this.netStore.updatePlace(obj.id, { graphics: gfx });
        break;
      case 'transition':
        this.netStore.updateTransition(obj.id, { graphics: gfx });
        break;
      case 'arc':
        this.netStore.updateArc(obj.id, { graphics: gfx });
        break;
    }
  }

  onResizeStart(event: PointerEvent, direction: 'left' | 'bottom' | 'corner'): void {
    event.preventDefault();
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    this.resizeStartWidth = this.panelWidth();
    this.resizeStartHeight = this.panelHeight();
    this.resizeDirection = direction;
    document.addEventListener('pointermove', this.onResizeMoveBound);
    document.addEventListener('pointerup', this.onResizeEndBound);
  }

  private onResizeMove(event: PointerEvent): void {
    if (this.resizeDirection === 'left' || this.resizeDirection === 'corner') {
      const delta = this.resizeStartX - event.clientX;
      const newWidth = Math.max(
        PropertyPanelComponent.MIN_WIDTH,
        Math.min(PropertyPanelComponent.MAX_WIDTH, this.resizeStartWidth + delta),
      );
      this.panelWidth.set(newWidth);
    }
    if (this.resizeDirection === 'bottom' || this.resizeDirection === 'corner') {
      const delta = event.clientY - this.resizeStartY;
      const newHeight = Math.max(
        PropertyPanelComponent.MIN_HEIGHT,
        Math.min(PropertyPanelComponent.MAX_HEIGHT, this.resizeStartHeight + delta),
      );
      this.panelHeight.set(newHeight);
    }
  }

  private onResizeEnd(): void {
    document.removeEventListener('pointermove', this.onResizeMoveBound);
    document.removeEventListener('pointerup', this.onResizeEndBound);
    try {
      localStorage.setItem(PropertyPanelComponent.STORAGE_KEY_W, String(this.panelWidth()));
      localStorage.setItem(PropertyPanelComponent.STORAGE_KEY_H, String(this.panelHeight()));
    } catch {
      // localStorage unavailable
    }
  }

  private static loadStoredWidth(): number {
    try {
      const stored = localStorage.getItem(PropertyPanelComponent.STORAGE_KEY_W);
      if (stored) {
        const val = Number(stored);
        if (!isNaN(val) && val >= PropertyPanelComponent.MIN_WIDTH && val <= PropertyPanelComponent.MAX_WIDTH) {
          return val;
        }
      }
    } catch {
      // localStorage unavailable
    }
    return PropertyPanelComponent.DEFAULT_WIDTH;
  }

  private static loadStoredHeight(): number {
    try {
      const stored = localStorage.getItem(PropertyPanelComponent.STORAGE_KEY_H);
      if (stored) {
        const val = Number(stored);
        if (!isNaN(val) && val >= PropertyPanelComponent.MIN_HEIGHT && val <= PropertyPanelComponent.MAX_HEIGHT) {
          return val;
        }
      }
    } catch {
      // localStorage unavailable
    }
    return PropertyPanelComponent.DEFAULT_HEIGHT;
  }

  private initForm(obj: NetObject | null): void {
    if (!obj) return;
    this.formName.set('name' in obj ? obj.name : '');
    if (obj.kind === 'place') {
      this.formColourSet.set(obj.colourSetId ?? '');
      this.formMarking.set(obj.initialMarking.text);
    } else if (obj.kind === 'transition') {
      this.formGuard.set(obj.guard.text);
      this.formDuration.set(obj.duration.text);
    } else if (obj.kind === 'arc') {
      this.formInscription.set(obj.inscription.text);
      this.formDrawMode.set(obj.drawMode);
    }

    // Initialize graphics form
    const g = obj.graphics;
    this.gfxFontSize.set(g?.fontSize ?? 12);
    this.gfxFontColor.set(g?.fontColor ?? '#000000');
    this.gfxFontFamily.set(g?.fontFamily ?? 'System Default');
    this.gfxFontBold.set(g?.fontBold ?? false);
    this.gfxFontItalic.set(g?.fontItalic ?? false);
    this.gfxFontUnderline.set(g?.fontUnderline ?? false);
    this.gfxStrokeColor.set(g?.strokeColor ?? '#000000');
    this.gfxStrokeWidth.set(g?.strokeWidth ?? 2);
    this.gfxFillColor.set(g?.fillColor ?? '#ffffff');
  }
}
