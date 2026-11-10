import { describe, it, expect } from 'vitest';
import { createDefaultNet } from '../core/model';
import { exportSvg } from './export.util';

describe('Export utility', () => {
  function createMockSvg(): SVGSVGElement {
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.classList.add('canvas-svg');
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', 'translate(0,0) scale(1)');
    svgEl.appendChild(g);
    document.body.appendChild(svgEl);
    return svgEl;
  }

  it('should not crash on empty net', () => {
    const net = createDefaultNet();
    const svgEl = createMockSvg();
    // Empty net — exportSvg should be a no-op (no bounding box)
    exportSvg(svgEl, net);
    document.body.removeChild(svgEl);
  });

  it('should handle net with places', () => {
    const net = createDefaultNet();
    net.pages[0].places.push({
      kind: 'place',
      id: 'p1',
      name: 'P1',
      position: { x: 100, y: 200 },
      size: { width: 50, height: 50 },
      colourSetId: 'UNIT',
      initialMarking: { text: '' },
    });

    const svgEl = createMockSvg();
    // Should not throw
    exportSvg(svgEl, net);
    document.body.removeChild(svgEl);
  });

  it('should include transitions and arc bend points in bounding box', () => {
    const net = createDefaultNet();
    net.pages[0].places.push({
      kind: 'place',
      id: 'p1',
      name: 'P1',
      position: { x: 0, y: 0 },
      size: { width: 50, height: 50 },
      colourSetId: 'UNIT',
      initialMarking: { text: '' },
    });
    net.pages[0].transitions.push({
      kind: 'transition',
      id: 't1',
      name: 'T1',
      position: { x: 200, y: 200 },
      size: { width: 60, height: 40 },
      guard: { text: '' },
      duration: { text: '' },
    });
    net.pages[0].arcs.push({
      kind: 'arc',
      id: 'a1',
      sourceId: 'p1',
      targetId: 't1',
      bendPoints: [{ x: 300, y: 300 }],
      inscription: { text: 'x' },
      arcType: 'normal',
      drawMode: 'straight',
    });

    const svgEl = createMockSvg();
    // Should not throw even with complex net
    exportSvg(svgEl, net);
    document.body.removeChild(svgEl);
  });
});

import { prepareExportSvg } from './export.util';

describe('prepareExportSvg', () => {
  function createStyledSvg(): SVGSVGElement {
    const ns = 'http://www.w3.org/2000/svg';
    const style = document.createElement('style');
    style.textContent = '.place-shape { stroke: rgb(1, 2, 3); fill: rgb(4, 5, 6); } .arc-line { fill: none; stroke: rgb(7, 8, 9); }';
    document.head.appendChild(style);

    const svgEl = document.createElementNS(ns, 'svg');
    svgEl.classList.add('canvas-svg');
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', 'translate(10,20) scale(2)');
    const grid = document.createElementNS(ns, 'rect');
    grid.setAttribute('fill', 'url(#grid-major)');
    g.appendChild(grid);
    const shape = document.createElementNS(ns, 'ellipse');
    shape.classList.add('place-shape', 'selected');
    shape.setAttribute('_ngcontent-abc', '');
    g.appendChild(shape);
    const ring = document.createElementNS(ns, 'ellipse');
    ring.classList.add('selection-ring');
    g.appendChild(ring);
    const arc = document.createElementNS(ns, 'path');
    arc.classList.add('arc-line');
    arc.setAttribute('marker-end', 'url(#arrowhead-selected)');
    g.appendChild(arc);
    const hit = document.createElementNS(ns, 'path');
    hit.classList.add('arc-hit-area');
    g.appendChild(hit);
    svgEl.appendChild(g);
    document.body.appendChild(svgEl);
    return svgEl;
  }

  function netWithPlace() {
    const net = createDefaultNet();
    net.pages[0].places.push({
      kind: 'place',
      id: 'p1',
      name: 'P1',
      position: { x: 100, y: 200 },
      size: { width: 50, height: 50 },
      colourSetId: 'UNIT',
      initialMarking: { text: '' },
    });
    return net;
  }

  it('returns null for an empty net', () => {
    const svgEl = createStyledSvg();
    expect(prepareExportSvg(svgEl, createDefaultNet(), 1)).toBeNull();
    svgEl.remove();
  });

  it('inlines computed styles from the live DOM and strips UI chrome', () => {
    const svgEl = createStyledSvg();
    const prepared = prepareExportSvg(svgEl, netWithPlace(), 1)!;
    expect(prepared).not.toBeNull();
    const out = prepared.svg;

    const shape = out.querySelector<SVGElement>('.place-shape')!;
    expect(shape.style.stroke).toBe('rgb(1, 2, 3)');
    expect(shape.style.fill).toBe('rgb(4, 5, 6)');
    expect(shape.classList.contains('selected')).toBe(false);
    expect(shape.hasAttribute('_ngcontent-abc')).toBe(false);

    const arc = out.querySelector<SVGElement>('.arc-line')!;
    expect(arc.style.fill).toBe('none');
    expect(arc.style.stroke).toBe('rgb(7, 8, 9)');
    expect(arc.getAttribute('marker-end')).toBe('url(#arrowhead)');

    expect(out.querySelector('.selection-ring')).toBeNull();
    expect(out.querySelector('.arc-hit-area')).toBeNull();
    expect(out.querySelector('rect[fill^="url(#grid"]')).toBeNull();
    expect(out.querySelector('g')!.hasAttribute('transform')).toBe(false);

    // The live element keeps its selection state
    expect(svgEl.querySelector('.place-shape')!.classList.contains('selected')).toBe(true);
    svgEl.remove();
  });

  it('sizes the output by the bounding box and current zoom', () => {
    const svgEl = createStyledSvg();
    const prepared = prepareExportSvg(svgEl, netWithPlace(), 2)!;
    // bbox 75..125 × 175..225, padding 24/zoom = 12 → 74 × 74 world units
    expect(prepared.svg.getAttribute('viewBox')).toBe('63 163 74 74');
    expect(prepared.width).toBe(148);
    expect(prepared.height).toBe(148);
    expect(prepared.svg.getAttribute('width')).toBe('148');
    const bg = prepared.svg.querySelector('g > rect:first-child')!;
    expect(bg.getAttribute('fill')).toBeTruthy();
    svgEl.remove();
  });
});
