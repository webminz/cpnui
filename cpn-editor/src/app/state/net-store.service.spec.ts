import { TestBed } from '@angular/core/testing';
import { NetStoreService } from './net-store.service';

describe('NetStoreService', () => {
  let service: NetStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NetStoreService);
  });

  describe('addPlace', () => {
    it('should create a place with correct fields', () => {
      const place = service.addPlace({ x: 100, y: 200 });
      expect(place.kind).toBe('place');
      expect(place.position).toEqual({ x: 100, y: 200 });
      expect(place.name).toMatch(/^P\d+$/);
      expect(place.id).toBeTruthy();
      expect(place.size).toEqual({ width: 50, height: 50 });
      expect(service.places()).toHaveLength(1);
    });

    it('should auto-increment names', () => {
      const p1 = service.addPlace({ x: 0, y: 0 });
      const p2 = service.addPlace({ x: 10, y: 10 });
      const n1 = parseInt(p1.name.slice(1));
      const n2 = parseInt(p2.name.slice(1));
      expect(n2).toBe(n1 + 1);
    });
  });

  describe('addTransition', () => {
    it('should create a transition with correct fields', () => {
      const trans = service.addTransition({ x: 50, y: 60 });
      expect(trans.kind).toBe('transition');
      expect(trans.position).toEqual({ x: 50, y: 60 });
      expect(trans.name).toMatch(/^T\d+$/);
      expect(trans.size).toEqual({ width: 60, height: 40 });
      expect(service.transitions()).toHaveLength(1);
    });
  });

  describe('addArc', () => {
    it('should create arc between place and transition', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      const trans = service.addTransition({ x: 100, y: 0 });
      const arc = service.addArc(place.id, trans.id);
      expect(arc).not.toBeNull();
      expect(arc!.kind).toBe('arc');
      expect(arc!.sourceId).toBe(place.id);
      expect(arc!.targetId).toBe(trans.id);
      expect(service.arcs()).toHaveLength(1);
    });

    it('should reject arc between same kinds', () => {
      const p1 = service.addPlace({ x: 0, y: 0 });
      const p2 = service.addPlace({ x: 100, y: 0 });
      const arc = service.addArc(p1.id, p2.id);
      expect(arc).toBeNull();
      expect(service.arcs()).toHaveLength(0);
    });

    it('should return null for missing elements', () => {
      const arc = service.addArc('nonexistent', 'also-nonexistent');
      expect(arc).toBeNull();
    });
  });

  describe('moveElement', () => {
    it('should update place position', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      service.moveElement(place.id, { x: 50, y: 50 });
      expect(service.places()[0].position).toEqual({ x: 50, y: 50 });
    });

    it('should update transition position', () => {
      const trans = service.addTransition({ x: 0, y: 0 });
      service.moveElement(trans.id, { x: 75, y: 25 });
      expect(service.transitions()[0].position).toEqual({ x: 75, y: 25 });
    });
  });

  describe('moveElements', () => {
    it('should move multiple elements at once', () => {
      const p = service.addPlace({ x: 0, y: 0 });
      const t = service.addTransition({ x: 100, y: 100 });
      service.moveElements(
        new Map([
          [p.id, { x: 10, y: 10 }],
          [t.id, { x: 110, y: 110 }],
        ]),
      );
      expect(service.places()[0].position).toEqual({ x: 10, y: 10 });
      expect(service.transitions()[0].position).toEqual({ x: 110, y: 110 });
    });
  });

  describe('deleteElements', () => {
    it('should delete place and cascade arcs', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      const trans = service.addTransition({ x: 100, y: 0 });
      service.addArc(place.id, trans.id);
      expect(service.arcs()).toHaveLength(1);
      service.deleteElements(new Set([place.id]));
      expect(service.places()).toHaveLength(0);
      expect(service.arcs()).toHaveLength(0);
      expect(service.transitions()).toHaveLength(1);
    });

    it('should delete arc directly', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      const trans = service.addTransition({ x: 100, y: 0 });
      const arc = service.addArc(place.id, trans.id)!;
      service.deleteElements(new Set([arc.id]));
      expect(service.arcs()).toHaveLength(0);
      expect(service.places()).toHaveLength(1);
    });
  });

  describe('updatePlace', () => {
    it('should apply partial updates', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      service.updatePlace(place.id, { name: 'MyPlace' });
      expect(service.places()[0].name).toBe('MyPlace');
    });
  });

  describe('updateTransition', () => {
    it('should apply partial updates', () => {
      const trans = service.addTransition({ x: 0, y: 0 });
      service.updateTransition(trans.id, { name: 'MyTrans', guard: { text: '[x > 0]' } });
      expect(service.transitions()[0].name).toBe('MyTrans');
      expect(service.transitions()[0].guard.text).toBe('[x > 0]');
    });
  });

  describe('updateArc', () => {
    it('should apply partial updates', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      const trans = service.addTransition({ x: 100, y: 0 });
      const arc = service.addArc(place.id, trans.id)!;
      service.updateArc(arc.id, { inscription: { text: '1`x' } });
      expect(service.arcs()[0].inscription.text).toBe('1`x');
    });
  });

  describe('findElement', () => {
    it('should find a place by id', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      expect(service.findElement(place.id)).toBeDefined();
      expect(service.findElement(place.id)!.kind).toBe('place');
    });

    it('should find a transition by id', () => {
      const trans = service.addTransition({ x: 0, y: 0 });
      expect(service.findElement(trans.id)).toBeDefined();
    });

    it('should return undefined for unknown id', () => {
      expect(service.findElement('unknown')).toBeUndefined();
    });
  });

  describe('findObject', () => {
    it('should find an arc by id', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      const trans = service.addTransition({ x: 100, y: 0 });
      const arc = service.addArc(place.id, trans.id)!;
      expect(service.findObject(arc.id)).toBeDefined();
      expect(service.findObject(arc.id)!.kind).toBe('arc');
    });

    it('should return undefined for unknown id', () => {
      expect(service.findObject('unknown')).toBeUndefined();
    });
  });

  describe('restoreNet', () => {
    it('should replace entire state', () => {
      service.addPlace({ x: 0, y: 0 });
      expect(service.places()).toHaveLength(1);
      const snapshot = structuredClone(service.net());
      service.addPlace({ x: 50, y: 50 });
      expect(service.places()).toHaveLength(2);
      service.restoreNet(snapshot);
      expect(service.places()).toHaveLength(1);
    });
  });

  describe('insertBendPoint', () => {
    it('should insert a bend point at the given segment index', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      const trans = service.addTransition({ x: 100, y: 0 });
      const arc = service.addArc(place.id, trans.id)!;
      service.insertBendPoint(arc.id, 0, { x: 50, y: 50 });
      expect(service.arcs()[0].bendPoints).toEqual([{ x: 50, y: 50 }]);
    });

    it('should insert between existing bend points', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      const trans = service.addTransition({ x: 100, y: 0 });
      const arc = service.addArc(place.id, trans.id)!;
      service.insertBendPoint(arc.id, 0, { x: 25, y: 25 });
      service.insertBendPoint(arc.id, 1, { x: 75, y: 25 });
      service.insertBendPoint(arc.id, 1, { x: 50, y: 50 });
      expect(service.arcs()[0].bendPoints).toEqual([
        { x: 25, y: 25 },
        { x: 50, y: 50 },
        { x: 75, y: 25 },
      ]);
    });
  });

  describe('removeBendPoint', () => {
    it('should remove a bend point at the given index', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      const trans = service.addTransition({ x: 100, y: 0 });
      const arc = service.addArc(place.id, trans.id)!;
      service.insertBendPoint(arc.id, 0, { x: 50, y: 50 });
      service.removeBendPoint(arc.id, 0);
      expect(service.arcs()[0].bendPoints).toEqual([]);
    });

    it('should not crash for out-of-range index', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      const trans = service.addTransition({ x: 100, y: 0 });
      const arc = service.addArc(place.id, trans.id)!;
      service.removeBendPoint(arc.id, 5);
      expect(service.arcs()[0].bendPoints).toEqual([]);
    });
  });

  describe('moveBendPoint', () => {
    it('should move a bend point without triggering history', () => {
      const snapshots: unknown[] = [];
      service.registerHistoryHook((net) => snapshots.push(net));
      const place = service.addPlace({ x: 0, y: 0 });
      const trans = service.addTransition({ x: 100, y: 0 });
      const arc = service.addArc(place.id, trans.id)!;
      service.insertBendPoint(arc.id, 0, { x: 50, y: 50 });
      snapshots.length = 0;
      service.moveBendPoint(arc.id, 0, { x: 60, y: 60 });
      expect(service.arcs()[0].bendPoints[0]).toEqual({ x: 60, y: 60 });
      expect(snapshots.length).toBe(0);
    });
  });

  describe('resizePlace', () => {
    it('should update the place size', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      service.resizePlace(place.id, { width: 80, height: 60 });
      expect(service.places()[0].size).toEqual({ width: 80, height: 60 });
    });

    it('should enforce minimum size of 20x20', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      service.resizePlace(place.id, { width: 10, height: 5 });
      expect(service.places()[0].size).toEqual({ width: 20, height: 20 });
    });

    it('should not trigger history hook', () => {
      const snapshots: unknown[] = [];
      service.registerHistoryHook((net) => snapshots.push(net));
      const place = service.addPlace({ x: 0, y: 0 });
      snapshots.length = 0;
      service.resizePlace(place.id, { width: 80, height: 60 });
      expect(snapshots.length).toBe(0);
    });
  });

  describe('resizeTransition', () => {
    it('should update the transition size', () => {
      const trans = service.addTransition({ x: 0, y: 0 });
      service.resizeTransition(trans.id, { width: 80, height: 50 });
      expect(service.transitions()[0].size).toEqual({ width: 80, height: 50 });
    });

    it('should enforce minimum size of 20x20', () => {
      const trans = service.addTransition({ x: 0, y: 0 });
      service.resizeTransition(trans.id, { width: 10, height: 5 });
      expect(service.transitions()[0].size).toEqual({ width: 20, height: 20 });
    });

    it('should not trigger history hook', () => {
      const snapshots: unknown[] = [];
      service.registerHistoryHook((net) => snapshots.push(net));
      const trans = service.addTransition({ x: 0, y: 0 });
      snapshots.length = 0;
      service.resizeTransition(trans.id, { width: 80, height: 50 });
      expect(snapshots.length).toBe(0);
    });
  });

  describe('updatePlace with size and graphics', () => {
    it('should accept size in changes', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      service.updatePlace(place.id, { size: { width: 80, height: 60 } });
      expect(service.places()[0].size).toEqual({ width: 80, height: 60 });
    });

    it('should accept graphics in changes', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      service.updatePlace(place.id, { graphics: { strokeColor: '#ff0000' } });
      expect(service.places()[0].graphics?.strokeColor).toBe('#ff0000');
    });
  });

  describe('updateArc with drawMode and graphics', () => {
    it('should accept drawMode in changes', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      const trans = service.addTransition({ x: 100, y: 0 });
      const arc = service.addArc(place.id, trans.id)!;
      service.updateArc(arc.id, { drawMode: 'bezier' });
      expect(service.arcs()[0].drawMode).toBe('bezier');
    });

    it('should accept graphics in changes', () => {
      const place = service.addPlace({ x: 0, y: 0 });
      const trans = service.addTransition({ x: 100, y: 0 });
      const arc = service.addArc(place.id, trans.id)!;
      service.updateArc(arc.id, { graphics: { strokeColor: '#00ff00', strokeWidth: 3 } });
      expect(service.arcs()[0].graphics?.strokeColor).toBe('#00ff00');
      expect(service.arcs()[0].graphics?.strokeWidth).toBe(3);
    });
  });

  describe('updateDeclarations', () => {
    it('should update the declarations text', () => {
      service.updateDeclarations('val x = 5;');
      expect(service.declarations()).toBe('val x = 5;');
    });

    it('should fire history hook', () => {
      const snapshots: unknown[] = [];
      service.registerHistoryHook((net) => snapshots.push(net));
      service.updateDeclarations('val x = 5;');
      expect(snapshots.length).toBe(1);
    });
  });

  describe('addColourSet', () => {
    it('should add a colour set with id', () => {
      const initialCount = service.colourSets().length;
      const cs = service.addColourSet();
      expect(cs.id).toBeTruthy();
      expect(cs.name).toBe('');
      expect(cs.declaration).toBe('');
      expect(service.colourSets()).toHaveLength(initialCount + 1);
    });

    it('should fire history hook', () => {
      const snapshots: unknown[] = [];
      service.registerHistoryHook((net) => snapshots.push(net));
      service.addColourSet();
      expect(snapshots.length).toBe(1);
    });
  });

  describe('updateColourSet', () => {
    it('should update colour set fields', () => {
      const cs = service.addColourSet();
      service.updateColourSet(cs.id, { name: 'MYINT', declaration: 'colset MYINT = int;' });
      const updated = service.colourSets().find((c) => c.id === cs.id)!;
      expect(updated.name).toBe('MYINT');
      expect(updated.declaration).toBe('colset MYINT = int;');
    });

    it('should apply partial updates', () => {
      const cs = service.addColourSet();
      service.updateColourSet(cs.id, { name: 'BOOL' });
      const updated = service.colourSets().find((c) => c.id === cs.id)!;
      expect(updated.name).toBe('BOOL');
      expect(updated.declaration).toBe('');
    });
  });

  describe('removeColourSet', () => {
    it('should remove a colour set by id', () => {
      const cs = service.addColourSet();
      const countBefore = service.colourSets().length;
      service.removeColourSet(cs.id);
      expect(service.colourSets()).toHaveLength(countBefore - 1);
    });

    it('should fire history hook', () => {
      const cs = service.addColourSet();
      const snapshots: unknown[] = [];
      service.registerHistoryHook((net) => snapshots.push(net));
      service.removeColourSet(cs.id);
      expect(snapshots.length).toBe(1);
    });
  });

  describe('history hook', () => {
    it('should fire on _update calls', () => {
      const snapshots: unknown[] = [];
      service.registerHistoryHook((net) => snapshots.push(net));
      service.addPlace({ x: 0, y: 0 });
      expect(snapshots.length).toBe(1);
    });

    it('should not fire on moveElement', () => {
      const snapshots: unknown[] = [];
      service.registerHistoryHook((net) => snapshots.push(net));
      const place = service.addPlace({ x: 0, y: 0 });
      snapshots.length = 0; // reset
      service.moveElement(place.id, { x: 10, y: 10 });
      expect(snapshots.length).toBe(0);
    });

    it('should not fire on restoreNet', () => {
      const snapshots: unknown[] = [];
      service.registerHistoryHook((net) => snapshots.push(net));
      const snapshot = structuredClone(service.net());
      snapshots.length = 0;
      service.restoreNet(snapshot);
      expect(snapshots.length).toBe(0);
    });
  });
});
