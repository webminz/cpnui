import {
  Arc,
  ArcType,
  ColourSet,
  CpnNet,
  ElementGraphics,
  Page,
  Place,
  Point,
  Transition,
} from '../core/model';
import { COLOUR_SET_PALETTE } from '../core/model/factory';

function text(el: Element, selector: string): string {
  const node = el.querySelector(selector);
  return node?.textContent?.trim() ?? '';
}

/** Text of the element's own text nodes only (ignores child elements such as <layout>). */
function ownText(el: Element): string {
  let out = '';
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE) {
      out += child.textContent ?? '';
    }
  }
  return out.trim();
}

function attr(el: Element, name: string): string {
  return el.getAttribute(name) ?? '';
}

function numAttr(el: Element, name: string, fallback = 0): number {
  const v = el.getAttribute(name);
  return v ? parseFloat(v) : fallback;
}

const CSS_COLOR_TO_HEX: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  yellow: '#ffff00',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  gray: '#808080',
  grey: '#808080',
  orange: '#ffa500',
  purple: '#800080',
  brown: '#a52a2a',
  pink: '#ffc0cb',
  // Additional named colours used by CPN Tools
  navy: '#000080',
  teal: '#008080',
  maroon: '#800000',
  olive: '#808000',
  lime: '#00ff00',
  aqua: '#00ffff',
  fuchsia: '#ff00ff',
  silver: '#c0c0c0',
};

function normalizeColor(color: string): string {
  if (!color) return color;
  // Already hex
  if (color.startsWith('#')) return color;
  // Named color → hex
  const hex = CSS_COLOR_TO_HEX[color.toLowerCase()];
  return hex ?? color;
}

/**
 * CPN Tools writes `Black` line/text colour and `White` fill for every element by
 * default. Those are treated as "not set" so the editor's themed defaults apply
 * (and dark mode keeps working). Any other colour is an explicit choice.
 */
function isDefaultColor(colour: string, defaultName: string): boolean {
  return colour.trim().toLowerCase() === defaultName;
}

function parseGraphics(el: Element): ElementGraphics | undefined {
  const line = el.querySelector(':scope > lineattr');
  const fill = el.querySelector(':scope > fillattr');
  const txt = el.querySelector(':scope > textattr');
  if (!line && !fill && !txt) return undefined;

  const g: ElementGraphics = {};
  if (line) {
    const colour = attr(line, 'colour');
    if (colour && !isDefaultColor(colour, 'black')) g.strokeColor = normalizeColor(colour);
    const thick = numAttr(line, 'thick', 1);
    if (thick) g.strokeWidth = thick;
  }
  if (fill) {
    const colour = attr(fill, 'colour');
    const filled = attr(fill, 'filled') === 'true';
    if (colour && (filled || !isDefaultColor(colour, 'white'))) {
      g.fillColor = normalizeColor(colour);
    }
  }
  if (txt) {
    const colour = attr(txt, 'colour');
    if (colour && !isDefaultColor(colour, 'black')) g.fontColor = normalizeColor(colour);
    if (attr(txt, 'bold') === 'true') g.fontBold = true;
  }
  return Object.keys(g).length > 0 ? g : undefined;
}

function parsePosition(el: Element): Point {
  const pos = el.querySelector(':scope > posattr');
  if (!pos) return { x: 0, y: 0 };
  return {
    x: numAttr(pos, 'x'),
    y: -numAttr(pos, 'y'), // negate Y: CPN Tools uses Y-up, SVG uses Y-down
  };
}

function parsePlace(el: Element): Place {
  const ellipse = el.querySelector(':scope > ellipse');
  const w = ellipse ? numAttr(ellipse, 'w', 50) : 50;
  const h = ellipse ? numAttr(ellipse, 'h', 50) : 50;

  return {
    kind: 'place',
    id: attr(el, 'id'),
    name: text(el, ':scope > text'),
    position: parsePosition(el),
    size: { width: w, height: h },
    colourSetId: text(el, ':scope > type > text') || null,
    initialMarking: { text: text(el, ':scope > initmark > text') },
    graphics: parseGraphics(el),
  };
}

