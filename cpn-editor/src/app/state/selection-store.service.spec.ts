import { TestBed } from '@angular/core/testing';
import { SelectionStoreService } from './selection-store.service';

describe('SelectionStoreService', () => {
  let service: SelectionStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SelectionStoreService);
  });

  describe('select', () => {
    it('should select a single element', () => {
      service.select('a');
      expect(service.isSelected('a')).toBe(true);
      expect(service.selectedCount()).toBe(1);
    });

    it('should replace previous selection', () => {
      service.select('a');
      service.select('b');
      expect(service.isSelected('a')).toBe(false);
      expect(service.isSelected('b')).toBe(true);
      expect(service.selectedCount()).toBe(1);
    });
  });

  describe('toggle', () => {
    it('should add unselected element', () => {
      service.select('a');
      service.toggle('b');
      expect(service.isSelected('a')).toBe(true);
      expect(service.isSelected('b')).toBe(true);
      expect(service.selectedCount()).toBe(2);
    });

    it('should remove already-selected element', () => {
      service.select('a');
      service.toggle('a');
      expect(service.isSelected('a')).toBe(false);
      expect(service.selectedCount()).toBe(0);
    });
  });

  describe('selectMultiple', () => {
    it('should replace entire selection', () => {
      service.select('a');
      service.selectMultiple(new Set(['b', 'c']));
      expect(service.isSelected('a')).toBe(false);
      expect(service.isSelected('b')).toBe(true);
      expect(service.isSelected('c')).toBe(true);
      expect(service.selectedCount()).toBe(2);
    });
  });

  describe('clear', () => {
    it('should empty the selection', () => {
      service.select('a');
      service.toggle('b');
      service.clear();
      expect(service.selectedCount()).toBe(0);
    });
  });

  describe('getSelectedIds', () => {
    it('should return a copy of the selected ids', () => {
      service.select('a');
      service.toggle('b');
      const ids = service.getSelectedIds();
      expect(ids.size).toBe(2);
      expect(ids.has('a')).toBe(true);
      expect(ids.has('b')).toBe(true);
      // Mutating the copy should not affect internal state
      ids.delete('a');
      expect(service.isSelected('a')).toBe(true);
    });
  });

  describe('focusField', () => {
    it('should default to null', () => {
      expect(service.focusField()).toBeNull();
    });

    it('should accept and clear a value', () => {
      service.focusField.set('inscription');
      expect(service.focusField()).toBe('inscription');
      service.focusField.set(null);
      expect(service.focusField()).toBeNull();
    });
  });
});
