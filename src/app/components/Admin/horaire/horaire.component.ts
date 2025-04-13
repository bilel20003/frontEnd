import { Component } from '@angular/core';

@Component({
  selector: 'app-horaire',
  templateUrl: './horaire.component.html',
  styleUrls: ['./horaire.component.css']
})
export class HoraireComponent {
  jours: string[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  moisList: string[] = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  horaire = {
    mois: '',
    jour: '',
    ouvertureMatin: '',
    fermetureMatin: '',
    ouvertureSoir: '',
    fermetureSoir: ''
  };

  horaires: any[] = [];

  ajouterHoraire() {
    const {
      mois,
      jour,
      ouvertureMatin,
      fermetureMatin,
      ouvertureSoir,
      fermetureSoir
    } = this.horaire;

    if (mois && jour && ouvertureMatin && fermetureMatin && ouvertureSoir && fermetureSoir) {
      this.horaires.push({ ...this.horaire });

      // Réinitialiser
      this.horaire = {
        mois: '',
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
