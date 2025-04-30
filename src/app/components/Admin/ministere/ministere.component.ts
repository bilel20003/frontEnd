import { Component, OnInit } from '@angular/core';
import { MinistereService } from 'src/app/services/ministry.service';
import { Ministere } from 'src/app/models/ministere.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-ministere',
  templateUrl: './ministere.component.html',
  styleUrls: ['./ministere.component.css']
})
export class MinistryManagementComponent implements OnInit {
  ministeres: Ministere[] = [];
  filteredMinistries: Ministere[] = [];
  paginatedMinistries: Ministere[] = [];
  searchTerm: string = '';
  sortDirection: { [key: string]: boolean } = { id: false }; // Default to descending for id
  currentPage: number = 1;
  itemsPerPage: number = 5;
  isNightMode: boolean = false;

  showModal: boolean = false;
  modalTitle: string = '';
  modalButtonText: string = '';
  ministereName: string = '';
  currentMinistere: Ministere | null = null;

  constructor(private ministereService: MinistereService) {}

  ngOnInit(): void {
    this.loadMinistere();
    const storedMode = localStorage.getItem('mode');
    if (storedMode === 'night') {
      this.isNightMode = true;
      document.body.classList.add('night-mode');
    }
  }

  loadMinistere(): void {
    this.ministereService.getAllMinisteres().subscribe({
      next: (data: Ministere[]) => {
        console.log('Ministères reçus:', data);
        this.ministeres = data;
        this.filteredMinistries = [...this.ministeres];
        // Sort by id in descending order
        this.filteredMinistries.sort((a, b) => b.id - a.id);
        console.log('Sorted ministries (descending by id):', this.filteredMinistries);
        this.updatePaginatedMinistries();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des ministères:', err);
        alert('Erreur lors du chargement des ministères. Veuillez vérifier la connexion au serveur.');
      }
    });
  }

  filterMinistries(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredMinistries = this.ministeres.filter(
      ministere => ministere.nomMinistere.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.filteredMinistries.sort((a, b) => b.id - a.id); // Reapply descending id sort
    this.updatePaginatedMinistries();
  }

  sort(column: 'id' | 'nomMinistere'): void {
    if (this.sortDirection[column] === undefined) {
      this.sortDirection[column] = column === 'id' ? false : true; // id defaults to descending, nomMinistere to ascending
    } else {
      this.sortDirection[column] = !this.sortDirection[column];
    }
    const dir = this.sortDirection[column] ? 1 : -1;

    this.filteredMinistries.sort((a, b) => {
      if (column === 'id') {
        return dir * (a.id - b.id);
      } else {
        return dir * a.nomMinistere.localeCompare(b.nomMinistere, 'fr', { numeric: true });
      }
    });

    console.log(`Sorted by ${column}, direction: ${this.sortDirection[column] ? 'ascending' : 'descending'}`, this.filteredMinistries);
    this.updatePaginatedMinistries();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredMinistries.length / this.itemsPerPage);
  }

  updatePaginatedMinistries(): void {
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedMinistries = this.filteredMinistries.slice(start, end);
    console.log('Paginated Ministries:', this.paginatedMinistries);
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedMinistries();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedMinistries();
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePaginatedMinistries();
  }

  toggleMode(): void {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
    localStorage.setItem('mode', this.isNightMode ? 'night' : 'day');
  }

  openModal(action: 'add' | 'edit', ministere?: Ministere): void {
    this.showModal = true;
    if (action === 'add') {
      this.modalTitle = 'Ajouter un Ministère';
      this.modalButtonText = 'Ajouter';
      this.ministereName = '';
      this.currentMinistere = null;
    } else if (action === 'edit' && ministere) {
      this.modalTitle = `Modifier le ministère : ${ministere.nomMinistere}`;
      this.modalButtonText = 'Modifier';
      this.ministereName = ministere.nomMinistere;
      this.currentMinistere = ministere;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.ministereName = '';
    this.currentMinistere = null;
  }

  saveMinistere(): void {
    if (!this.ministereName.trim()) {
      alert('Le nom du ministère est requis.');
      return;
    }

    const ministereData: { nomMinistere: string } = { nomMinistere: this.ministereName };

    if (this.currentMinistere) {
      this.ministereService.updateMinistere(this.currentMinistere.id, ministereData).subscribe({
        next: (updated: Ministere) => {
          this.ministeres = this.ministeres.map(m => (m.id === updated.id ? updated : m));
          this.filteredMinistries = this.ministeres.filter(
            m => m.nomMinistere.toLowerCase().includes(this.searchTerm.toLowerCase())
          );
          this.filteredMinistries.sort((a, b) => b.id - a.id); // Reapply descending id sort
          this.updatePaginatedMinistries();
          this.closeModal();
          alert('Ministère modifié avec succès !');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur lors de la modification:', err);
          alert('Erreur lors de la modification du ministère. Veuillez réessayer.');
        }
      });
    } else {
      this.ministereService.addNewMinistere(ministereData).subscribe({
        next: (created: Ministere) => {
          this.ministeres = [created, ...this.ministeres];
          this.filteredMinistries = this.ministeres.filter(
            m => m.nomMinistere.toLowerCase().includes(this.searchTerm.toLowerCase())
          );
          this.filteredMinistries.sort((a, b) => b.id - a.id); // Reapply descending id sort
          this.updatePaginatedMinistries();
          this.closeModal();
          alert('Ministère ajouté avec succès !');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur lors de l\'ajout:', err);
          alert('Erreur lors de l\'ajout du ministère. Veuillez réessayer.');
        }
      });
    }
  }

  archiveMinistere(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir archiver ce ministère ?')) {
      this.ministereService.archiveMinistere(id).subscribe({
        next: () => {
          this.ministeres = this.ministeres.filter(m => m.id !== id);
          this.filteredMinistries = this.filteredMinistries.filter(m => m.id !== id);
          this.updatePaginatedMinistries();
          alert('Ministère archivé avec succès !');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur lors de l\'archivage:', err);
          alert('Erreur lors de l\'archivage du ministère. Veuillez réessayer.');
        }
      });
    }
  }
}