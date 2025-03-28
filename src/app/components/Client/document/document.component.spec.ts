import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentsComponent } from './document.component';

describe('DocumentComponent', () => {
  let component: DocumentsComponent;
  let fixture: ComponentFixture<DocumentsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DocumentsComponent]
    });
    fixture = TestBed.createComponent(DocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
