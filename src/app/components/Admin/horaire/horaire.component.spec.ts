import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HoraireComponent } from './horaire.component';

describe('HoraireComponent', () => {
  let component: HoraireComponent;
  let fixture: ComponentFixture<HoraireComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HoraireComponent]
    });
    fixture = TestBed.createComponent(HoraireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
