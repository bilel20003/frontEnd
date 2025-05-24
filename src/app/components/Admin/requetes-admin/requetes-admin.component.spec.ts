import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequetesAdminComponent } from './requetes-admin.component';

describe('RequetesAdminComponent', () => {
  let component: RequetesAdminComponent;
  let fixture: ComponentFixture<RequetesAdminComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RequetesAdminComponent]
    });
    fixture = TestBed.createComponent(RequetesAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
