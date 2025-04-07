import { Component } from '@angular/core';

@Component({
  selector: 'app-horaire',
  templateUrl: './horaire.component.html',
  styleUrls: ['./horaire.component.css']
})
export class HoraireComponent {
  jours: string[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  
  horaire = {
    jour: '',
    heureDebut: '',
    heureFin: ''
  };

  horaires: any[] = [];

  ajouterHoraire() {
    if (this.horaire.jour && this.horaire.heureDebut && this.horaire.heureFin) {
      this.horaires.push({ ...this.horaire });
      this.horaire = { jour: '', heureDebut: '', heureFin: '' };
    }
  }

  supprimerHoraire(h: any) {
    this.horaires = this.horaires.filter(item => item !== h);
  }
}
