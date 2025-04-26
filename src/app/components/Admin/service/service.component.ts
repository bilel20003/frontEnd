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
  sortDirection: { [key: string]: boolean } = {};

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
        services.forEach((service: Servicee) => {
          console.log(`Service ${service.id}:`, {
            nomService: service.nomService,
            ministere: service.ministere ? service.ministere : 'null/undefined'
          });
        });
        this.services = services;
        this.filterServices();
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
    console.log('getMinistereName appelé avec ministereId:', ministereId);
    console.log('Liste des ministères disponibles:', this.ministeres);
    if (!ministereId || ministereId <= 0) {
      console.log('Retour "Inconnu" car ministereId est invalide:', ministereId);
      return 'Inconnu';
    }
    const ministere = this.ministeres.find(min => min.id === ministereId);
    if (!ministere) {
      console.log('Aucun ministère trouvé pour ministereId:', ministereId);
      return 'Inconnu';
    }
    console.log('Ministère trouvé:', ministere.nomMinistere);
    return ministere.nomMinistere;
  }

  filterServices(): void {
    const term = this.searchTerm.toLowerCase();
    console.log('Filtrage avec searchTerm:', term);
    this.filteredServices = this.services.filter(service => {
      const ministereName = service.ministere ? this.getMinistereName(service.ministere.id) : 'Inconnu';
      return (
        service.nomService.toLowerCase().includes(term) ||
        ministereName.toLowerCase().includes(term)
      );
    });
    console.log('filteredServices:', this.filteredServices);
    this.currentPage = 1;
    this.updatePaginatedServices();
  }

  sort(column: string): void {
    this.sortDirection[column] = !this.sortDirection[column];
    const direction = this.sortDirection[column] ? 1 : -1;

    this.filteredServices.sort((a, b) => {
      if (column === 'ministere') {
        const nameA = a.ministere ? this.getMinistereName(a.ministere.id) : 'Inconnu';
        const nameB = b.ministere ? this.getMinistereName(b.ministere.id) : 'Inconnu';
        return direction * nameA.toLowerCase().localeCompare(nameB.toLowerCase(), 'fr', { numeric: true });
      }
      const valA = a[column as keyof Servicee];
      const valB = b[column as keyof Servicee];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return direction * (valA - valB);
      }
      return direction * valA.toString().localeCompare(valB.toString(), 'fr', { numeric: true });
    });

    this.updatePaginatedServices();
  }

  updatePaginatedServices(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedServices = this.filteredServices.slice(start, start + this.itemsPerPage);
    console.log('paginatedServices:', this.paginatedServices);
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
    console.log('Service à modifier:', service);
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
    console.log('Données avant transformation:', this.currentService);

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

    console.log('Données envoyées:', serviceData);

    const operation = this.isEditMode
      ? this.serviceService.updateService(this.currentService.id, serviceData)
      : this.serviceService.addNewService(serviceData);

    operation.subscribe({
      next: () => {
        this.loadServices();
        this.closeModal();
        alert(`Service ${this.isEditMode ? 'mis à jour' : 'ajouté'} avec succès.`);
      },
      error: (err: Error) => {
        console.error('Erreur lors de la sauvegarde du service:', err);
        alert(`Erreur: ${err.message}`);
      }
    });
  }

  deleteService(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer ce service ?')) {
      this.serviceService.deleteService(id).subscribe({
        next: () => {
          this.loadServices();
          alert('Service supprimé avec succès.');
        },
        error: (err: Error) => {
          console.error('Erreur lors de la suppression du service:', err);
          alert(`Erreur: ${err.message}`);
        }
      });
    }
  }
}