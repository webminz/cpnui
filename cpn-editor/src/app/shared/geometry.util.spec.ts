import { distance, midpoint, snapToGrid, pointInCircle, pointInRect, lerpPoint } from './geometry.util';

describe('geometry.util', () => {
  describe('distance', () => {
    it('should compute distance between two points', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });

    it('should return 0 for the same point', () => {
      expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
    });

    it('should handle negative coordinates', () => {
      expect(distance({ x: -3, y: -4 }, { x: 0, y: 0 })).toBe(5);
    });
  });

  describe('midpoint', () => {
    it('should compute midpoint of two points', () => {
      const m = midpoint({ x: 0, y: 0 }, { x: 10, y: 20 });
      expect(m).toEqual({ x: 5, y: 10 });
    });

    it('should return the same point when both are identical', () => {
      const m = midpoint({ x: 7, y: 3 }, { x: 7, y: 3 });
      expect(m).toEqual({ x: 7, y: 3 });
    });
  });

  describe('snapToGrid', () => {
    it('should snap to exact grid point', () => {
      expect(snapToGrid({ x: 20, y: 40 }, 20)).toEqual({ x: 20, y: 40 });
    });

    it('should snap between grid points', () => {
      expect(snapToGrid({ x: 13, y: 27 }, 20)).toEqual({ x: 20, y: 20 });
    });

    it('should handle negative coordinates', () => {
      expect(snapToGrid({ x: -13, y: -27 }, 20)).toEqual({ x: -20, y: -20 });
    });
  });

  describe('pointInCircle', () => {
    it('should return true for point inside', () => {
      expect(pointInCircle({ x: 1, y: 1 }, { x: 0, y: 0 }, 5)).toBe(true);
    });

    it('should return true for point on boundary', () => {
      expect(pointInCircle({ x: 5, y: 0 }, { x: 0, y: 0 }, 5)).toBe(true);
    });

    it('should return false for point outside', () => {
      expect(pointInCircle({ x: 6, y: 0 }, { x: 0, y: 0 }, 5)).toBe(false);
    });
  });

  describe('lerpPoint', () => {
    it('should return from point at t=0', () => {
      const result = lerpPoint({ x: 0, y: 0 }, { x: 100, y: 100 }, 0);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('should return toward point at t=1', () => {
      const result = lerpPoint({ x: 0, y: 0 }, { x: 100, y: 100 }, 1);
      expect(result).toEqual({ x: 100, y: 100 });
    });

    it('should return midpoint at t=0.5', () => {
      const result = lerpPoint({ x: 0, y: 0 }, { x: 100, y: 200 }, 0.5);
      expect(result).toEqual({ x: 50, y: 100 });
    });

    it('should handle negative coordinates', () => {
      const result = lerpPoint({ x: -10, y: -20 }, { x: 10, y: 20 }, 0.5);
      expect(result).toEqual({ x: 0, y: 0 });
    });
  });

  describe('pointInRect', () => {
    it('should return true for point inside', () => {
      expect(pointInRect({ x: 52, y: 52 }, { x: 50, y: 50 }, 20, 20)).toBe(true);
    });

    it('should return true for point on edge', () => {
      expect(pointInRect({ x: 60, y: 50 }, { x: 50, y: 50 }, 20, 20)).toBe(true);
    });

    it('should return false for point outside', () => {
      expect(pointInRect({ x: 100, y: 100 }, { x: 50, y: 50 }, 20, 20)).toBe(false);
    });
  });
});
