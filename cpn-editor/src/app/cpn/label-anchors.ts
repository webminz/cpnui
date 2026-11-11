import { Arc, Page, Place, Point, Transition } from '../core/model';

/**
 * Default (un-moved) inscription positions in world coordinates, as the renderers place them at
 * zoom 1. `labelOffsets` are relative to these anchors; CPN Tools stores absolute label
 * positions. Export writes `anchor + offset`, import reads `posattr - anchor`, so moved labels
 * survive a round trip exactly. Keep in sync with the renderers' default label positions.
 */
const ANNOT_PAD_X = 6;
const ARC_LABEL_LIFT = 14;

export function placeLabelAnchors(p: Place): { colourSet: Point; marking: Point } {
  const rx = p.size.width / 2;
  const ry = p.size.height / 2;
  return {
    colourSet: { x: p.position.x + rx + ANNOT_PAD_X, y: p.position.y - ry },
    marking: { x: p.position.x + rx + ANNOT_PAD_X, y: p.position.y + ry },
  };
}

export function transitionLabelAnchors(t: Transition): { guard: Point; duration: Point } {
  const hw = t.size.width / 2;
  const hh = t.size.height / 2;
  return {
    guard: { x: t.position.x - hw - ANNOT_PAD_X, y: t.position.y - hh },
    duration: { x: t.position.x + hw + ANNOT_PAD_X, y: t.position.y + hh },
  };
}

/** Midpoint of the middle segment of the arc's polyline (node centres + bend points), lifted. */
export function arcInscriptionAnchor(a: Arc, page: Page): Point {
  const nodes = [...page.places, ...page.transitions];
  const source = nodes.find((n) => n.id === a.sourceId)?.position ?? { x: 0, y: 0 };
  const target = nodes.find((n) => n.id === a.targetId)?.position ?? { x: 0, y: 0 };
  const points = [source, ...a.bendPoints, target];
  const mid = Math.floor((points.length - 1) / 2);
  return {
    x: (points[mid].x + points[mid + 1].x) / 2,
    y: (points[mid].y + points[mid + 1].y) / 2 - ARC_LABEL_LIFT,
  };
}

export function addOffset(anchor: Point, offset: Point | undefined): Point {
  return offset ? { x: anchor.x + offset.x, y: anchor.y + offset.y } : anchor;
}

/** `pos - anchor`, rounded to the file's precision; undefined when the label is unmoved. */
export function offsetFrom(anchor: Point, pos: Point): Point | undefined {
  const round = (n: number) => Math.round(n * 1e6) / 1e6 || 0;
  const x = round(pos.x - anchor.x);
  const y = round(pos.y - anchor.y);
  return x === 0 && y === 0 ? undefined : { x, y };
}
