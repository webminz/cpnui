import { Component, HostListener, inject } from '@angular/core';
import {
  InteractionModeStoreService,
  ToolMode,
} from '../state/interaction-mode-store.service';

interface ToolButton {
  mode: ToolMode;
  label: string;
  shortcut: string;
  icon: string;
}

@Component({
  selector: 'cpn-palette',
  standalone: true,
  template: `
    <div class="palette">
      @for (tool of navTools; track tool.mode) {
        <button
          class="tool-btn"
          [class.active]="interactionStore.mode() === tool.mode"
          (click)="interactionStore.setMode(tool.mode)"
          [title]="tool.label + ' (' + tool.shortcut + ')'"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
          <span class="tool-label">{{ tool.label }}</span>
          <span class="tool-shortcut">{{ tool.shortcut }}</span>
        </button>
      }
      <hr class="palette-divider" />
      @for (tool of createTools; track tool.mode) {
        <button
          class="tool-btn"
          [class.active]="interactionStore.mode() === tool.mode"
          (click)="interactionStore.setMode(tool.mode)"
          [title]="tool.label + ' (' + tool.shortcut + ')'"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
          <span class="tool-label">{{ tool.label }}</span>
          <span class="tool-shortcut">{{ tool.shortcut }}</span>
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 10;
    }
    .palette {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px;
      background: var(--cpn-bg-surface);
      border: 1px solid var(--cpn-border);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }
    .tool-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 6px;
      color: var(--cpn-text-secondary);
      cursor: pointer;
      text-align: left;
      font-size: 13px;
      &:hover {
        background: var(--cpn-bg-surface-alt);
        color: var(--cpn-text);
      }
      &.active {
        background: var(--cpn-bg-surface-alt);
        border-color: var(--cpn-active);
        color: var(--cpn-active);
      }
    }
    .palette-divider {
      border: none;
      border-top: 1px solid var(--cpn-border);
      margin: 4px 0;
    }
    .tool-icon {
      font-size: 16px;
      width: 20px;
      text-align: center;
    }
    .tool-label {
      flex: 1;
    }
    .tool-shortcut {
      font-size: 11px;
      color: var(--cpn-text-muted);
      background: var(--cpn-badge-bg);
      padding: 1px 5px;
      border-radius: 3px;
    }
  `,
})
export class PaletteComponent {
  readonly interactionStore = inject(InteractionModeStoreService);

  readonly navTools: ToolButton[] = [
    { mode: 'select', label: 'Select', shortcut: 'V', icon: '\u25B7' },
    { mode: 'pan', label: 'Pan', shortcut: 'H', icon: '\u261D' },
  ];

  readonly createTools: ToolButton[] = [
    { mode: 'place', label: 'Place', shortcut: 'P', icon: '\u25CB' },
    { mode: 'transition', label: 'Transition', shortcut: 'T', icon: '\u25AD' },
    { mode: 'arc', label: 'Arc', shortcut: 'A', icon: '\u2192' },
  ];

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target as HTMLElement).closest?.('.cm-editor') !== null
    ) {
      return;
    }
    switch (event.key.toLowerCase()) {
      case 'v':
        this.interactionStore.setMode('select');
        break;
      case 'p':
        this.interactionStore.setMode('place');
        break;
      case 't':
        this.interactionStore.setMode('transition');
        break;
      case 'a':
        this.interactionStore.setMode('arc');
        break;
      case 'h':
        this.interactionStore.setMode('pan');
        break;
    }
  }
}
