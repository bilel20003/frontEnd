import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjetReclamationComponent } from './objet-reclamation.component';

describe('ObjetReclamationComponent', () => {
  let component: ObjetReclamationComponent;
  let fixture: ComponentFixture<ObjetReclamationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ObjetReclamationComponent]
    });
    fixture = TestBed.createComponent(ObjetReclamationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
