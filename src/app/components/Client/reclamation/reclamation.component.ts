import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms'; 




// Assurez-vous que le chemin est correct

@Component({
  selector: 'app-reclamation',
  templateUrl: './reclamation.component.html',
  styleUrls: ['./reclamation.component.css']
})
export class ReclamationComponent {
  reclamationForm: FormGroup;
  selectedFile: File | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    // Création du formulaire avec validation
    this.reclamationForm = this.fb.group({
      type_de_requete: ['', Validators.required],
      objet: ['', Validators.required],
      description: ['', Validators.required],
      fichier: [null]
    });
  }

  // Fonction pour sélectionner un fichier
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

 

  // Fonction pour soumettre le formulaire (envoi à l'API backend Laravel)
  onSubmit(): void {
    if (this.reclamationForm.valid) {
      const formData = new FormData();
      formData.append('type_de_requete', this.reclamationForm.value.type_de_requete);
      formData.append('objet', this.reclamationForm.value.objet);
      formData.append('description', this.reclamationForm.value.description);

      if (this.selectedFile) {
        formData.append('fichier', this.selectedFile, this.selectedFile.name);
      }

      // Envoi de la réclamation au backend Laravel via HTTP
      this.http.post('http://localhost/api/reclamations', formData).subscribe(
        (response) => {
          console.log('Réclamation envoyée avec succès', response);
        },
        (error) => {
          console.error('Erreur lors de l\'envoi de la réclamation', error);
        }
      );
    }
  }

  // Fonction pour enregistrer la requête sans l'envoyer (si nécessaire)
  onSave(): void {
    console.log('Requête enregistrée localement', this.reclamationForm.value);
  }

  // Fonction pour annuler l'action et réinitialiser le formulaire
  onCancel(): void {
    this.reclamationForm.reset();
  }
}
