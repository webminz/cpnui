import { ArcDrawMode, Point } from '../core/model';
import { distance, lerpPoint } from './geometry.util';

export function buildArcPath(
  source: Point,
  target: Point,
  bendPoints: Point[],
  drawMode: ArcDrawMode = 'straight'
): string {
  const points = [source, ...bendPoints, target];
  switch (drawMode) {
    case 'rounded':
      return buildRoundedPath(points);
    case 'bezier':
      return buildBezierPath(points);
    default:
      return buildStraightPath(points);
  }
}

export function buildStraightPath(points: Point[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

export function buildRoundedPath(points: Point[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) return buildStraightPath(points);

  const cornerRadius = 12;
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const distPrev = distance(prev, curr);
    const distNext = distance(curr, next);
    const maxR = Math.min(distPrev, distNext) / 2;
    const r = Math.min(cornerRadius, maxR);

    if (r < 0.5) {
      d += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    const tPrev = r / distPrev;
    const tNext = r / distNext;
    const arcStart = lerpPoint(curr, prev, tPrev);
    const arcEnd = lerpPoint(curr, next, tNext);

    d += ` L ${arcStart.x} ${arcStart.y}`;
    d += ` Q ${curr.x} ${curr.y} ${arcEnd.x} ${arcEnd.y}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export function buildBezierPath(points: Point[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) return buildStraightPath(points);

  const bends = points.length - 2;

  if (bends === 1) {
    // Quadratic bezier through the single bend point
    const [start, ctrl, end] = points;
    return `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`;
  }

  if (bends === 2) {
    // Cubic bezier with the two bend points as control points
    const [start, c1, c2, end] = points;
    return `M ${start.x} ${start.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`;
  }

  // 3+ bend points: Catmull-Rom spline converted to cubic bezier segments
  return buildCatmullRomPath(points);
}

function buildCatmullRomPath(points: Point[]): string {
  // Add virtual control points at start/end by reflecting
  const extended: Point[] = [
    { x: 2 * points[0].x - points[1].x, y: 2 * points[0].y - points[1].y },
    ...points,
    {
      x: 2 * points[points.length - 1].x - points[points.length - 2].x,
      y: 2 * points[points.length - 1].y - points[points.length - 2].y,
    },
  ];

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < extended.length - 2; i++) {
    const p0 = extended[i - 1];
    const p1 = extended[i];
    const p2 = extended[i + 1];
    const p3 = extended[i + 2];

    // Catmull-Rom to cubic bezier control points
    const c1: Point = {
      x: p1.x + (p2.x - p0.x) / 6,
      y: p1.y + (p2.y - p0.y) / 6,
    };
    const c2: Point = {
      x: p2.x - (p3.x - p1.x) / 6,
      y: p2.y - (p3.y - p1.y) / 6,
    };

    d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
  }

  return d;
}

export function computeArcEndpoint(
  from: Point,
  to: Point,
  radius: number
): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { ...to };
  return {
    x: to.x - (dx / dist) * radius,
    y: to.y - (dy / dist) * radius,
  };
}

export function computeEllipseEdgePoint(
  from: Point,
  center: Point,
  width: number,
  height: number,
): Point {
  const dx = center.x - from.x;
  const dy = center.y - from.y;
  if (dx === 0 && dy === 0) return { ...center };
  const rx = width / 2;
  const ry = height / 2;
  // Parametric intersection of line with ellipse
  const denom = Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry));
  return {
    x: center.x - dx / denom,
    y: center.y - dy / denom,
  };
}

export function computeRectEdgePoint(
  from: Point,
  rectCenter: Point,
  width: number,
  height: number
): Point {
  const dx = rectCenter.x - from.x;
  const dy = rectCenter.y - from.y;
  if (dx === 0 && dy === 0) return { ...rectCenter };

  const halfW = width / 2;
  const halfH = height / 2;

  const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);

  return {
    x: rectCenter.x - dx * scale,
    y: rectCenter.y - dy * scale,
  };
}
