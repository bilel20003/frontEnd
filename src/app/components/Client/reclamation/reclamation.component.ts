import { Component } from '@angular/core';
import { Reclamation } from './reclamation.model';  // Import du modèle

@Component({
  selector: 'app-reclamation',
  templateUrl: './reclamation.component.html',
  styleUrls: ['./reclamation.component.css']
})
export class ReclamationComponent {
  reclamation: Reclamation = {
    id: 0,  // Id initialisé à 0, il sera généré ou attribué par le backend.
    titre: '',
    description: '',
    statut: 'En attente',  // Statut initial
    dateCreation: new Date(),  // Date de création actuelle
    utilisateurId: 1,  // Exemple d'ID utilisateur, tu peux le lier à l'utilisateur authentifié
  };

  // Méthode pour soumettre la réclamation
  submitReclamation() {
    if (this.reclamation.titre && this.reclamation.description) {
      // Ici, tu peux appeler un service pour envoyer la réclamation au serveur
      console.log('Réclamation soumise:', this.reclamation);

      // Par exemple, appel à un service API pour envoyer la réclamation
      // this.reclamationService.createReclamation(this.reclamation).subscribe(response => {
      //   console.log('Réclamation enregistrée:', response);
      // });

      // Réinitialisation du formulaire après soumission
      this.reclamation = { 
        id: 0, 
        titre: '', 
        description: '', 
        statut: 'En attente', 
        dateCreation: new Date(), 
        utilisateurId: 1 
      };
    }
  }
}
