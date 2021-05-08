import { TestBed } from '@angular/core/testing';

import { BrowserPageService } from './browser-page.service';

describe('BrowserPageService', () => {
  let service: BrowserPageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BrowserPageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
