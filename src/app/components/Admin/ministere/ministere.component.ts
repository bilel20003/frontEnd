import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MinistereService } from 'src/app/services/ministry.service';
import { Ministere } from 'src/app/models/ministere.model';
import { HttpErrorResponse } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  sortDirection: { [key: string]: boolean } = { id: false };
  currentPage: number = 1;
  itemsPerPage: number = 5;
  isNightMode: boolean = false;

  showModal: boolean = false;
  modalTitle: string = '';
  modalButtonText: string = '';
  ministereName: string = '';
  currentMinistere: Ministere | null = null;

  @ViewChild('ministereForm') ministereForm!: NgForm;

  constructor(
    private ministereService: MinistereService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const storedMode = localStorage.getItem('mode');
    if (storedMode === 'night') {
      this.isNightMode = true;
      document.body.classList.add('night-mode');
    }
    this.loadMinistere();
  }

  loadMinistere(): void {
    this.ministereService.getAllMinisteres().subscribe({
      next: (data: Ministere[]) => {
        this.ministeres = data;
        this.filteredMinistries = [...this.ministeres];
        this.filteredMinistries.sort((a, b) => b.id - a.id);
        this.updatePaginatedMinistries();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des ministères:', err);
        this.showError('Erreur: Impossible de charger les ministères. Vérifiez votre connexion.');
      }
    });
  }

  filterMinistries(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredMinistries = this.ministeres.filter(
      ministere => ministere.nomMinistere.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.filteredMinistries.sort((a, b) => b.id - a.id);
    this.updatePaginatedMinistries();
  }

  sort(column: 'id' | 'nomMinistere'): void {
    if (this.sortDirection[column] === undefined) {
      this.sortDirection[column] = column === 'id' ? false : true;
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
    this.updatePaginatedMinistries();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredMinistries.length / this.itemsPerPage) || 1;
  }

  updatePaginatedMinistries(): void {
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedMinistries = this.filteredMinistries.slice(start, end);
    this.cdr.detectChanges(); // Ensure UI updates
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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updatePaginatedMinistries();
    }
  }

  getPageNumbers(): number[] {
    const maxPagesToShow = 5;
    const pages: number[] = [];
    let startPage: number, endPage: number;

    if (this.totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = this.totalPages;
    } else {
      const half = Math.floor(maxPagesToShow / 2);
      startPage = Math.max(1, this.currentPage - half);
      endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = endPage - maxPagesToShow + 1;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
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
      this.modalTitle = 'Modifier un Ministère';
      this.modalButtonText = 'Modifier';
      this.ministereName = ministere.nomMinistere;
      this.currentMinistere = ministere;
    }
    this.cdr.detectChanges(); // Ensure modal renders
  }

  closeModal(): void {
    this.showModal = false;
    this.ministereName = '';
    this.currentMinistere = null;
    this.ministereForm?.resetForm(); // Reset form if it exists
    this.cdr.detectChanges(); // Force UI update
  }

  saveMinistere(): void {
    if (this.ministereForm.invalid) {
      this.showError('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }
    if (!this.ministereName.trim()) {
      this.showError('Le nom du ministère est requis.');
      return;
    }
    if (this.ministereName.length < 3) {
      this.showError('Le nom doit contenir au moins 3 caractères.');
      return;
    }

    const ministereData: { nomMinistere: string } = { nomMinistere: this.ministereName };

    if (this.currentMinistere) {
      this.ministereService.updateMinistere(this.currentMinistere.id, ministereData).subscribe({
        next: () => {
          this.loadMinistere(); // Reload data from backend
          this.closeModal();
          this.showSuccess('Ministère modifié avec succès !');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur lors de la modification:', err);
          this.showError('Échec de la modification. Vérifiez les données ou réessayez.');
        }
      });
    } else {
      this.ministereService.addNewMinistere(ministereData).subscribe({
        next: () => {
          this.loadMinistere(); // Reload data from backend
          this.closeModal();
          this.showSuccess('Ministère ajouté avec succès !');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur lors de l\'ajout:', err);
          this.showError('Échec de l\'ajout. Vérifiez votre connexion ou réessayez.');
        }
      });
    }
  }

  archiveMinistere(id: number): void {
    this.snackBar.open('Voulez-vous vraiment archiver ce ministère ?', 'Confirmer', {
      duration: 10000,
      panelClass: ['custom-warning-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    }).onAction().subscribe(() => {
      this.ministereService.archiveMinistere(id).subscribe({
        next: () => {
          this.loadMinistere(); // Reload data from backend
          this.showSuccess('Ministère archivé avec succès !');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur lors de l\'archivage:', err);
          this.showError('Échec de l\'archivage. Vérifiez votre connexion ou réessayez.');
        }
      });
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 10000,
      panelClass: ['custom-success-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
    this.cdr.detectChanges();
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 10000,
      panelClass: ['custom-error-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
    this.cdr.detectChanges();
  }
}