function parseTransition(el: Element): Transition {
  const box = el.querySelector(':scope > box');
  const w = box ? numAttr(box, 'w', 60) : 60;
  const h = box ? numAttr(box, 'h', 40) : 40;

  return {
    kind: 'transition',
    id: attr(el, 'id'),
    name: text(el, ':scope > text'),
    position: parsePosition(el),
    size: { width: w, height: h },
    guard: { text: text(el, ':scope > cond > text') },
    duration: { text: text(el, ':scope > time > text') },
    graphics: parseGraphics(el),
  };
}

function parseArc(el: Element): Arc {
  const orientation = attr(el, 'orientation');
  const transendRef = el.querySelector(':scope > transend')?.getAttribute('idref') ?? '';
  const placeendRef = el.querySelector(':scope > placeend')?.getAttribute('idref') ?? '';

  let sourceId: string;
  let targetId: string;
  if (orientation === 'TtoP') {
    sourceId = transendRef;
    targetId = placeendRef;
  } else {
    // PtoT, bothdir, nodir — place is source
    sourceId = placeendRef;
    targetId = transendRef;
  }

  // Parse bend points sorted by serial attribute
  const bpElements = Array.from(el.querySelectorAll(':scope > bendpoint'));
  bpElements.sort((a, b) => numAttr(a, 'serial') - numAttr(b, 'serial'));
  const bendPoints: Point[] = bpElements.map((bp) => parsePosition(bp));

  return {
    kind: 'arc',
    id: attr(el, 'id'),
    sourceId,
    targetId,
    bendPoints,
    inscription: { text: text(el, ':scope > annot > text') },
    arcType: 'normal' as ArcType,
    drawMode: 'straight',
    graphics: parseGraphics(el),
  };
}

// ---------------------------------------------------------------------------
// Colour set declarations
// ---------------------------------------------------------------------------

/** Direct child elements matching a tag name. */
function children(el: Element, tag: string): Element[] {
  return Array.from(el.children).filter((c) => c.tagName === tag);
}

function childText(el: Element, tag: string): string[] {
  return children(el, tag).map((c) => c.textContent?.trim() ?? '');
}

/** "with lo..hi" clause used by int/real/intinf/string/list */
function rangeClause(typeEl: Element, keyword = 'with'): string {
  const w = children(typeEl, keyword)[0];
  if (!w) return '';
  const parts = childText(w, 'ml');
  if (parts.length >= 2) return ` ${keyword} ${parts[0]}..${parts[1]}`;
  if (parts.length === 1) return ` ${keyword} ${parts[0]}`;
  return '';
}

/**
 * Reconstruct the SML body of a `colset` declaration from the structured
 * CPN Tools XML (used for files written by older CPN Tools versions that do
 * not carry a `<layout>` element).
 */
