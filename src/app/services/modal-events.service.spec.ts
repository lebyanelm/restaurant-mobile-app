import { TestBed } from '@angular/core/testing';

import { ModalEventsService } from './modal-events.service';

describe('ModalEventsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ModalEventsService = TestBed.get(ModalEventsService);
    expect(service).toBeTruthy();
  });
});
