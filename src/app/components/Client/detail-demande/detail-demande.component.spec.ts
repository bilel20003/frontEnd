import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailDemandeComponent } from './detail-demande.component';

describe('DetailDemandeComponent', () => {
  let component: DetailDemandeComponent;
  let fixture: ComponentFixture<DetailDemandeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DetailDemandeComponent]
    });
    fixture = TestBed.createComponent(DetailDemandeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
