import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Servicee } from 'src/app/models/service.model';
import { Ministere } from 'src/app/models/ministere.model';
import { ServiceService } from 'src/app/services/service.service';
import { MinistereService } from 'src/app/services/ministere.service';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { NgForm } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.css']
})
export class ServiceComponent implements OnInit {
  services: Servicee[] = [];
  filteredServices: Servicee[] = [];
  paginatedServices: Servicee[] = [];
  ministeres: Ministere[] = [];

  isModalOpen = false;
  isEditMode = false;
  currentService: Servicee = this.initService();

  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 5;
  isNightMode = false;
  sortDirection: { [key: string]: boolean } = { id: false };

  @ViewChild('serviceForm') serviceForm!: NgForm;

  constructor(
    private serviceService: ServiceService,
    private ministereService: MinistereService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (localStorage.getItem('mode') === 'night') {
      this.isNightMode = true;
      document.body.classList.add('night-mode');
    }
    this.loadMinisteres().subscribe({
      next: () => this.loadServices(),
      error: (err: Error) => this.showError(`Échec du chargement des ministères: ${err.message}`)
    });
  }

  private getEmptyService(): Omit<Servicee, 'id'> {
    return {
      nomService: '',
      ministere: { id: 0 }
    };
  }

  initService(): Servicee {
    return { id: 0, ...this.getEmptyService() };
  }

  loadServices(): void {
    this.serviceService.getAllServices().subscribe({
      next: (services: Servicee[]) => {
        this.services = services;
        this.filteredServices = [...this.services];
        this.filteredServices.sort((a, b) => b.id - a.id);
        this.updatePaginatedServices();
      },
      error: (err: Error) => this.showError(`Erreur lors du chargement des services: ${err.message}`)
    });
  }

  loadMinisteres(): Observable<Ministere[]> {
    return this.ministereService.getAllMinisteres().pipe(
      tap((ministeres: Ministere[]) => {
        this.ministeres = ministeres;
      }),
      catchError((err: Error) => {
        this.showError(`Erreur lors du chargement des ministères: ${err.message}`);
        return of([]);
      })
    );
  }

  getMinistereName(ministereId: number | undefined): string {
    if (!ministereId || ministereId <= 0) return 'Inconnu';
    const ministere = this.ministeres.find(min => min.id === ministereId);
    return ministere ? ministere.nomMinistere : 'Inconnu';
  }

  filterServices(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredServices = this.services.filter(service => {
      const ministereName = service.ministere ? this.getMinistereName(service.ministere.id) : 'Inconnu';
      return service.nomService.toLowerCase().includes(term) || ministereName.toLowerCase().includes(term);
    });
    this.filteredServices.sort((a, b) => b.id - a.id);
    this.currentPage = 1;
    this.updatePaginatedServices();
  }

  sort(column: 'id' | 'nomService' | 'ministere'): void {
    if (this.sortDirection[column] === undefined) {
      this.sortDirection[column] = column === 'id' ? false : true;
    } else {
      this.sortDirection[column] = !this.sortDirection[column];
    }
    const direction = this.sortDirection[column] ? 1 : -1;

    this.filteredServices.sort((a, b) => {
      if (column === 'ministere') {
        const nameA = a.ministere ? this.getMinistereName(a.ministere.id) : 'Inconnu';
        const nameB = b.ministere ? this.getMinistereName(b.ministere.id) : 'Inconnu';
        return direction * nameA.localeCompare(nameB, 'fr', { numeric: true });
      }
      if (column === 'id') {
        return direction * (a.id - b.id);
      }
      return direction * a.nomService.localeCompare(b.nomService, 'fr', { numeric: true });
    });
    this.updatePaginatedServices();
  }

  updatePaginatedServices(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedServices = this.filteredServices.slice(start, start + this.itemsPerPage);
    this.cdr.detectChanges(); // Ensure UI updates
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedServices();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedServices();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updatePaginatedServices();
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

  get totalPages(): number {
    return Math.ceil(this.filteredServices.length / this.itemsPerPage) || 1;
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePaginatedServices();
  }

  toggleMode(): void {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
    localStorage.setItem('mode', this.isNightMode ? 'night' : 'day');
  }

  openServiceModal(): void {
    this.isEditMode = false;
    this.currentService = this.initService();
    this.isModalOpen = true;
    this.cdr.detectChanges(); // Ensure modal renders
  }

  editService(service: Servicee): void {
    this.isEditMode = true;
    this.currentService = {
      ...service,
      ministere: service.ministere ? { id: service.ministere.id } : { id: 0 }
    };
    if (this.ministeres.length === 0) {
      this.ministereService.getAllMinisteres().subscribe({
        next: (ministeres) => {
          this.ministeres = ministeres;
          this.isModalOpen = true;
          this.cdr.detectChanges(); // Ensure modal renders
        },
        error: (err: Error) => this.showError(`Erreur lors du chargement des ministères: ${err.message}`)
      });
    } else {
      this.isModalOpen = true;
      this.cdr.detectChanges(); // Ensure modal renders
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.currentService = this.initService();
    this.serviceForm?.resetForm(); // Reset form if it exists
    this.cdr.detectChanges(); // Force UI update
  }

  saveService(): void {
    if (this.serviceForm.invalid) {
      this.showError('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }
    const { nomService, ministere } = this.currentService;
    if (!nomService.trim()) {
      this.showError('Le nom du service est requis.');
      return;
    }
    if (!ministere.id || ministere.id <= 0) {
      this.showError('Veuillez sélectionner un ministère valide.');
      return;
    }
    const serviceData: Omit<Servicee, 'id'> = {
      nomService: this.currentService.nomService,
      ministere: { id: this.currentService.ministere.id }
    };
    const operation = this.isEditMode
      ? this.serviceService.updateService(this.currentService.id, serviceData)
      : this.serviceService.addNewService(serviceData);

    operation.subscribe({
      next: () => {
        this.loadServices(); // Reload data from backend
        this.closeModal();
        this.showSuccess(`Succès: Service ${this.isEditMode ? 'mis à jour' : 'ajouté'} avec succès !`);
      },
      error: (err: Error) => this.showError(`Erreur lors de la sauvegarde du service: ${err.message}`)
    });
  }

  archiveService(id: number): void {
    this.snackBar.open('Voulez-vous vraiment archiver ce service ? Il ne sera plus visible dans la liste active.', 'Confirmer', {
      duration: 10000,
      panelClass: ['custom-warning-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    }).onAction().subscribe(() => {
      this.serviceService.archiveService(id).subscribe({
        next: () => {
          this.loadServices(); // Reload data from backend
          this.showSuccess('Succès: Service archivé avec succès !');
        },
        error: (err: Error) => this.showError(`Erreur lors de l'archivage du service: ${err.message}`)
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