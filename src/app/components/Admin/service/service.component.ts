import { Component, OnInit } from '@angular/core';
import { Servicee } from 'src/app/models/service.model';
import { Ministere } from 'src/app/models/ministere.model';
import { ServiceService } from 'src/app/services/service.service';
import { MinistereService } from 'src/app/services/ministere.service';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

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
  sortDirection: { [key: string]: boolean } = { id: false }; // Default to descending for id

  constructor(
    private serviceService: ServiceService,
    private ministereService: MinistereService
  ) {}

  ngOnInit(): void {
    if (localStorage.getItem('mode') === 'night') this.toggleMode();
    this.loadMinisteres().subscribe({
      next: () => this.loadServices(),
      error: (err: Error) => console.error('Échec du chargement des ministères:', err)
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
        console.log('Services chargés:', services);
        this.services = services;
        this.filteredServices = [...this.services];
        this.filteredServices.sort((a, b) => b.id - a.id); // Sort by id descending
        console.log('Sorted services (descending by id):', this.filteredServices);
        this.updatePaginatedServices();
      },
      error: (err: Error) => {
        console.error('Erreur lors du chargement des services:', err);
        alert(`Erreur: ${err.message}`);
      }
    });
  }

  loadMinisteres(): Observable<Ministere[]> {
    return this.ministereService.getAllMinisteres().pipe(
      tap((ministeres: Ministere[]) => {
        console.log('Ministères chargés:', ministeres);
        this.ministeres = ministeres;
      }),
      catchError((err: Error) => {
        console.error('Erreur lors du chargement des ministères:', err);
        alert(`Erreur: ${err.message}`);
        return of([]);
      })
    );
  }

  getMinistereName(ministereId: number | undefined): string {
    if (!ministereId || ministereId <= 0) {
      return 'Inconnu';
    }
    const ministere = this.ministeres.find(min => min.id === ministereId);
    return ministere ? ministere.nomMinistere : 'Inconnu';
  }

  filterServices(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredServices = this.services.filter(service => {
      const ministereName = service.ministere ? this.getMinistereName(service.ministere.id) : 'Inconnu';
      return (
        service.nomService.toLowerCase().includes(term) ||
        ministereName.toLowerCase().includes(term)
      );
    });
    this.filteredServices.sort((a, b) => b.id - a.id); // Reapply descending id sort
    this.currentPage = 1;
    this.updatePaginatedServices();
  }

  sort(column: 'id' | 'nomService' | 'ministere'): void {
    if (this.sortDirection[column] === undefined) {
      this.sortDirection[column] = column === 'id' ? false : true; // id defaults to descending, others to ascending
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

    console.log(`Sorted by ${column}, direction: ${this.sortDirection[column] ? 'ascending' : 'descending'}`, this.filteredServices);
    this.updatePaginatedServices();
  }

  updatePaginatedServices(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedServices = this.filteredServices.slice(start, start + this.itemsPerPage);
    console.log('Paginated Services:', this.paginatedServices);
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
        },
        error: (err: Error) => {
          console.error('Erreur lors du chargement des ministères:', err);
          alert(`Erreur: Impossible de charger les ministères.`);
        }
      });
    } else {
      this.isModalOpen = true;
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.currentService = this.initService();
  }

  saveService(): void {
    const { nomService, ministere } = this.currentService;
    if (!nomService.trim()) {
      alert('Le nom du service est requis.');
      return;
    }
    if (!ministere.id || ministere.id <= 0) {
      alert('Veuillez sélectionner un ministère valide.');
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
      next: (updatedService: Servicee) => {
        this.services = this.isEditMode
          ? this.services.map(s => s.id === updatedService.id ? updatedService : s)
          : [updatedService, ...this.services];
        this.filteredServices = this.services.filter(service => {
          const ministereName = service.ministere ? this.getMinistereName(service.ministere.id) : 'Inconnu';
          return (
            service.nomService.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            ministereName.toLowerCase().includes(this.searchTerm.toLowerCase())
          );
        });
        this.filteredServices.sort((a, b) => b.id - a.id); // Reapply descending id sort
        this.updatePaginatedServices();
        this.closeModal();
        alert(`Service ${this.isEditMode ? 'mis à jour' : 'ajouté'} avec succès.`);
      },
      error: (err: Error) => {
        console.error('Erreur lors de la sauvegarde du service:', err);
        alert(`Erreur: ${err.message}`);
      }
    });
  }

  archiveService(id: number): void {
    if (confirm('Voulez-vous vraiment archiver ce service ?')) {
      this.serviceService.archiveService(id).subscribe({
        next: () => {
          this.services = this.services.filter(s => s.id !== id);
          this.filteredServices = this.filteredServices.filter(s => s.id !== id);
          this.updatePaginatedServices();
          alert('Service archivé avec succès.');
        },
        error: (err: Error) => {
          console.error('Erreur lors de l\'archivage du service:', err);
          alert(`Erreur: ${err.message}`);
        }
      });
    }
  }
}