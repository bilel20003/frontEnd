import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileDacaComponent } from './profile-daca.component';

describe('ProfileDacaComponent', () => {
  let component: ProfileDacaComponent;
  let fixture: ComponentFixture<ProfileDacaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileDacaComponent]
    });
    fixture = TestBed.createComponent(ProfileDacaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
