import { TestBed } from '@angular/core/testing';
import { CanvasStoreService } from './canvas-store.service';

describe('CanvasStoreService', () => {
  let service: CanvasStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CanvasStoreService);
  });

  it('should have correct initial values', () => {
    expect(service.zoom()).toBe(1);
    expect(service.panOffset()).toEqual({ x: 0, y: 0 });
    expect(service.gridSize()).toBe(20);
    expect(service.snapToGrid()).toBe(true);
    expect(service.showGrid()).toBe(true);
    expect(service.darkMode()).toBe(false);
  });

  describe('inverseZoom', () => {
    it('should return 1/zoom at default zoom', () => {
      expect(service.inverseZoom()).toBe(1);
    });

    it('should return 1/zoom after zoom change', () => {
      service.setViewportSize(800, 600);
      service.zoomCenter(2);
      expect(service.inverseZoom()).toBeCloseTo(0.5, 5);
    });

    it('should return 1/zoom at min zoom', () => {
      service.zoomCenter(0.1);
      expect(service.inverseZoom()).toBeCloseTo(10, 5);
    });
  });

  describe('pan', () => {
    it('should add screen pixel deltas', () => {
      service.pan(10, 20);
      expect(service.panOffset()).toEqual({ x: 10, y: 20 });
      service.pan(-5, 3);
      expect(service.panOffset()).toEqual({ x: 5, y: 23 });
    });
  });

  describe('panWorld', () => {
    it('should multiply world units by zoom', () => {
      service.panWorld(100, 50);
      // zoom=1, so screen px = world * 1
      expect(service.panOffset()).toEqual({ x: 100, y: 50 });
    });
  });

  describe('zoomCenter', () => {
    it('should change zoom level', () => {
      service.setViewportSize(800, 600);
      service.zoomCenter(1.5);
      expect(service.zoom()).toBeCloseTo(1.5, 5);
    });

    it('should clamp zoom to min 0.1', () => {
      service.zoomCenter(0.05);
      expect(service.zoom()).toBeCloseTo(0.1, 5);
    });

    it('should clamp zoom to max 50', () => {
      service.zoomCenter(10);
      expect(service.zoom()).toBeCloseTo(10, 5);
      service.zoomCenter(10);
      expect(service.zoom()).toBeCloseTo(50, 0);
    });

    it('should adjust pan to keep viewport center stable', () => {
      service.setViewportSize(800, 600);
      const centerBefore = service.viewportCenter();
      service.zoomCenter(2);
      const centerAfter = service.viewportCenter();
      expect(centerAfter.x).toBeCloseTo(centerBefore.x, 0);
      expect(centerAfter.y).toBeCloseTo(centerBefore.y, 0);
    });
  });

  describe('toggle methods', () => {
    it('should toggle grid visibility', () => {
      expect(service.showGrid()).toBe(true);
      service.toggleGrid();
      expect(service.showGrid()).toBe(false);
      service.toggleGrid();
      expect(service.showGrid()).toBe(true);
    });

    it('should toggle snap to grid', () => {
      expect(service.snapToGrid()).toBe(true);
      service.toggleSnapToGrid();
      expect(service.snapToGrid()).toBe(false);
    });

    it('should toggle dark mode', () => {
      expect(service.darkMode()).toBe(false);
      service.toggleTheme();
      expect(service.darkMode()).toBe(true);
    });
  });

  describe('canvasTransform', () => {
    it('should return correct transform string', () => {
      expect(service.canvasTransform()).toBe('translate(0,0) scale(1)');
    });

    it('should reflect pan and zoom changes', () => {
      service.pan(50, 100);
      service.zoomCenter(2);
      const transform = service.canvasTransform();
      expect(transform).toContain('translate(');
      expect(transform).toContain('scale(');
    });
  });

  describe('viewportCenter', () => {
    it('should compute center in world coordinates', () => {
      service.setViewportSize(800, 600);
      // zoom=1, pan=(0,0) → center = (400, 300)
      const center = service.viewportCenter();
      expect(center).toEqual({ x: 400, y: 300 });
    });

    it('should account for pan offset', () => {
      service.setViewportSize(800, 600);
      service.pan(100, 50);
      const center = service.viewportCenter();
      expect(center).toEqual({ x: 300, y: 250 });
    });
  });
});

describe('CanvasStoreService — view fitting', () => {
  let service: CanvasStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CanvasStoreService);
    service.setViewportSize(1000, 800);
  });

  it('resetView restores 100% zoom with the origin centred', () => {
    service.zoomCenter(3);
    service.pan(123, 456);
    service.resetView();
    expect(service.zoom()).toBe(1);
    expect(service.viewportCenter()).toEqual({ x: 0, y: 0 });
  });

  it('fitToBounds centres a large net and zooms out to fit it', () => {
    service.fitToBounds({ x: 0, y: 0, width: 4000, height: 1000 }, 40);
    // limited by width: (1000 - 80) / 4000
    expect(service.zoom()).toBeCloseTo(920 / 4000, 5);
    expect(service.viewportCenter()).toEqual({ x: 2000, y: 500 });
  });

  it('fitToBounds does not zoom beyond maxZoom for small nets', () => {
    service.fitToBounds({ x: -100, y: -50, width: 200, height: 100 }, 40, 1);
    expect(service.zoom()).toBe(1);
    expect(service.viewportCenter()).toEqual({ x: 0, y: 0 });
  });

  it('fitToBounds never goes below the minimum zoom', () => {
    service.fitToBounds({ x: 0, y: 0, width: 1e6, height: 1e6 });
    expect(service.zoom()).toBeCloseTo(0.1, 5);
  });
});
