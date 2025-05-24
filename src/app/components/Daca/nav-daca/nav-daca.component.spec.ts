import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarDacaComponent } from './nav-daca.component';

describe('NavDacaComponent', () => {
  let component: NavbarDacaComponent;
  let fixture: ComponentFixture<NavbarDacaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NavbarDacaComponent]
    });
    fixture = TestBed.createComponent(NavbarDacaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
