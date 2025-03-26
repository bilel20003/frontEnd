import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenseignerAvancementComponent } from './renseigner-avancement.component';

describe('RenseignerAvancementComponent', () => {
  let component: RenseignerAvancementComponent;
  let fixture: ComponentFixture<RenseignerAvancementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RenseignerAvancementComponent]
    });
    fixture = TestBed.createComponent(RenseignerAvancementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
