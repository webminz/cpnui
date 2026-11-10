import { computed, inject, Injectable, signal } from '@angular/core';
import { CpnNet } from '../core/model';
import { NetStoreService } from './net-store.service';

const MAX_HISTORY = 50;

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly netStore = inject(NetStoreService);

  private readonly _undoStack = signal<CpnNet[]>([]);
  private readonly _redoStack = signal<CpnNet[]>([]);
  private _batching = false;

  readonly canUndo = computed(() => this._undoStack().length > 0);
  readonly canRedo = computed(() => this._redoStack().length > 0);

  constructor() {
    this.netStore.registerHistoryHook((snapshot) => this.pushSnapshot(snapshot));
  }

  undo(): void {
    const stack = this._undoStack();
    if (stack.length === 0) return;
    const current = structuredClone(this.netStore.net());
    const prev = stack[stack.length - 1];
    this._undoStack.set(stack.slice(0, -1));
    this._redoStack.update((r) => [...r, current]);
    this.netStore.restoreNet(prev);
  }

  redo(): void {
    const stack = this._redoStack();
    if (stack.length === 0) return;
    const current = structuredClone(this.netStore.net());
    const next = stack[stack.length - 1];
    this._redoStack.set(stack.slice(0, -1));
    this._undoStack.update((u) => [...u, current]);
    this.netStore.restoreNet(next);
  }

  beginBatch(): void {
    if (!this._batching) {
      // Capture the state before the batch begins, then enable batching
      this.pushSnapshot(structuredClone(this.netStore.net()));
      this._batching = true;
    }
  }

  endBatch(): void {
    this._batching = false;
  }

  private pushSnapshot(snapshot: CpnNet): void {
    if (this._batching) return;
    this._undoStack.update((stack) => {
      const next = [...stack, snapshot];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    this._redoStack.set([]);
  }
}
