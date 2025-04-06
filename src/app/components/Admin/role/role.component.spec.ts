import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GererRoleComponent } from './role.component';

describe('RoleComponent', () => {
  let component: GererRoleComponent;
  let fixture: ComponentFixture<GererRoleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GererRoleComponent]
    });
    fixture = TestBed.createComponent(GererRoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
