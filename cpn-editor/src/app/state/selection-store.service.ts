import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SelectionStoreService {
  private readonly _selectedIds = signal<Set<string>>(new Set());

  readonly selectedIds = computed(() => this._selectedIds());
  readonly selectedCount = computed(() => this._selectedIds().size);

  /** Set by canvas to request that the property panel focus a specific field. */
  readonly focusField = signal<string | null>(null);

  isSelected(id: string): boolean {
    return this._selectedIds().has(id);
  }

  select(id: string): void {
    this._selectedIds.set(new Set([id]));
  }

  toggle(id: string): void {
    const current = new Set(this._selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this._selectedIds.set(current);
  }

  selectMultiple(ids: Set<string>): void {
    this._selectedIds.set(new Set(ids));
  }

  clear(): void {
    this._selectedIds.set(new Set());
  }

  getSelectedIds(): Set<string> {
    return new Set(this._selectedIds());
  }
}
