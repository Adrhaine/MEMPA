import { TestBed } from '@angular/core/testing';

import { StatsServices } from './stats.service';

describe('StatsServices', () => {
  let service: StatsServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatsServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
