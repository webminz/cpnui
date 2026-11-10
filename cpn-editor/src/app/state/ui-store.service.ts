import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiStoreService {
  readonly declarationsPanelVisible = signal(false);
  readonly violationsPanelVisible = signal(false);
  readonly cheatsheetVisible = signal(false);
  /** Current width of the (right-docked) property panel; 0 while it is hidden. */
  readonly propertyPanelWidth = signal(0);

  toggleDeclarationsPanel(): void {
    this.declarationsPanelVisible.update((v) => !v);
  }

  toggleViolationsPanel(): void {
    this.violationsPanelVisible.update((v) => !v);
  }
}
