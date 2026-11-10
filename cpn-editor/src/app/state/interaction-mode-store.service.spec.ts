import { TestBed } from '@angular/core/testing';
import { InteractionModeStoreService } from './interaction-mode-store.service';

describe('InteractionModeStoreService', () => {
  let service: InteractionModeStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InteractionModeStoreService);
  });

  it('should default to select mode', () => {
    expect(service.mode()).toBe('select');
    expect(service.arcCreation()).toBeNull();
  });

  describe('setMode', () => {
    it('should change mode', () => {
      service.setMode('place');
      expect(service.mode()).toBe('place');
    });

    it('should clear arc creation state when changing mode', () => {
      service.setMode('arc');
      service.startArcCreation('src-1');
      expect(service.arcCreation()).not.toBeNull();
      service.setMode('select');
      expect(service.arcCreation()).toBeNull();
    });
  });

  describe('arc creation', () => {
    it('should start arc creation with source id', () => {
      service.startArcCreation('source-123');
      expect(service.arcCreation()).toEqual({ sourceId: 'source-123' });
    });

    it('should cancel arc creation', () => {
      service.startArcCreation('source-123');
      service.cancelArcCreation();
      expect(service.arcCreation()).toBeNull();
    });
  });
});
