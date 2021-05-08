import { TestBed } from '@angular/core/testing';

import { BasketOverviewService } from './basket-overview.service';

describe('BasketOverviewService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BasketOverviewService = TestBed.get(BasketOverviewService);
    expect(service).toBeTruthy();
  });
});
