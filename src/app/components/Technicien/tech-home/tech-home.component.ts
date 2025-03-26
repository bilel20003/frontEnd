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
    { id: 4, date: '2025-03-03', ministere: 'Ministère B', service: 'Service Y', objet: 'Problème logiciel', description: 'Erreur dans l’application' },
    { id: 3, date: '2025-03-02', ministere: 'Ministère C', service: 'Service Z', objet: 'Panne matérielle', description: 'Écran cassé' }
  ];

  filteredReclamations: Reclamation[] = [...this.reclamations];
  searchTerm: string = '';
  searchTermSubject: Subject<string> = new Subject<string>();

  menuOpen: boolean = false;
  sortColumn: keyof Reclamation = 'date';
  sortOrder: boolean = true;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Debouncing pour éviter les appels excessifs lors de la saisie dans la barre de recherche
    this.searchTermSubject.pipe(debounceTime(300)).subscribe((term) => {
      this.filterReclamations();
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  consulterReclamation(id: number) {
    this.router.navigate(['/tech/details', id]);
  }

  refuserReclamation(id: number) {
    console.log(`Réclamation ${id} refusée`);
  }

  sort(column: keyof Reclamation) {
    if (this.sortColumn === column) {
      this.sortOrder = !this.sortOrder;
    } else {
      this.sortColumn = column;
      this.sortOrder = true;
    }

    this.filteredReclamations.sort((a, b) => {
      if (a[column] < b[column]) return this.sortOrder ? -1 : 1;
      if (a[column] > b[column]) return this.sortOrder ? 1 : -1;
      return 0;
    });
  }

  filterReclamations() {
    this.filteredReclamations = this.reclamations.filter(reclamation =>
      reclamation.objet.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      reclamation.ministere.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      reclamation.service.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      reclamation.description.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  onSearchInput() {
    this.searchTermSubject.next(this.searchTerm);
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
