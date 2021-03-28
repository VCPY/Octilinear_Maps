import { TestBed } from '@angular/core/testing';

import { GtfsService } from './gtfs.service';

describe('GtfsService', () => {
  let service: GtfsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GtfsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
