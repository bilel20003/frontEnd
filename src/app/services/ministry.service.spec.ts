import { TestBed } from '@angular/core/testing';

import { MinistereService } from './ministry.service';

describe('MinistryService', () => {
  let service: MinistereService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MinistereService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
