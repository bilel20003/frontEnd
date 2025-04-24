import { Component, OnInit } from '@angular/core';
import { Servicee } from 'src/app/models/service.model';
import { Ministere } from 'src/app/models/ministere.model';
import { ServiceService } from 'src/app/services/service.service';
import { MinistereService } from 'src/app/services/ministere.service';

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
  currentService: Servicee = { id: 0, nomService: '', ministere: { id: 0 } };

  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 5;
  isNightMode = false;

  constructor(
    private serviceService: ServiceService,
    private ministereService: MinistereService
  ) {}

  ngOnInit(): void {
    const storedMode = localStorage.getItem('mode');
    if (storedMode === 'night') this.toggleMode();
    this.loadServices();
    this.loadMinisteres();
  }

  loadServices(): void {
    this.serviceService.getAllService().subscribe({
      next: (services) => {
        console.log('Services received:', services);
        this.services = services;
        this.filteredServices = [...this.services];
        this.updatePaginatedServices();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des services:', err);
        alert(`Erreur: ${err.message}`);
      }
    });
  }

  loadMinisteres(): void {
    this.ministereService.getAllMinisteres().subscribe({
      next: (ministeres) => {
        console.log('Ministères received:', ministeres);
        this.ministeres = ministeres;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des ministères:', err);
        alert(`Erreur: ${err.message}`);
      }
    });
  }

  filterServices(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredServices = this.services.filter(service =>
      service.nomService.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.updatePaginatedServices();
  }

  updatePaginatedServices(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedServices = this.filteredServices.slice(start, end);
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

  get totalPages(): number {
    return Math.ceil(this.filteredServices.length / this.itemsPerPage);
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
    this.currentService = { id: 0, nomService: '', ministere: { id: 0 } };
    this.isModalOpen = true;
  }

  editService(service: Servicee): void {
    this.isEditMode = true;
    this.currentService = { ...service };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.currentService = { id: 0, nomService: '', ministere: { id: 0 } };
  }

  saveService(): void {
    if (!this.currentService.nomService.trim()) {
      alert('Le nom du service est requis.');
      return;
    }
    if (!this.currentService.ministere.id) {
      alert('Veuillez sélectionner un ministère.');
      return;
    }

    if (this.isEditMode) {
      this.serviceService.updateService(this.currentService.id, this.currentService).subscribe({
        next: () => {
          this.loadServices();
          this.closeModal();
          alert('Service mis à jour avec succès.');
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour du service:', err);
          alert(`Erreur: ${err.message}`);
        }
      });
    } else {
      this.serviceService.addNewService(this.currentService).subscribe({
        next: () => {
          this.loadServices();
          this.closeModal();
          alert('Service ajouté avec succès.');
        },
        error: (err) => {
          console.error('Erreur lors de l\'ajout du service:', err);
          alert(`Erreur: ${err.message}`);
        }
      });
    }
  }

  deleteService(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer ce service ?')) {
      this.serviceService.deleteService(id).subscribe({
        next: () => {
          this.loadServices();
          alert('Service supprimé avec succès.');
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du service:', err);
          alert(`Erreur: ${err.message}`);
        }
      });
    }
  }
}