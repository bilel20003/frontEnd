import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recherche',
  templateUrl: './recherche.component.html',
  styleUrls: ['./recherche.component.css']
})
export class PageRechercheComponent {
  reference: string = '';

  constructor(private router: Router) {}

  // Fonction pour lancer la recherche
  recherche() {
    console.log('Recherche lancée avec la référence:', this.reference);
    // Logique de recherche ici...
  }

  // Fonction pour annuler la recherche
  annuler() {
    this.reference = '';
  }

  // Fonction pour naviguer vers la page de recherche avancée
  rechercheAvancee() {
    this.router.navigate(['/recherche-avancee']);
  }
}
