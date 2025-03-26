import { Component } from '@angular/core';

@Component({
  selector: 'app-demande-travaux',
  templateUrl: './demande-travaux.component.html',
  styleUrls: ['./demande-travaux.component.css']
})
export class DemandeTravauxComponent {

  // Variables pour stocker les données du formulaire
  
  description: string = '';
  date: string = '';

  // Méthode pour gérer la soumission du formulaire
  onSubmit(): void {
    // Afficher les données du formulaire dans la console
    console.log('Demande de travaux soumise', {
      description: this.description,
      date: this.date
    });
    
    // Logique pour envoyer la demande (par exemple, appel à un service)
  }
}
