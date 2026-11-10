import { TestBed } from '@angular/core/testing';
import { ViolationService } from './violation.service';
import { NetStoreService } from './net-store.service';
import { CpnNet, ColourSet, Place, Transition, Arc, Page } from '../core/model';
import { generateId } from '../shared/id-generator.util';

function makeNet(overrides: Partial<CpnNet> = {}): CpnNet {
  return {
    id: generateId(),
    name: 'Test',
    colourSets: [
      { id: 'cs1', name: 'INT', declaration: 'colset INT = int;', color: '#3b82f6' },
      { id: 'cs2', name: 'STRING', declaration: 'colset STRING = string;', color: '#ef4444' },
      { id: 'cs3', name: 'UNIT', declaration: 'colset UNIT = ();', color: '#6b7280' },
      { id: 'cs4', name: 'PAIR', declaration: 'colset PAIR = product INT * STRING;' },
    ],
    declarations: 'var x : INT;\nvar s : STRING;',
    pages: [{
      id: generateId(),
      name: 'Page 1',
      places: [],
      transitions: [],
      arcs: [],
    }],
    ...overrides,
  };
}

function makePlace(overrides: Partial<Place> = {}): Place {
  return {
    kind: 'place',
    id: generateId(),
    name: 'P1',
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
    colourSetId: 'INT',
    initialMarking: { text: '' },
    ...overrides,
  };
}

function makeTransition(overrides: Partial<Transition> = {}): Transition {
  return {
    kind: 'transition',
    id: generateId(),
    name: 'T1',
    position: { x: 100, y: 0 },
    size: { width: 60, height: 40 },
    guard: { text: '' },
    duration: { text: '' },
    ...overrides,
  };
}

function makeArc(sourceId: string, targetId: string, overrides: Partial<Arc> = {}): Arc {
  return {
    kind: 'arc',
    id: generateId(),
    sourceId,
    targetId,
    bendPoints: [],
    inscription: { text: '' },
    arcType: 'normal',
    drawMode: 'straight',
    ...overrides,
  };
}

