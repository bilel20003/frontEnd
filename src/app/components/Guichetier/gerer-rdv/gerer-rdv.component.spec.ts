import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GererRdvComponent } from './gerer-rdv.component';

describe('GererRdvComponent', () => {
  let component: GererRdvComponent;
  let fixture: ComponentFixture<GererRdvComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GererRdvComponent]
    });
    fixture = TestBed.createComponent(GererRdvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
