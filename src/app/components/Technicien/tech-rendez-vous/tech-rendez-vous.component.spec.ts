import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechRendezVousComponent } from './tech-rendez-vous.component';

describe('TechRendezVousComponent', () => {
  let component: TechRendezVousComponent;
  let fixture: ComponentFixture<TechRendezVousComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TechRendezVousComponent]
    });
    fixture = TestBed.createComponent(TechRendezVousComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
