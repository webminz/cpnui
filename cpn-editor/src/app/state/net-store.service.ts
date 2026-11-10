import { computed, Injectable, signal } from '@angular/core';
import {
  Arc,
  CpnNet,
  NetElement,
  NetObject,
  Page,
  Place,
  Point,
  Size,
  Transition,
} from '../core/model';
import {
  ColourSet,
  createDefaultArc,
  createDefaultNet,
  createDefaultPlace,
  createDefaultTransition,
} from '../core/model';
import { generateId } from '../shared/id-generator.util';

@Injectable({ providedIn: 'root' })
export class NetStoreService {
  private readonly _net = signal<CpnNet>(createDefaultNet());
  private _historyHook: ((net: CpnNet) => void) | null = null;

  readonly net = this._net.asReadonly();

  readonly activePage = computed<Page>(() => this._net().pages[0]);

  readonly places = computed<Place[]>(() => this.activePage().places);
  readonly transitions = computed<Transition[]>(
    () => this.activePage().transitions
  );
  readonly arcs = computed<Arc[]>(() => this.activePage().arcs);

  readonly colourSets = computed<ColourSet[]>(() => this._net().colourSets);
  readonly declarations = computed<string>(() => this._net().declarations);

  addPlace(position: Point): Place {
    const hasUnit = this._net().colourSets.some((cs) => cs.name === 'UNIT');
    const place = createDefaultPlace(position, hasUnit ? 'UNIT' : null);
    this._update((page) => {
      page.places.push(place);
    });
    return place;
  }

  addTransition(position: Point): Transition {
    const transition = createDefaultTransition(position);
    this._update((page) => {
      page.transitions.push(transition);
    });
    return transition;
  }

  addArc(sourceId: string, targetId: string): Arc | null {
    const source = this.findElement(sourceId);
    const target = this.findElement(targetId);
    if (!source || !target) return null;
    if (source.kind === target.kind) return null;

    const arc = createDefaultArc(sourceId, targetId);
    this._update((page) => {
      page.arcs.push(arc);
    });
    return arc;
  }

  moveElement(id: string, position: Point): void {
    this._net.update(net => {
      const page = net.pages[0];
      const placeIdx = page.places.findIndex(p => p.id === id);
      if (placeIdx >= 0) {
        const newPlaces = [...page.places];
        newPlaces[placeIdx] = { ...newPlaces[placeIdx], position: { ...position } };
        return { ...net, pages: [{ ...page, places: newPlaces }] };
      }
      const transIdx = page.transitions.findIndex(t => t.id === id);
      if (transIdx >= 0) {
        const newTrans = [...page.transitions];
        newTrans[transIdx] = { ...newTrans[transIdx], position: { ...position } };
        return { ...net, pages: [{ ...page, transitions: newTrans }] };
      }
      return net;
    });
  }

  deleteElements(ids: Set<string>): void {
    this._update((page) => {
      page.places = page.places.filter((p) => !ids.has(p.id));
      page.transitions = page.transitions.filter((t) => !ids.has(t.id));
      page.arcs = page.arcs.filter(
        (a) =>
          !ids.has(a.id) && !ids.has(a.sourceId) && !ids.has(a.targetId)
      );
    });
  }

  findElement(id: string): NetElement | undefined {
    const page = this.activePage();
    return (
      page.places.find((p) => p.id === id) ??
      page.transitions.find((t) => t.id === id)
    );
  }

  findObject(id: string): NetObject | undefined {
    const page = this.activePage();
    return (
      page.places.find((p) => p.id === id) ??
      page.transitions.find((t) => t.id === id) ??
      page.arcs.find((a) => a.id === id)
    );
  }

  registerHistoryHook(hook: (net: CpnNet) => void): void {
    this._historyHook = hook;
  }

  loadNet(net: CpnNet): void {
    const snapshot = this._net();
    if (this._historyHook) this._historyHook(snapshot);
    this._net.set(structuredClone(net));
  }

  restoreNet(net: CpnNet): void {
    this._net.set(structuredClone(net));
  }

  updatePlace(
    id: string,
    changes: Partial<Pick<Place, 'name' | 'colourSetId' | 'initialMarking' | 'size' | 'graphics' | 'labelOffsets'>>
  ): void {
    this._update((page) => {
      const idx = page.places.findIndex((p) => p.id === id);
      if (idx >= 0) Object.assign(page.places[idx], changes);
    });
  }

  updateTransition(
    id: string,
    changes: Partial<Pick<Transition, 'name' | 'guard' | 'duration' | 'size' | 'graphics' | 'labelOffsets'>>
  ): void {
    this._update((page) => {
      const idx = page.transitions.findIndex((t) => t.id === id);
      if (idx >= 0) Object.assign(page.transitions[idx], changes);
    });
  }

