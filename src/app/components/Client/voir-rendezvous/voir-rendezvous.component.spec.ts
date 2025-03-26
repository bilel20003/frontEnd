import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoirRendezvousComponent } from './voir-rendezvous.component';

describe('VoirRendezvousComponent', () => {
  let component: VoirRendezvousComponent;
  let fixture: ComponentFixture<VoirRendezvousComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VoirRendezvousComponent]
    });
    fixture = TestBed.createComponent(VoirRendezvousComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
