import { TestBed } from '@angular/core/testing';

import { UserInfo } from './user-info';

describe('ClientService', () => {
  let service: UserInfo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserInfo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
