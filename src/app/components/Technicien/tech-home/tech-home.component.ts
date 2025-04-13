import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface Reclamation {
  id: number;
  date: string;
  ministere: string;
  service: string;
  objet: string;
  description: string;
  [key: string]: string | number;
}

@Component({
  selector: 'app-tech-home',
  templateUrl: './tech-home.component.html',
  styleUrls: ['./tech-home.component.css']
})
export class TechHomeComponent implements OnInit {
  reclamations: Reclamation[] = [
    { id: 1, date: '2025-03-04', ministere: 'Ministère A', service: 'Service X', objet: 'Problème réseau', description: 'Problème de connexion Internet' },
    { id: 2, date: '2025-03-03', ministere: 'Ministère B', service: 'Service Y', objet: 'Problème logiciel', description: 'Erreur dans l’application' },
    { id: 3, date: '2025-03-02', ministere: 'Ministère C', service: 'Service Z', objet: 'Panne matérielle', description: 'Écran cassé' }
  ];

  filteredReclamations: Reclamation[] = [...this.reclamations];
  searchTerm: string = '';
  searchTermSubject: Subject<string> = new Subject<string>();
  isNightMode: boolean = false;
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5; // Nombre d'éléments par page
  totalPages: number = Math.ceil(this.reclamations.length / this.itemsPerPage);

  // Popup
  popupOpen: boolean = false;
  selectedReclamation: Reclamation | null = null;
  note: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Debouncing pour éviter les appels excessifs lors de la saisie dans la barre de recherche
    this.searchTermSubject.pipe(debounceTime(300)).subscribe(() => {
      this.filterReclamations();
    });
  }

  // Méthode pour ouvrir le pop-up
  openPopup(reclamation: Reclamation) {
    this.selectedReclamation = reclamation;
    this.popupOpen = true;
  }

  // Méthode pour fermer le pop-up
  closePopup() {
    this.popupOpen = false;
    this.selectedReclamation = null;
    this.note = ''; // Réinitialiser la note
  }

  // Méthode pour sauvegarder la note
  saveNote() {
    console.log(`Note pour la réclamation ${this.selectedReclamation?.id}: ${this.note}`);
    // Ici, vous pouvez ajouter la logique pour sauvegarder la note
    this.closePopup(); // Fermer le pop-up après sauvegarde
  }

  // Méthode pour refuser une réclamation
// Méthode pour refuser une réclamation
refuserReclamation(id: number) {
  const index = this.reclamations.findIndex(reclamation => reclamation.id === id);
  if (index !== -1) {
    // Supprimer la réclamation de la liste
    this.reclamations.splice(index, 1);
    // Mettre à jour les réclamations filtrées
    this.filterReclamations();
    console.log(`Réclamation ${id} refusée et supprimée.`);
  } else {
    console.log(`Réclamation ${id} non trouvée.`);
  }
}

  // Méthode pour trier les réclamations
  sort(column: keyof Reclamation) {
    this.filteredReclamations.sort((a, b) => {
      if (a[column] < b[column]) return -1;
      if (a[column] > b[column]) return 1;
      return 0;
    });
  }

  // Méthode pour filtrer les réclamations
 // Méthode pour filtrer les réclamations
filterReclamations() {
  this.filteredReclamations = this.reclamations.filter(reclamation =>
    reclamation.objet.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
    reclamation.ministere.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
    reclamation.service.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
    reclamation.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
    reclamation.id.toString().includes(this.searchTerm) // Recherche par ID
  );

  // Réinitialiser la pagination après le filtrage
  this.currentPage = 1;
  this.totalPages = Math.ceil(this.filteredReclamations.length / this.itemsPerPage);
}

  // Méthode pour gérer l'entrée de recherche
  onSearchInput() {
    this.searchTermSubject.next(this.searchTerm);
  }

  // Pagination
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Méthode pour changer le nombre d'éléments par page
  onItemsPerPageChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.itemsPerPage = Number(selectElement.value);
    this.currentPage = 1; // Réinitialiser à la première page
    this.totalPages = Math.ceil(this.filteredReclamations.length / this.itemsPerPage);
  }

  // Propriété calculée pour obtenir les réclamations paginées
  get paginatedReclamations() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredReclamations.slice(startIndex, startIndex + this.itemsPerPage);
  }
  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }

}