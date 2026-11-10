import { Component, computed, inject } from '@angular/core';
import { ViolationService } from '../state/violation.service';
import { SelectionStoreService } from '../state/selection-store.service';
import { CanvasStoreService } from '../state/canvas-store.service';
import { NetStoreService } from '../state/net-store.service';
import { UiStoreService } from '../state/ui-store.service';
import { Violation } from '../core/model/violation';

/** Gap between the canvas edge / property panel and the diagnostics button (px). */
const EDGE_MARGIN = 12;
const PANEL_GAP = 8;

@Component({
  selector: 'cpn-violations-panel',
  standalone: true,
  host: { '[style.right.px]': 'rightOffset()' },
  template: `
    <button
      class="violations-btn"
      [class.has-errors]="violationService.hasErrors()"
      [class.has-warnings]="!violationService.hasErrors() && violationService.violationCount() > 0"
      (click)="togglePanel()"
      [title]="buttonTitle()"
    >
      @if (violationService.hasErrors()) {
        <span class="badge error-badge">{{ violationService.errorCount() }}</span>
      } @else if (violationService.violationCount() > 0) {
        <span class="badge warning-badge">{{ violationService.violationCount() }}</span>
      }
      <span class="btn-icon">&#9432;</span>
    </button>

    @if (panelOpen()) {
      <div class="violations-dialog">
        <div class="dialog-header">
          <span class="dialog-title">Semantic Checks</span>
          <span class="dialog-count">{{ violationService.violationCount() }} issue{{ violationService.violationCount() !== 1 ? 's' : '' }}</span>
          <button class="close-btn" (click)="panelOpen.set(false)">&times;</button>
        </div>
        <div class="dialog-body">
          @if (violationService.violationCount() === 0) {
            <div class="no-issues">No issues found.</div>
          } @else {
            @for (v of violationService.violations(); track v.id) {
              <button class="violation-row" (click)="navigateTo(v)">
                <span class="severity-icon" [class.error]="v.severity === 'error'" [class.warning]="v.severity === 'warning'">
                  {{ v.severity === 'error' ? '\u2716' : '\u26A0' }}
                </span>
                <span class="violation-message">{{ v.message }}</span>
              </button>
            }
          }
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 11;
      transition: right 0.2s ease;
    }
    .violations-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--cpn-bg-surface);
      border: 1px solid var(--cpn-border);
      border-radius: 8px;
      padding: 6px 10px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      color: var(--cpn-text-secondary);
      font-size: 16px;
      transition: border-color 0.15s, color 0.15s;
      &:hover {
        border-color: var(--cpn-active);
        color: var(--cpn-text);
      }
      &.has-errors {
        border-color: #ef4444;
        color: #ef4444;
      }
      &.has-warnings {
        border-color: #f59e0b;
        color: #f59e0b;
      }
    }
    .btn-icon {
      font-size: 18px;
      line-height: 1;
    }
    .badge {
      font-size: 11px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 8px;
      line-height: 1.2;
    }
    .error-badge {
      background: #ef4444;
      color: white;
    }
    .warning-badge {
      background: #f59e0b;
      color: white;
    }
    .violations-dialog {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 380px;
      max-height: 320px;
      background: var(--cpn-bg-surface);
      border: 1px solid var(--cpn-border);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--cpn-border);
      background: var(--cpn-bg-surface-alt);
      flex-shrink: 0;
    }
    .dialog-title {
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: var(--cpn-text);
    }
    .dialog-count {
      font-size: 11px;
      color: var(--cpn-text-muted);
      flex: 1;
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
    .dialog-body {
      flex: 1;
      overflow-y: auto;
      padding: 4px 0;
    }
    .no-issues {
      padding: 16px;
      text-align: center;
      color: var(--cpn-text-muted);
      font-size: 12px;
    }
    .violation-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 6px 12px;
      width: 100%;
      text-align: left;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--cpn-text);
      font-size: 12px;
      &:hover {
        background: var(--cpn-bg-surface-alt);
      }
    }
    .severity-icon {
      flex-shrink: 0;
      font-size: 12px;
      margin-top: 1px;
      &.error { color: #ef4444; }
      &.warning { color: #f59e0b; }
    }
    .violation-message {
      line-height: 1.4;
    }
  `,
})
export class ViolationsPanelComponent {
  readonly violationService = inject(ViolationService);
  private readonly selectionStore = inject(SelectionStoreService);
  private readonly canvasStore = inject(CanvasStoreService);
  private readonly netStore = inject(NetStoreService);
  private readonly uiStore = inject(UiStoreService);

  readonly panelOpen = this.uiStore.violationsPanelVisible;

  /** Sits at the canvas edge, or just left of the property panel while that is open. */
  readonly rightOffset = computed(() => {
    const panelWidth = this.uiStore.propertyPanelWidth();
    return panelWidth > 0 ? EDGE_MARGIN + panelWidth + PANEL_GAP : EDGE_MARGIN;
  });

  readonly buttonTitle = computed(() => {
    const n = this.violationService.violationCount();
    if (n === 0) return 'No issues';
    return `${n} issue${n !== 1 ? 's' : ''} found`;
  });

  togglePanel(): void {
    this.uiStore.toggleViolationsPanel();
  }

  navigateTo(violation: Violation): void {
    // Select the element
    this.selectionStore.select(violation.elementId);

    // Pan viewport to center on the element
    const el = this.netStore.findObject(violation.elementId);
    if (el && 'position' in el) {
      this.canvasStore.centerOnPoint(el.position);
    }

    this.panelOpen.set(false);
  }
}
