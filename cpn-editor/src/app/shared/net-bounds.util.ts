import { CpnNet, Rect } from '../core/model';

/**
 * Axis-aligned bounding box (world coordinates) of all places, transitions and
 * arc bend points on the first page. Returns null for an empty net.
 */
export function computeNetBounds(net: CpnNet): Rect | null {
  const page = net.pages[0];
  if (!page || (page.places.length === 0 && page.transitions.length === 0)) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const expand = (cx: number, cy: number, w: number, h: number): void => {
    minX = Math.min(minX, cx - w / 2);
    minY = Math.min(minY, cy - h / 2);
    maxX = Math.max(maxX, cx + w / 2);
    maxY = Math.max(maxY, cy + h / 2);
  };

  for (const place of page.places) {
    expand(place.position.x, place.position.y, place.size.width, place.size.height);
  }
  for (const trans of page.transitions) {
    expand(trans.position.x, trans.position.y, trans.size.width, trans.size.height);
  }
  for (const arc of page.arcs) {
    for (const bp of arc.bendPoints) {
      expand(bp.x, bp.y, 0, 0);
    }
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
