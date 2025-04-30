import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileGuichetierComponent } from './profile-guichetier.component';

describe('ProfileGuichetierComponent', () => {
  let component: ProfileGuichetierComponent;
  let fixture: ComponentFixture<ProfileGuichetierComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileGuichetierComponent]
    });
    fixture = TestBed.createComponent(ProfileGuichetierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
