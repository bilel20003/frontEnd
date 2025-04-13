import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinistryManagementComponent } from './ministere.component';

describe('MinistereComponent', () => {
  let component: MinistryManagementComponent;
  let fixture: ComponentFixture<MinistryManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MinistryManagementComponent]
    });
    fixture = TestBed.createComponent(MinistryManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
