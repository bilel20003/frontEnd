import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinistereComponent } from './ministere.component';

describe('MinistereComponent', () => {
  let component: MinistereComponent;
  let fixture: ComponentFixture<MinistereComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MinistereComponent]
    });
    fixture = TestBed.createComponent(MinistereComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
