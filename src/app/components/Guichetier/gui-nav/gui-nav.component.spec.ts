import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuiNavComponent } from './gui-nav.component';

describe('GuiNavComponent', () => {
  let component: GuiNavComponent;
  let fixture: ComponentFixture<GuiNavComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GuiNavComponent]
    });
    fixture = TestBed.createComponent(GuiNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
