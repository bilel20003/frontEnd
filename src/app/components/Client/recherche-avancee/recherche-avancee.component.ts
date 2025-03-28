import { Component } from '@angular/core';

@Component({
  selector: 'app-recherche-avancee',
  templateUrl: './recherche-avancee.component.html',
  styleUrls: ['./recherche-avancee.component.css']
})
export class PageRechercheAvanceeComponent {
  reference: string = '';
  date: string = '';
  statut: string = '';

  // Fonction pour lancer la recherche avancée
  rechercheAvancee() {
    console.log('Recherche avancée lancée avec:', this.reference, this.date, this.statut);
    // Logique de recherche avancée ici...
  }
}
