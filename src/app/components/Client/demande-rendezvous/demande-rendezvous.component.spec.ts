import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemandeRendezvousComponent } from './demande-rendezvous.component';

describe('DemandeRendezvousComponent', () => {
  let component: DemandeRendezvousComponent;
  let fixture: ComponentFixture<DemandeRendezvousComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DemandeRendezvousComponent]
    });
    fixture = TestBed.createComponent(DemandeRendezvousComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
