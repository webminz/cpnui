import { CpnNet, Rect } from '../core/model';
import { computeNetBounds } from './net-bounds.util';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** UI-only elements that must never appear in an export. */
const UI_ONLY_SELECTORS = [
  '.selection-ring',
  '.resize-handle',
  '.violation-badge',
  '.violation-badge-text',
  '.arc-preview-line',
  '.rubber-band',
  '.ghost-element',
  '.inline-edit-input',
  '.arc-hit-area',
  '.bend-point-knob',
  '.midpoint-knob',
  '.grid-line-sub',
  '.grid-line-minor',
  '.grid-line-major',
  'pattern',
  'title',
];

/**
 * Presentation properties that are supplied by (component-scoped) CSS in the
 * editor and therefore have to be inlined for a standalone SVG file.
 */
const INLINE_PROPS = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'font-size',
  'font-family',
  'font-weight',
  'font-style',
  'text-decoration',
  'text-anchor',
  'dominant-baseline',
  'letter-spacing',
  'white-space',
];

/** Attributes Angular adds for style encapsulation — noise in an exported file. */
function stripAngularAttributes(el: Element): void {
  for (const name of Array.from(el.getAttributeNames())) {
    if (name.startsWith('_ng') || name.startsWith('ng-')) el.removeAttribute(name);
  }
  for (const child of Array.from(el.children)) stripAngularAttributes(child);
}

/**
 * Walk the live SVG tree and its clone in parallel, copying the *computed*
 * style of each live element onto the clone as inline style. Computed styles
 * are only available for elements attached to the document, which is why the
 * clone cannot be styled on its own.
 *
 * Selection highlighting is neutralised on the fly: the `selected` class is
 * removed from the live element while its style is read and restored after.
 */
function inlineComputedStyles(live: Element, clone: Element): void {
  const wasSelected = live.classList.contains('selected');
  if (wasSelected) live.classList.remove('selected');

  try {
    const computed = getComputedStyle(live);
    for (const prop of INLINE_PROPS) {
      const val = computed.getPropertyValue(prop);
      if (val && val !== '' && val !== 'normal' && val !== 'auto') {
        (clone as HTMLElement | SVGElement).style.setProperty(prop, val);
      }
    }
  } finally {
    if (wasSelected) live.classList.add('selected');
  }

  clone.classList.remove('selected', 'label-draggable');

  const liveChildren = Array.from(live.children);
  const cloneChildren = Array.from(clone.children);
  const n = Math.min(liveChildren.length, cloneChildren.length);
  for (let i = 0; i < n; i++) {
    inlineComputedStyles(liveChildren[i], cloneChildren[i]);
  }
}

/**
 * Union of the rendered bounding boxes (world coordinates) of all element
 * renderers, which — unlike the model bounds — includes labels and arrowheads.
 * Falls back to model bounds when `getBBox` is unavailable (e.g. in jsdom).
 */
function computeRenderedBounds(svgEl: SVGSVGElement, net: CpnNet): Rect | null {
  const groups = svgEl.querySelectorAll<SVGGraphicsElement>(
    'g[cpn-place-renderer], g[cpn-transition-renderer], g[cpn-arc-renderer]',
  );
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let any = false;
  for (const g of Array.from(groups)) {
    if (typeof g.getBBox !== 'function') break;
    try {
      const b = g.getBBox();
      if (!isFinite(b.width) || !isFinite(b.height)) continue;
      if (b.width === 0 && b.height === 0) continue;
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
      any = true;
    } catch {
      break;
    }
  }
  if (any) return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  return computeNetBounds(net);
}

function backgroundColor(svgEl: SVGSVGElement): string {
  try {
    const bg = getComputedStyle(svgEl).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
  } catch {
    // ignore
  }
  return '#ffffff';
}

export interface PreparedSvg {
  svg: SVGSVGElement;
  /** Output size in CSS pixels (world size × zoom, so it matches the editor). */
  width: number;
  height: number;
}

/**
 * Build a standalone SVG document reproducing the net exactly as it is
 * currently rendered in the editor (colours, fonts, arrowheads, theme).
 *
 * @param zoom current editor zoom — decorations such as fonts and arrowheads
 *             are sized in screen pixels in the editor, so the export is scaled
 *             by the same zoom to look identical.
 */
export function prepareExportSvg(svgEl: SVGSVGElement, net: CpnNet, zoom = 1): PreparedSvg | null {
  const bounds = computeRenderedBounds(svgEl, net);
  if (!bounds) return null;

  const padding = 24 / zoom;
  const viewBox = {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  };

  const clone = svgEl.cloneNode(true) as SVGSVGElement;

  // 1. Inline computed styles while the clone still mirrors the live tree.
  inlineComputedStyles(svgEl, clone);

  // 2. Drop UI chrome.
  for (const sel of UI_ONLY_SELECTORS) {
    clone.querySelectorAll(sel).forEach((el) => el.remove());
  }
  clone.querySelectorAll('rect[fill^="url(#grid"]').forEach((el) => el.remove());
  clone.querySelectorAll('[marker-end="url(#arrowhead-selected)"]').forEach((el) => {
    el.setAttribute('marker-end', 'url(#arrowhead)');
  });
  clone.querySelector('#arrowhead-selected')?.remove();
  stripAngularAttributes(clone);

  // 3. Replace the pan/zoom transform with a viewBox covering the net.
  const transformGroup = clone.querySelector('g[transform]');
  transformGroup?.removeAttribute('transform');

  const width = Math.max(1, Math.round(viewBox.width * zoom));
  const height = Math.max(1, Math.round(viewBox.height * zoom));
  clone.setAttribute('xmlns', SVG_NS);
  clone.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.removeAttribute('style');
  clone.removeAttribute('class');

  // 4. Opaque background in the current theme colour.
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x', String(viewBox.x));
  bg.setAttribute('y', String(viewBox.y));
  bg.setAttribute('width', String(viewBox.width));
  bg.setAttribute('height', String(viewBox.height));
  bg.setAttribute('fill', backgroundColor(svgEl));
  const anchor = transformGroup ?? clone;
  anchor.insertBefore(bg, anchor.firstChild);

  return { svg: clone, width, height };
}

function serialize(svg: SVGSVGElement): string {
  return new XMLSerializer().serializeToString(svg);
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSvg(svgEl: SVGSVGElement, net: CpnNet, zoom = 1): void {
  const prepared = prepareExportSvg(svgEl, net, zoom);
  if (!prepared) return;
  const svgStr = serialize(prepared.svg);
  download(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }), `${net.name || 'cpn-net'}.svg`);
}

export function exportPng(svgEl: SVGSVGElement, net: CpnNet, zoom = 1): void {
  const prepared = prepareExportSvg(svgEl, net, zoom);
  if (!prepared) return;

  // Render at 2× for high-DPI output
  const scale = 2;
  const canvasWidth = prepared.width * scale;
  const canvasHeight = prepared.height * scale;
  prepared.svg.setAttribute('width', String(canvasWidth));
  prepared.svg.setAttribute('height', String(canvasHeight));

  const svgStr = serialize(prepared.svg);
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onerror = () => URL.revokeObjectURL(svgUrl);
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    URL.revokeObjectURL(svgUrl);

    canvas.toBlob((blob) => {
      if (blob) download(blob, `${net.name || 'cpn-net'}.png`);
    }, 'image/png');
  };
  img.src = svgUrl;
}
