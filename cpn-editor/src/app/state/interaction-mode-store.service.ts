import { Injectable, signal } from '@angular/core';

export type ToolMode = 'select' | 'place' | 'transition' | 'arc' | 'pan';

export interface ArcCreationState {
  sourceId: string;
}

@Injectable({ providedIn: 'root' })
export class InteractionModeStoreService {
  private readonly _mode = signal<ToolMode>('select');
  private readonly _arcCreation = signal<ArcCreationState | null>(null);

  readonly mode = this._mode.asReadonly();
  readonly arcCreation = this._arcCreation.asReadonly();

  setMode(mode: ToolMode): void {
    this._mode.set(mode);
    this._arcCreation.set(null);
  }

  startArcCreation(sourceId: string): void {
    this._arcCreation.set({ sourceId });
  }

  cancelArcCreation(): void {
    this._arcCreation.set(null);
  }
}
