import { Component } from '@angular/core';

@Component({
  selector: 'app-horaire',
  templateUrl: './horaire.component.html',
  styleUrls: ['./horaire.component.css']
})
export class HoraireComponent {
  jours: string[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  horaire = {
    jour: '',
    ouvertureMatin: '',
    fermetureMatin: '',
    ouvertureSoir: '',
    fermetureSoir: ''
  };

  horaires: any[] = [];

  ajouterHoraire() {
    const {
      jour,
      ouvertureMatin,
      fermetureMatin,
      ouvertureSoir,
      fermetureSoir
    } = this.horaire;

    if (
      jour &&
      ouvertureMatin &&
      fermetureMatin &&
      ouvertureSoir &&
      fermetureSoir
    ) {
      this.horaires.push({ ...this.horaire });

      // Réinitialiser le formulaire
      this.horaire = {
        jour: '',
        ouvertureMatin: '',
        fermetureMatin: '',
        ouvertureSoir: '',
        fermetureSoir: ''
      };
    }
  }

  supprimerHoraire(h: any) {
    this.horaires = this.horaires.filter(item => item !== h);
  }
}
