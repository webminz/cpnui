import { Point } from '../core/model';

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function snapToGrid(point: Point, gridSize: number): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

export function pointInCircle(
  point: Point,
  center: Point,
  radius: number
): boolean {
  return distance(point, center) <= radius;
}

export function lerpPoint(from: Point, toward: Point, t: number): Point {
  return {
    x: from.x + (toward.x - from.x) * t,
    y: from.y + (toward.y - from.y) * t,
  };
}

export function pointInRect(
  point: Point,
  rectCenter: Point,
  width: number,
  height: number
): boolean {
  return (
    Math.abs(point.x - rectCenter.x) <= width / 2 &&
    Math.abs(point.y - rectCenter.y) <= height / 2
  );
}
