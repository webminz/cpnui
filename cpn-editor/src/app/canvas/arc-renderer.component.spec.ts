import { TestBed } from '@angular/core/testing';
import { ArcRendererComponent } from './arc-renderer.component';
import { Arc } from '../core/model';
import { NetStoreService } from '../state/net-store.service';
import { ComponentRef } from '@angular/core';

function makeArc(inscription: string): Arc {
  return {
    kind: 'arc',
    id: 'a1',
    sourceId: 'p1',
    targetId: 't1',
    bendPoints: [],
    inscription: { text: inscription },
    arcType: 'normal',
    drawMode: 'straight',
  };
}

describe('ArcRendererComponent', () => {
  let componentRef: ComponentRef<ArcRendererComponent>;
  let component: ArcRendererComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArcRendererComponent],
      providers: [
        {
          provide: NetStoreService,
          useValue: {
            findElement: () => null,
            arcs: () => [],
            places: () => [],
            transitions: () => [],
          },
        },
      ],
    }).compileComponents();

    // Create component programmatically to avoid SVG namespace issues
    const fixture = TestBed.createComponent(ArcRendererComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    componentRef.setInput('arc', makeArc(''));
    fixture.detectChanges();
  });

  describe('inscriptionLabel', () => {
    it('should return null for empty inscription', () => {
      componentRef.setInput('arc', makeArc(''));
      expect(component.inscriptionLabel()).toBeNull();
    });

    it('should pass through short inscription', () => {
      componentRef.setInput('arc', makeArc('1`x'));
      expect(component.inscriptionLabel()).toBe('1`x');
    });

    it('should truncate inscription longer than 25 chars', () => {
      const long = 'abcdefghijklmnopqrstuvwxyz1234';
      componentRef.setInput('arc', makeArc(long));
      expect(component.inscriptionLabel()).toBe('abcdefghijklmnopqrstuvwxy\u2026');
    });

    it('should not truncate inscription of exactly 25 chars', () => {
      const exact = 'abcdefghijklmnopqrstuvwxy';
      componentRef.setInput('arc', makeArc(exact));
      expect(component.inscriptionLabel()).toBe(exact);
    });
  });
});
