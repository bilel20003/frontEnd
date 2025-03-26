import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemandeTravauxComponent } from './demande-travaux.component';

describe('DemandeTravauxComponent', () => {
  let component: DemandeTravauxComponent;
  let fixture: ComponentFixture<DemandeTravauxComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DemandeTravauxComponent]
    });
    fixture = TestBed.createComponent(DemandeTravauxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