  updateArc(
    id: string,
    changes: Partial<Pick<Arc, 'inscription' | 'bendPoints' | 'drawMode' | 'graphics' | 'labelOffsets'>>
  ): void {
    this._update((page) => {
      const idx = page.arcs.findIndex((a) => a.id === id);
      if (idx >= 0) Object.assign(page.arcs[idx], changes);
    });
  }

  insertBendPoint(arcId: string, segmentIndex: number, position: Point): void {
    this._update((page) => {
      const arc = page.arcs.find((a) => a.id === arcId);
      if (arc) {
        arc.bendPoints.splice(segmentIndex, 0, { ...position });
      }
    });
  }

  removeBendPoint(arcId: string, bendPointIndex: number): void {
    this._update((page) => {
      const arc = page.arcs.find((a) => a.id === arcId);
      if (arc && bendPointIndex >= 0 && bendPointIndex < arc.bendPoints.length) {
        arc.bendPoints.splice(bendPointIndex, 1);
      }
    });
  }

  moveBendPoint(arcId: string, bendPointIndex: number, position: Point): void {
    this._net.update((net) => {
      const page = net.pages[0];
      const arcIdx = page.arcs.findIndex((a) => a.id === arcId);
      if (arcIdx < 0) return net;
      const arc = page.arcs[arcIdx];
      if (bendPointIndex < 0 || bendPointIndex >= arc.bendPoints.length) return net;
      const newBendPoints = [...arc.bendPoints];
      newBendPoints[bendPointIndex] = { ...position };
      const newArcs = [...page.arcs];
      newArcs[arcIdx] = { ...arc, bendPoints: newBendPoints };
      return { ...net, pages: [{ ...page, arcs: newArcs }] };
    });
  }

  resizePlace(id: string, size: Size): void {
    const clampedSize = {
      width: Math.max(20, size.width),
      height: Math.max(20, size.height),
    };
    this._net.update((net) => {
      const page = net.pages[0];
      const idx = page.places.findIndex((p) => p.id === id);
      if (idx < 0) return net;
      const newPlaces = [...page.places];
      newPlaces[idx] = { ...newPlaces[idx], size: clampedSize };
      return { ...net, pages: [{ ...page, places: newPlaces }] };
    });
  }

  resizeTransition(id: string, size: Size): void {
    const clampedSize = {
      width: Math.max(20, size.width),
      height: Math.max(20, size.height),
    };
    this._net.update((net) => {
      const page = net.pages[0];
      const idx = page.transitions.findIndex((t) => t.id === id);
      if (idx < 0) return net;
      const newTrans = [...page.transitions];
      newTrans[idx] = { ...newTrans[idx], size: clampedSize };
      return { ...net, pages: [{ ...page, transitions: newTrans }] };
    });
  }

  moveElements(moves: Map<string, Point>): void {
    this._net.update((net) => {
      const page = net.pages[0];
      const newPlaces = page.places.map((p) => {
        const pos = moves.get(p.id);
        return pos ? { ...p, position: { ...pos } } : p;
      });
      const newTrans = page.transitions.map((t) => {
        const pos = moves.get(t.id);
        return pos ? { ...t, position: { ...pos } } : t;
      });
      return { ...net, pages: [{ ...page, places: newPlaces, transitions: newTrans }] };
    });
  }

  updateDeclarations(text: string): void {
    const snapshot = this._net();
    if (this._historyHook) this._historyHook(snapshot);
    const net = structuredClone(snapshot);
    net.declarations = text;
    this._net.set(net);
  }

  addColourSet(): ColourSet {
    const cs: ColourSet = { id: generateId(), name: '', declaration: '' };
    const snapshot = this._net();
    if (this._historyHook) this._historyHook(snapshot);
    const net = structuredClone(snapshot);
    net.colourSets.push(cs);
    this._net.set(net);
    return cs;
  }

  updateColourSet(id: string, changes: Partial<Pick<ColourSet, 'name' | 'declaration' | 'color'>>): void {
    const snapshot = this._net();
    if (this._historyHook) this._historyHook(snapshot);
    const net = structuredClone(snapshot);
    const idx = net.colourSets.findIndex((cs) => cs.id === id);
    if (idx >= 0) Object.assign(net.colourSets[idx], changes);
    this._net.set(net);
  }

  removeColourSet(id: string): void {
    const snapshot = this._net();
    if (this._historyHook) this._historyHook(snapshot);
    const net = structuredClone(snapshot);
    net.colourSets = net.colourSets.filter((cs) => cs.id !== id);
    this._net.set(net);
  }

  private _update(mutator: (page: Page) => void): void {
    const snapshot = this._net();
    if (this._historyHook) this._historyHook(snapshot);
    const net = structuredClone(snapshot);
    mutator(net.pages[0]);
    this._net.set(net);
  }
}