describe('ViolationService', () => {
  let service: ViolationService;
  let netStore: NetStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViolationService);
    netStore = TestBed.inject(NetStoreService);
  });

  it('should report no violations for a valid net with no elements', () => {
    netStore.loadNet(makeNet());
    expect(service.violations()).toEqual([]);
  });

  describe('place colour set violations', () => {
    it('should report error when place has no colour set', () => {
      const place = makePlace({ colourSetId: null });
      netStore.loadNet(makeNet({
        pages: [{ id: 'p', name: 'Page 1', places: [place], transitions: [], arcs: [] }],
      }));
      const violations = service.violations();
      expect(violations.length).toBe(1);
      expect(violations[0].severity).toBe('error');
      expect(violations[0].message).toContain('no colour set');
    });

    it('should report error when place references undefined colour set', () => {
      const place = makePlace({ colourSetId: 'NONEXISTENT' });
      netStore.loadNet(makeNet({
        pages: [{ id: 'p', name: 'Page 1', places: [place], transitions: [], arcs: [] }],
      }));
      const violations = service.violations();
      expect(violations.length).toBe(1);
      expect(violations[0].severity).toBe('error');
      expect(violations[0].message).toContain('undefined colour set');
    });

    it('should not report error when place has valid colour set', () => {
      const place = makePlace({ colourSetId: 'INT' });
      netStore.loadNet(makeNet({
        pages: [{ id: 'p', name: 'Page 1', places: [place], transitions: [], arcs: [] }],
      }));
      const violations = service.violations();
      expect(violations.length).toBe(0);
    });
  });

  describe('initial marking violations', () => {
    it('should warn when marking references undefined name', () => {
      const place = makePlace({ colourSetId: 'INT', initialMarking: { text: 'undefined_var' } });
      netStore.loadNet(makeNet({
        pages: [{ id: 'p', name: 'Page 1', places: [place], transitions: [], arcs: [] }],
      }));
      const violations = service.violations();
      expect(violations.some((v) => v.message.includes('undefined name'))).toBe(true);
    });

    it('should not warn when marking uses declared variable', () => {
      const place = makePlace({ colourSetId: 'INT', initialMarking: { text: 'x' } });
      netStore.loadNet(makeNet({
        pages: [{ id: 'p', name: 'Page 1', places: [place], transitions: [], arcs: [] }],
      }));
      const violations = service.violations();
      expect(violations.filter((v) => v.message.includes('undefined name')).length).toBe(0);
    });
  });

  describe('guard violations', () => {
    it('should warn when guard references undefined name', () => {
      const trans = makeTransition({ guard: { text: 'unknownFunc x' } });
      netStore.loadNet(makeNet({
        pages: [{ id: 'p', name: 'Page 1', places: [], transitions: [trans], arcs: [] }],
      }));
      const violations = service.violations();
      expect(violations.some((v) => v.message.includes('undefined name "unknownFunc"'))).toBe(true);
    });
  });

  describe('arc violations', () => {
    it('should warn when arc has no inscription', () => {
      const place = makePlace({ id: 'p1', colourSetId: 'INT' });
      const trans = makeTransition({ id: 't1' });
      const arc = makeArc('p1', 't1', { inscription: { text: '' } });
      netStore.loadNet(makeNet({
        pages: [{ id: 'p', name: 'Page 1', places: [place], transitions: [trans], arcs: [arc] }],
      }));
      const violations = service.violations();
      expect(violations.some((v) => v.message.includes('no inscription'))).toBe(true);
    });

    it('should warn when inscription references undefined name', () => {
      const place = makePlace({ id: 'p1', colourSetId: 'INT' });
      const trans = makeTransition({ id: 't1' });
      const arc = makeArc('p1', 't1', { inscription: { text: 'unknown_var' } });
      netStore.loadNet(makeNet({
        pages: [{ id: 'p', name: 'Page 1', places: [place], transitions: [trans], arcs: [arc] }],
      }));
      const violations = service.violations();
      expect(violations.some((v) => v.message.includes('undefined name'))).toBe(true);
    });

    it('should detect type mismatch on simple variable', () => {
      const place = makePlace({ id: 'p1', colourSetId: 'INT' });
      const trans = makeTransition({ id: 't1' });
      const arc = makeArc('p1', 't1', { inscription: { text: 's' } });
      netStore.loadNet(makeNet({
        pages: [{ id: 'p', name: 'Page 1', places: [place], transitions: [trans], arcs: [arc] }],
      }));
      const violations = service.violations();
      expect(violations.some((v) => v.severity === 'error' && v.message.includes('Type mismatch'))).toBe(true);
    });

    it('should not report type mismatch for matching variable', () => {
      const place = makePlace({ id: 'p1', colourSetId: 'INT' });
      const trans = makeTransition({ id: 't1' });
      const arc = makeArc('p1', 't1', { inscription: { text: 'x' } });
      netStore.loadNet(makeNet({
        pages: [{ id: 'p', name: 'Page 1', places: [place], transitions: [trans], arcs: [arc] }],
      }));
      const violations = service.violations();
      expect(violations.some((v) => v.message.includes('Type mismatch'))).toBe(false);
    });

    it('should not report a mismatch for a timed product with untimed components', () => {
      // Mirrors samples/TimedProtocol.cpn: DATA is untimed, INTxDATA is timed.
      const net = makeNet({
        colourSets: [
          { id: 'cs1', name: 'INT', declaration: 'colset INT = int timed;' },
          { id: 'cs2', name: 'DATA', declaration: 'colset DATA = string;' },
          { id: 'cs3', name: 'INTxDATA', declaration: 'colset INTxDATA = product INT * DATA timed;' },
        ],
        declarations: 'var n : INT;\nvar p : DATA;',
      });
      const place = makePlace({ colourSetId: 'INTxDATA' });
      const trans = makeTransition();
      const arc = makeArc(place.id, trans.id, { inscription: { text: '(n,p)' } });
      net.pages[0].places.push(place);
      net.pages[0].transitions.push(trans);
      net.pages[0].arcs.push(arc);
      netStore.loadNet(net);
      expect(service.violations().filter((v) => v.severity === 'error')).toEqual([]);
    });

    it('should re-evaluate arc types when a colour set declaration changes', () => {
      const net = makeNet({
        colourSets: [
          { id: 'cs1', name: 'INT', declaration: 'colset INT = int;' },
          { id: 'cs2', name: 'DATA', declaration: 'colset DATA = string;' },
          { id: 'cs3', name: 'PAIR', declaration: 'colset PAIR = product INT * INT;' },
        ],
        declarations: 'var n : INT;\nvar p : DATA;',
      });
      const place = makePlace({ colourSetId: 'PAIR' });
      const trans = makeTransition();
      const arc = makeArc(place.id, trans.id, { inscription: { text: '(n,p)' } });
      net.pages[0].places.push(place);
      net.pages[0].transitions.push(trans);
      net.pages[0].arcs.push(arc);
      netStore.loadNet(net);
      expect(service.violations().some((v) => v.message.includes('position 2'))).toBe(true);

      netStore.updateColourSet('cs3', { declaration: 'colset PAIR = product INT * DATA timed;' });
      expect(service.violations().some((v) => v.message.includes('position 2'))).toBe(false);
    });

    it('should detect destructuring component count mismatch', () => {
      const place = makePlace({ id: 'p1', colourSetId: 'PAIR' });
      const trans = makeTransition({ id: 't1' });
      const arc = makeArc('p1', 't1', { inscription: { text: '(a, b, c)' } });
      netStore.loadNet(makeNet({
        pages: [{ id: 'p', name: 'Page 1', places: [place], transitions: [trans], arcs: [arc] }],
      }));
      const violations = service.violations();
      expect(violations.some((v) => v.severity === 'error' && v.message.includes('3 components'))).toBe(true);
    });
  });

  describe('violatingElementIds', () => {
    it('should return set of element IDs with violations', () => {
      const place = makePlace({ id: 'p1', colourSetId: null });
      netStore.loadNet(makeNet({
        pages: [{ id: 'p', name: 'Page 1', places: [place], transitions: [], arcs: [] }],
      }));
      expect(service.violatingElementIds().has('p1')).toBe(true);
    });
  });
});
