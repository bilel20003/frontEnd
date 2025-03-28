import { TestBed } from '@angular/core/testing';

import { RendezVousService } from './rendezvous-detail.service';

describe('RendezvousDetailService', () => {
  let service: RendezVousService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RendezVousService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
