import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuiHomeComponent } from './gui-home.component';

describe('GuiHomeComponent', () => {
  let component: GuiHomeComponent;
  let fixture: ComponentFixture<GuiHomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GuiHomeComponent]
    });
    fixture = TestBed.createComponent(GuiHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
