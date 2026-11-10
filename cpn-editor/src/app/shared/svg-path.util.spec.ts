import {
  buildArcPath,
  buildStraightPath,
  buildRoundedPath,
  buildBezierPath,
  computeArcEndpoint,
  computeRectEdgePoint,
} from './svg-path.util';

describe('svg-path.util', () => {
  describe('buildArcPath', () => {
    it('should build direct path with no bend points', () => {
      const path = buildArcPath({ x: 0, y: 0 }, { x: 100, y: 100 }, []);
      expect(path).toBe('M 0 0 L 100 100');
    });

    it('should build path with bend points', () => {
      const path = buildArcPath(
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        [{ x: 50, y: 0 }, { x: 50, y: 100 }],
      );
      expect(path).toBe('M 0 0 L 50 0 L 50 100 L 100 100');
    });

    it('should default to straight mode', () => {
      const path = buildArcPath({ x: 0, y: 0 }, { x: 100, y: 0 }, [{ x: 50, y: 50 }]);
      expect(path).toContain('L');
      expect(path).not.toContain('Q');
    });

    it('should use rounded mode when specified', () => {
      const path = buildArcPath(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        [{ x: 50, y: 50 }],
        'rounded',
      );
      expect(path).toContain('Q');
    });

    it('should use bezier mode when specified', () => {
      const path = buildArcPath(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        [{ x: 50, y: 50 }],
        'bezier',
      );
      expect(path).toContain('Q');
    });
  });

  describe('buildStraightPath', () => {
    it('should return empty for less than 2 points', () => {
      expect(buildStraightPath([{ x: 0, y: 0 }])).toBe('');
    });

    it('should build M/L segments', () => {
      const path = buildStraightPath([
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 0 },
      ]);
      expect(path).toBe('M 0 0 L 50 50 L 100 0');
    });
  });

  describe('buildRoundedPath', () => {
    it('should fall back to straight for 2 points', () => {
      const path = buildRoundedPath([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
      expect(path).toBe('M 0 0 L 100 0');
    });

    it('should produce Q segments at bend points', () => {
      const path = buildRoundedPath([
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 0 },
      ]);
      expect(path).toContain('Q');
      expect(path).toMatch(/^M /);
    });

    it('should handle very close points gracefully', () => {
      const path = buildRoundedPath([
        { x: 0, y: 0 },
        { x: 0.1, y: 0.1 },
        { x: 100, y: 0 },
      ]);
      expect(path).toBeTruthy();
    });
  });

  describe('buildBezierPath', () => {
    it('should fall back to straight for 2 points', () => {
      const path = buildBezierPath([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
      expect(path).toBe('M 0 0 L 100 0');
    });

    it('should use Q for 1 bend point (3 total)', () => {
      const path = buildBezierPath([
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 0 },
      ]);
      expect(path).toBe('M 0 0 Q 50 50 100 0');
    });

    it('should use C for 2 bend points (4 total)', () => {
      const path = buildBezierPath([
        { x: 0, y: 0 },
        { x: 33, y: 50 },
        { x: 66, y: 50 },
        { x: 100, y: 0 },
      ]);
      expect(path).toBe('M 0 0 C 33 50 66 50 100 0');
    });

    it('should use Catmull-Rom spline for 3+ bend points', () => {
      const path = buildBezierPath([
        { x: 0, y: 0 },
        { x: 25, y: 50 },
        { x: 50, y: 0 },
        { x: 75, y: 50 },
        { x: 100, y: 0 },
      ]);
      expect(path).toContain('C');
      expect(path).toMatch(/^M /);
    });
  });

  describe('computeArcEndpoint', () => {
    it('should clip to circle perimeter from the left', () => {
      const pt = computeArcEndpoint({ x: 0, y: 50 }, { x: 50, y: 50 }, 10);
      expect(pt.x).toBeCloseTo(40, 5);
      expect(pt.y).toBeCloseTo(50, 5);
    });

    it('should clip to circle perimeter from below', () => {
      const pt = computeArcEndpoint({ x: 50, y: 100 }, { x: 50, y: 50 }, 10);
      expect(pt.x).toBeCloseTo(50, 5);
      expect(pt.y).toBeCloseTo(60, 5);
    });

    it('should clip diagonally', () => {
      const pt = computeArcEndpoint({ x: 0, y: 0 }, { x: 100, y: 100 }, 10);
      const dx = 100 - pt.x;
      const dy = 100 - pt.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      expect(dist).toBeCloseTo(10, 5);
    });

    it('should return target position when distance is zero', () => {
      const pt = computeArcEndpoint({ x: 50, y: 50 }, { x: 50, y: 50 }, 10);
      expect(pt).toEqual({ x: 50, y: 50 });
    });
  });

  describe('computeRectEdgePoint', () => {
    it('should compute edge point from the left (cardinal)', () => {
      const pt = computeRectEdgePoint({ x: 0, y: 50 }, { x: 50, y: 50 }, 60, 40);
      expect(pt.x).toBeCloseTo(20, 5);
      expect(pt.y).toBeCloseTo(50, 5);
    });

    it('should compute edge point from above (cardinal)', () => {
      const pt = computeRectEdgePoint({ x: 50, y: 0 }, { x: 50, y: 50 }, 60, 40);
      expect(pt.x).toBeCloseTo(50, 5);
      expect(pt.y).toBeCloseTo(30, 5);
    });

    it('should compute edge point from diagonal', () => {
      const pt = computeRectEdgePoint({ x: 0, y: 0 }, { x: 50, y: 50 }, 60, 40);
      // The ray hits the top edge (halfH=20 constrains first)
      expect(pt.y).toBeCloseTo(30, 5);
    });

    it('should return center when from equals center', () => {
      const pt = computeRectEdgePoint({ x: 50, y: 50 }, { x: 50, y: 50 }, 60, 40);
      expect(pt).toEqual({ x: 50, y: 50 });
    });
  });
});
