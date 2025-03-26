import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuiRequestDetailsComponent } from './gui-request-details.component';

describe('GuiRequestDetailsComponent', () => {
  let component: GuiRequestDetailsComponent;
  let fixture: ComponentFixture<GuiRequestDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GuiRequestDetailsComponent]
    });
    fixture = TestBed.createComponent(GuiRequestDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
