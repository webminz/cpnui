import { TestBed } from '@angular/core/testing';
import { HistoryService } from './history.service';
import { NetStoreService } from './net-store.service';

describe('HistoryService', () => {
  let history: HistoryService;
  let netStore: NetStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    // Inject history first so the hook is registered
    history = TestBed.inject(HistoryService);
    netStore = TestBed.inject(NetStoreService);
  });

  describe('undo/redo cycle', () => {
    it('should undo adding a place', () => {
      expect(netStore.places()).toHaveLength(0);
      netStore.addPlace({ x: 0, y: 0 });
      expect(netStore.places()).toHaveLength(1);
      history.undo();
      expect(netStore.places()).toHaveLength(0);
    });

    it('should redo after undo', () => {
      netStore.addPlace({ x: 0, y: 0 });
      history.undo();
      expect(netStore.places()).toHaveLength(0);
      history.redo();
      expect(netStore.places()).toHaveLength(1);
    });

    it('should handle multiple undo steps', () => {
      netStore.addPlace({ x: 0, y: 0 });
      netStore.addPlace({ x: 10, y: 10 });
      expect(netStore.places()).toHaveLength(2);
      history.undo();
      expect(netStore.places()).toHaveLength(1);
      history.undo();
      expect(netStore.places()).toHaveLength(0);
    });
  });

  describe('canUndo/canRedo', () => {
    it('should reflect undo availability', () => {
      expect(history.canUndo()).toBe(false);
      netStore.addPlace({ x: 0, y: 0 });
      expect(history.canUndo()).toBe(true);
    });

    it('should reflect redo availability', () => {
      expect(history.canRedo()).toBe(false);
      netStore.addPlace({ x: 0, y: 0 });
      history.undo();
      expect(history.canRedo()).toBe(true);
    });

    it('should clear redo stack on new action', () => {
      netStore.addPlace({ x: 0, y: 0 });
      history.undo();
      expect(history.canRedo()).toBe(true);
      netStore.addTransition({ x: 0, y: 0 });
      expect(history.canRedo()).toBe(false);
    });
  });

  describe('batch coalescing', () => {
    it('should undo entire batch in one step', () => {
      netStore.addPlace({ x: 0, y: 0 });
      expect(netStore.places()).toHaveLength(1);

      history.beginBatch();
      netStore.addPlace({ x: 10, y: 10 });
      netStore.addPlace({ x: 20, y: 20 });
      netStore.addPlace({ x: 30, y: 30 });
      history.endBatch();

      expect(netStore.places()).toHaveLength(4);
      // Single undo should revert the entire batch
      history.undo();
      expect(netStore.places()).toHaveLength(1);
    });
  });

  describe('max history limit', () => {
    it('should drop oldest entries beyond 50', () => {
      for (let i = 0; i < 55; i++) {
        netStore.addPlace({ x: i, y: i });
      }
      // Should have at most 50 undo steps
      let undoCount = 0;
      while (history.canUndo()) {
        history.undo();
        undoCount++;
      }
      expect(undoCount).toBeLessThanOrEqual(50);
    });
  });
});
