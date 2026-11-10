import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { UiStoreService } from './ui-store.service';

describe('UiStoreService', () => {
  let service: UiStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UiStoreService);
  });

  it('should start with declarations panel hidden', () => {
    expect(service.declarationsPanelVisible()).toBe(false);
  });

  it('should toggle declarations panel', () => {
    service.toggleDeclarationsPanel();
    expect(service.declarationsPanelVisible()).toBe(true);
    service.toggleDeclarationsPanel();
    expect(service.declarationsPanelVisible()).toBe(false);
  });

  it('should start with violations panel hidden', () => {
    expect(service.violationsPanelVisible()).toBe(false);
  });

  it('should toggle violations panel', () => {
    service.toggleViolationsPanel();
    expect(service.violationsPanelVisible()).toBe(true);
    service.toggleViolationsPanel();
    expect(service.violationsPanelVisible()).toBe(false);
  });

  it('should start with cheatsheet hidden', () => {
    expect(service.cheatsheetVisible()).toBe(false);
  });

  it('should allow setting cheatsheet visibility', () => {
    service.cheatsheetVisible.set(true);
    expect(service.cheatsheetVisible()).toBe(true);
    service.cheatsheetVisible.set(false);
    expect(service.cheatsheetVisible()).toBe(false);
  });
});
