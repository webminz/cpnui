import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeclarationsPanelComponent } from './declarations-panel.component';
import { NetStoreService } from '../state/net-store.service';
import { UiStoreService } from '../state/ui-store.service';

describe('DeclarationsPanelComponent', () => {
  let fixture: ComponentFixture<DeclarationsPanelComponent>;
  let component: DeclarationsPanelComponent;
  let netStore: NetStoreService;
  let uiStore: UiStoreService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeclarationsPanelComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DeclarationsPanelComponent);
    component = fixture.componentInstance;
    netStore = TestBed.inject(NetStoreService);
    uiStore = TestBed.inject(UiStoreService);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be hidden by default', () => {
    expect(uiStore.declarationsPanelVisible()).toBe(false);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.decl-panel')).toBeNull();
  });

  it('should show when visible is set', async () => {
    uiStore.declarationsPanelVisible.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.decl-panel')).not.toBeNull();
  });

  it('should add a colour set', async () => {
    uiStore.declarationsPanelVisible.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const initialCount = netStore.colourSets().length;
    netStore.addColourSet();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(netStore.colourSets()).toHaveLength(initialCount + 1);
    expect(component.localColourSets()).toHaveLength(initialCount + 1);
  });

  it('should remove a colour set', async () => {
    const cs = netStore.addColourSet();
    const countAfterAdd = netStore.colourSets().length;
    fixture.detectChanges();
    await fixture.whenStable();
    netStore.removeColourSet(cs.id);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(netStore.colourSets()).toHaveLength(countAfterAdd - 1);
  });

  it('should commit declarations to store', () => {
    component.localDeclarations.set('val x = 5;');
    component.commitDeclarations();
    expect(netStore.declarations()).toBe('val x = 5;');
  });
});
