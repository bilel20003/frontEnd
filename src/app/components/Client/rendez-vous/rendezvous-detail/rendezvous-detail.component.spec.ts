import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RendezVousDetailComponent } from './rendezvous-detail.component';

describe('RendezVousDetailComponent', () => {
  let component: RendezVousDetailComponent;
  let fixture: ComponentFixture<RendezVousDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RendezVousDetailComponent],
      imports: [ReactiveFormsModule] // Importer ReactiveFormsModule pour les tests de formulaires
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RendezVousDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a valid form when all fields are filled', () => {
    component.rendezVousForm.controls['nomPrenom'].setValue('John Doe');
    component.rendezVousForm.controls['telephone'].setValue('0123456789');
    component.rendezVousForm.controls['ministere'].setValue('Ministère de la Santé');
    component.rendezVousForm.controls['typeProbleme'].setValue('technique');
    component.rendezVousForm.controls['date'].setValue('2023-10-01T10:00');
    component.rendezVousForm.controls['description'].setValue('Problème de connexion');

    expect(component.rendezVousForm.valid).toBeTrue();
  });

  it('should not submit the form if it is invalid', () => {
    spyOn(console, 'log'); // Espionner console.log pour vérifier si on ne l'appelle pas
    component.onSubmit();
    expect(console.log).not.toHaveBeenCalled(); // Vérifier que console.log n'est pas appelé
  });

  it('should submit the form if it is valid', () => {
    component.rendezVousForm.controls['nomPrenom'].setValue('John Doe');
    component.rendezVousForm.controls['telephone'].setValue('0123456789');
    component.rendezVousForm.controls['ministere'].setValue('Ministère de la Santé');
    component.rendezVousForm.controls['typeProbleme'].setValue('technique');
    component.rendezVousForm.controls['date'].setValue('2023-10-01T10:00');
    component.rendezVousForm.controls['description'].setValue('Problème de connexion');

    spyOn(console, 'log'); // Espionner console.log
    component.onSubmit();
    expect(console.log).toHaveBeenCalled(); // Vérifier que console.log est appelé
  });
});