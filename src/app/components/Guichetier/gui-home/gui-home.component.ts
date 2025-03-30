import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface Personne {
  id: number;
  nom: string;
  prenom: string;
  motDePasse: string;
  numTel: string | null;
  email: string | null;
  role: string;
}

export interface Requete {
  id: number;
  type: string;
  objet: string;
  description: string;
  etat: string;
  noteRetour: string | null;
  date: string;
  client: Personne;
  guichetier: Personne;
  technicien: Personne | null;
  [key: string]: any;
}

@Component({
  selector: 'app-gui-home',
  templateUrl: './gui-home.component.html',
  styleUrls: ['./gui-home.component.css']
})
export class GuiHomeComponent implements OnInit {
  reclamations: Requete[] = [];
  filteredReclamations: Requete[] = [];
  searchTerm: string = '';
  sortDirection: { [key: string]: boolean } = {};

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadReclamations();
  }

  loadReclamations(): void {
    this.http.get<Requete[]>('http://localhost:8082/api/requetes').subscribe(
      (data) => {
        this.reclamations = data;
        this.filteredReclamations = [...this.reclamations];
      },
      (error) => {
        console.error('Erreur lors du chargement des réclamations', error);
      }
    );
  }

  filterReclamations() {
    this.filteredReclamations = this.reclamations.filter(reclamation =>
      Object.values(reclamation).some(value =>
        value && value.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
      )
    );
  }

  refuserReclamation(id: number) {
    console.log(`Réclamation ${id} refusée`);
    // Ajoute la logique pour refuser la réclamation ici
  }

  sort(column: string) {
    this.sortDirection[column] = !this.sortDirection[column];
    const direction = this.sortDirection[column] ? 1 : -1;
  
    this.filteredReclamations = [...this.reclamations];
    this.filteredReclamations.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];
  
      if (typeof valA === 'number' && typeof valB === 'number') {
        return direction * (valA - valB);
      } else if (valA instanceof Date && valB instanceof Date) {
        return direction * (valA.getTime() - valB.getTime());
      }
      return direction * valA.toString().localeCompare(valB.toString(), 'fr', { numeric: true });
    });
  }

  getBadgeClass(etat: string) {
    switch (etat) {
      case 'NOUVEAU': return 'badge-primary';
      case 'EN_COURS_DE_TRAITEMENT': return 'badge-warning';
      case 'TRAITEE': return 'badge-success';
      case 'REFUSEE': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  consulterReclamation(id: number): void {
    const updatedReclamation = this.reclamations.find(reclamation => reclamation.id === id);
    
    if (updatedReclamation && updatedReclamation.etat === 'NOUVEAU') {
      updatedReclamation.etat = 'EN_COURS_DE_TRAITEMENT';
      
      this.http.put(`http://localhost:8082/api/requetes/${id}`, updatedReclamation)
        .subscribe(
          () => {
            console.log('Requête mise à jour');
            // Met à jour la liste des réclamations pour qu'elle reflète le changement
            this.loadReclamations();
          },
          error => {
            console.error('Erreur lors de la mise à jour de la requête', error);
          }
        );
    }
  }
  
}