function colourSetBody(colorEl: Element): string {
  for (const child of Array.from(colorEl.children)) {
    switch (child.tagName) {
      case 'unit': {
        const w = children(child, 'with')[0];
        const val = w ? childText(w, 'ml')[0] : '';
        return val ? `unit with ${val}` : 'unit';
      }
      case 'bool': {
        const w = children(child, 'with')[0];
        if (w) {
          const vals = childText(w, 'ml');
          if (vals.length >= 2) return `bool with (${vals[0]}, ${vals[1]})`;
        }
        return 'bool';
      }
      case 'int':
        return `int${rangeClause(child)}`;
      case 'intinf':
        return `intinf${rangeClause(child)}`;
      case 'real':
        return `real${rangeClause(child)}`;
      case 'time':
        return 'time';
      case 'string':
        return `string${rangeClause(child)}${rangeClause(child, 'and')}`;
      case 'enum':
        return `with ${childText(child, 'id').join(' | ')}`;
      case 'index': {
        const name = childText(child, 'id')[0] ?? '';
        const vals = childText(child, 'ml');
        return `index ${name} with ${vals[0] ?? ''}..${vals[1] ?? ''}`;
      }
      case 'product':
        return `product ${childText(child, 'id').join(' * ')}`;
      case 'record': {
        const fields = children(child, 'recordfield').map((f) => {
          const [name, type] = childText(f, 'id');
          return `${name}:${type}`;
        });
        return `record ${fields.join(' * ')}`;
      }
      case 'list': {
        const elem = childText(child, 'id')[0] ?? '';
        return `list ${elem}${rangeClause(child)}`;
      }
      case 'union': {
        const fields = children(child, 'unionfield').map((f) => {
          const [ctor, type] = childText(f, 'id');
          return type ? `${ctor}:${type}` : ctor;
        });
        return `union ${fields.join(' + ')}`;
      }
      case 'subset': {
        const base = childText(child, 'id')[0] ?? '';
        const by = children(child, 'by')[0];
        if (by) return `subset ${base} by ${childText(by, 'ml')[0] ?? ''}`;
        const w = children(child, 'with')[0];
        if (w) return `subset ${base} with [${childText(w, 'ml').join(', ')}]`;
        return `subset ${base}`;
      }
      case 'alias':
        return childText(child, 'id')[0] ?? '';
      case 'funsubst': {
        const base = childText(child, 'id')[0] ?? '';
        return base;
      }
      default:
        break;
    }
  }
  return '';
}

