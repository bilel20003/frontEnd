import { Component, OnInit } from '@angular/core';
import { Servicee } from 'src/app/models/service.model';
import { ServiceService } from 'src/app/services/service.service';

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.css']
})
export class ServiceComponent implements OnInit {

  services: Servicee[] = [];
  filteredServices: Servicee[] = [];
  paginatedServices: Servicee[] = [];

  isModalOpen = false;
  isEditMode = false;
  currentService: Servicee = { id: 0, nomService: '' };

  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 5;

  isNightMode = false;

  constructor(private serviceService: ServiceService) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices() {
    this.serviceService.getAllService().subscribe({
      next: (services) => {
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

  filterServices() {
    const term = this.searchTerm.toLowerCase();
    this.filteredServices = this.services.filter(service =>
      service.nomService.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.updatePaginatedServices();
  }

  updatePaginatedServices() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedServices = this.filteredServices.slice(start, end);
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedServices();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedServices();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredServices.length / this.itemsPerPage);
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePaginatedServices();
  }

  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }

  openServiceModal() {
    this.isEditMode = false;
    this.currentService = { id: 0, nomService: '' };
    this.isModalOpen = true;
  }

  editService(service: Servicee) {
    this.isEditMode = true;
    this.currentService = { ...service };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveService() {
    if (this.isEditMode) {
      this.serviceService.updateService(this.currentService.id, this.currentService).subscribe({
        next: () => {
          this.loadServices();
          this.closeModal();
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
        },
        error: (err) => {
          console.error('Erreur lors de l\'ajout du service:', err);
          alert(`Erreur: ${err.message}`);
        }
      });
    }
  }

  deleteService(id: number) {
    if (confirm('Voulez-vous vraiment supprimer ce service ?')) {
      this.serviceService.deleteService(id).subscribe({
        next: () => {
          this.loadServices();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du service:', err);
          alert(`Erreur: ${err.message}`);
        }
      });
    }
  }
}