import { Point } from './geometry';
import { Arc, ArcType, ColourSet, CpnNet, Page, Place, Transition } from './cpn-net';
import { generateId } from '../../shared/id-generator.util';

let placeCounter = 0;
let transitionCounter = 0;

export function createDefaultPlace(position: Point, defaultColourSet: string | null = 'UNIT'): Place {
  placeCounter++;
  return {
    kind: 'place',
    id: generateId(),
    name: `P${placeCounter}`,
    position: { ...position },
    size: { width: 50, height: 50 },
    colourSetId: defaultColourSet,
    initialMarking: { text: '' },
  };
}

export function createDefaultTransition(position: Point): Transition {
  transitionCounter++;
  return {
    kind: 'transition',
    id: generateId(),
    name: `T${transitionCounter}`,
    position: { ...position },
    size: { width: 60, height: 40 },
    guard: { text: '' },
    duration: { text: '' },
  };
}

export function createDefaultArc(
  sourceId: string,
  targetId: string,
  arcType: ArcType = 'normal'
): Arc {
  return {
    kind: 'arc',
    id: generateId(),
    sourceId,
    targetId,
    bendPoints: [],
    inscription: { text: '' },
    arcType,
    drawMode: 'straight',
  };
}

export function createDefaultPage(): Page {
  return {
    id: generateId(),
    name: 'Page 1',
    places: [],
    transitions: [],
    arcs: [],
  };
}

/** Swatch palette used for colour set colours (declarations panel + import). */
export const COLOUR_SET_PALETTE: readonly string[] = [
  '#3b82f6', '#8b5cf6', '#ef4444', '#22c55e', '#f59e0b',
  '#06b6d4', '#ec4899', '#6b7280', '#14b8a6', '#f97316',
  '#a855f7', '#64748b', '#84cc16', '#e11d48', '#0ea5e9',
];

export function createDefaultColourSets(): ColourSet[] {
  return [
    { id: generateId(), name: 'INT', declaration: 'colset INT = int;', color: '#3b82f6' },
    { id: generateId(), name: 'FLOAT', declaration: 'colset FLOAT = real;', color: '#8b5cf6' },
    { id: generateId(), name: 'STRING', declaration: 'colset STRING = string;', color: '#ef4444' },
    { id: generateId(), name: 'BOOL', declaration: 'colset BOOL = bool;', color: '#22c55e' },
    { id: generateId(), name: 'UNIT', declaration: 'colset UNIT = ();', color: '#6b7280' },
  ];
}

export function createDefaultNet(): CpnNet {
  return {
    id: generateId(),
    name: 'New CPN',
    colourSets: createDefaultColourSets(),
    declarations: '',
    pages: [createDefaultPage()],
  };
}