/** Read the editor-specific colour hint stored as an XML comment inside <color>. */
function parseColourHint(colorEl: Element): string | undefined {
  for (const node of Array.from(colorEl.childNodes)) {
    if (node.nodeType === Node.COMMENT_NODE) {
      const m = (node.textContent ?? '').match(/cpn-editor:colour=(#[0-9a-fA-F]{3,8})/);
      if (m) return m[1];
    }
  }
  return undefined;
}

function parseColourSets(globbox: Element): ColourSet[] {
  const colours: ColourSet[] = [];
  const colorEls = Array.from(globbox.querySelectorAll('color'));
  colorEls.forEach((c, index) => {
    const name = text(c, ':scope > id');
    let declaration = text(c, ':scope > layout');
    if (!declaration) {
      const body = colourSetBody(c);
      const timed = children(c, 'timed').length > 0 ? ' timed' : '';
      declaration = body ? `colset ${name} = ${body}${timed};` : '';
    }
    colours.push({
      id: attr(c, 'id') || crypto.randomUUID(),
      name,
      declaration,
      color: parseColourHint(c) ?? COLOUR_SET_PALETTE[index % COLOUR_SET_PALETTE.length],
    });
  });
  return colours;
}

/** Is this element nested inside a <color> declaration (e.g. the <ml> of a range)? */
function insideColor(el: Element, globbox: Element): boolean {
  let cur = el.parentElement;
  while (cur && cur !== globbox) {
    if (cur.tagName === 'color') return true;
    cur = cur.parentElement;
  }
  return false;
}

/**
 * Collect variable, value/function (ml), globref and use declarations in
 * document order. Colour sets are handled separately (see parseColourSets).
 * Block names are emitted as SML comments to keep the structure readable.
 */
function parseDeclarations(globbox: Element): string {
  const parts: string[] = [];

  const visit = (container: Element): void => {
    for (const el of Array.from(container.children)) {
      switch (el.tagName) {
        case 'block': {
          const blockName = text(el, ':scope > id');
          const before = parts.length;
          visit(el);
          if (blockName && parts.length > before) {
            parts.splice(before, 0, `(* ${blockName} *)`);
          }
          break;
        }
        case 'var': {
          const layout = text(el, ':scope > layout');
          if (layout) {
            parts.push(layout);
          } else {
            const type = text(el, ':scope > type > id');
            const names = childText(el, 'id');
            if (names.length > 0 && type) parts.push(`var ${names.join(', ')} : ${type};`);
          }
          break;
        }
        case 'ml': {
          if (insideColor(el, globbox)) break;
          const layout = text(el, ':scope > layout') || ownText(el);
          if (layout) parts.push(layout);
          break;
        }
        case 'globref': {
          const layout = text(el, ':scope > layout');
          if (layout) {
            parts.push(layout);
          } else {
            const name = text(el, ':scope > id');
            const value = text(el, ':scope > ml');
            if (name) parts.push(`globref ${name} = ${value};`);
          }
          break;
        }
        case 'use': {
          const layout = text(el, ':scope > layout');
          if (layout) {
            parts.push(layout);
          } else {
            const file = ownText(el) || text(el, ':scope > ml');
            if (file) parts.push(`use "${file}";`);
          }
          break;
        }
        default:
          break;
      }
    }
  };

  visit(globbox);
  return parts.join('\n');
}

function parsePage(pageEl: Element): Page {
  const places = Array.from(pageEl.querySelectorAll(':scope > place')).map(parsePlace);
  const transitions = Array.from(pageEl.querySelectorAll(':scope > trans')).map(parseTransition);
  const arcs = Array.from(pageEl.querySelectorAll(':scope > arc')).map(parseArc);

  return {
    id: attr(pageEl, 'id'),
    name: pageEl.querySelector(':scope > pageattr')?.getAttribute('name') ?? 'Page 1',
    places,
    transitions,
    arcs,
  };
}

export function parseCpnXml(xml: string): CpnNet {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  const cpnet = doc.querySelector('cpnet');
  if (!cpnet) throw new Error('Invalid CPN XML: no <cpnet> element found');

  const globbox = cpnet.querySelector(':scope > globbox');
  const colourSets = globbox ? parseColourSets(globbox) : [];
  const declarations = globbox ? parseDeclarations(globbox) : '';

  const pageEls = cpnet.querySelectorAll(':scope > page');
  const pages = Array.from(pageEls).map(parsePage);

  return {
    id: attr(cpnet, 'id') || crypto.randomUUID(),
    name: pages[0]?.name ?? 'Imported CPN',
    colourSets,
    declarations,
    pages: pages.length > 0 ? pages : [{ id: crypto.randomUUID(), name: 'Page 1', places: [], transitions: [], arcs: [] }],
  };
}

// ---------------------------------------------------------------------------
// Scale normalisation for legacy nets
// ---------------------------------------------------------------------------

/** Height CPN Tools 4 gives a freshly created place — the editor's reference scale. */
const REFERENCE_PLACE_HEIGHT = 40;
/** Places smaller than this are assumed to come from a net laid out at a tiny scale. */
const TINY_PLACE_HEIGHT = 20;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Determine a uniform scale factor that brings a legacy net (older CPN Tools
 * files store shapes only a few units large) up to the editor's native scale.
 * Returns 1 when no scaling is needed.
 */
export function computeNormalizationScale(net: CpnNet): number {
  const heights = net.pages.flatMap((p) => p.places.map((pl) => pl.size.height)).filter((h) => h > 0);
  if (heights.length === 0) return 1;
  const m = median(heights);
  if (m >= TINY_PLACE_HEIGHT) return 1;
  return REFERENCE_PLACE_HEIGHT / m;
}

/** Scale all positions and sizes of the net by a uniform factor. Returns a new net. */
export function scaleNet(net: CpnNet, factor: number): CpnNet {
  if (factor === 1) return net;
  const s = (p: Point): Point => ({ x: p.x * factor, y: p.y * factor });
  return {
    ...net,
    pages: net.pages.map((page) => ({
      ...page,
      places: page.places.map((p) => ({
        ...p,
        position: s(p.position),
        size: { width: p.size.width * factor, height: p.size.height * factor },
      })),
      transitions: page.transitions.map((t) => ({
        ...t,
        position: s(t.position),
        size: { width: t.size.width * factor, height: t.size.height * factor },
      })),
      arcs: page.arcs.map((a) => ({
        ...a,
        bendPoints: a.bendPoints.map(s),
      })),
    })),
  };
}

/** Apply computeNormalizationScale + scaleNet. */
export function normalizeNetScale(net: CpnNet): CpnNet {
  return scaleNet(net, computeNormalizationScale(net));
}
