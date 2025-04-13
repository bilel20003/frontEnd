import { Component } from '@angular/core';

interface ServiceModel {
  id_service: number;
  nom_service: string;
}

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.css']
})
export class ServiceComponent {

  // Liste de tous les services
  services: ServiceModel[] = [
    { id_service: 1, nom_service: 'Informatique' },
    { id_service: 2, nom_service: 'Ressources Humaines' },
    { id_service: 3, nom_service: 'Logistique' },
    { id_service: 4, nom_service: 'Comptabilité' },
    { id_service: 5, nom_service: 'Affaires Juridiques' },
    { id_service: 6, nom_service: 'Communication' },
  ];

  // Variables pour la modale
  isModalOpen = false;
  isEditMode = false;
  currentService: ServiceModel = { id_service: 0, nom_service: '' };

  // Recherche
  searchTerm = '';
  filteredServices: ServiceModel[] = [...this.services];

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  paginatedServices: ServiceModel[] = [];

  // Mode nuit
  isNightMode = false;

  constructor() {
    this.updatePaginatedServices();
  }

  // Filtrer les services
  filterServices() {
    const term = this.searchTerm.toLowerCase();
    this.filteredServices = this.services.filter(service =>
      service.nom_service.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.updatePaginatedServices();
  }

  // Met à jour les services paginés
  updatePaginatedServices() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedServices = this.filteredServices.slice(start, end);
  }

  // Aller à la page précédente
  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedServices();
    }
  }

  // Aller à la page suivante
  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedServices();
    }
  }

  // Nombre total de pages
  get totalPages(): number {
    return Math.ceil(this.filteredServices.length / this.itemsPerPage);
  }

  // Changer le nombre d'éléments par page
  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePaginatedServices();
  }

  // Fonction mode nuit
  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }

  // Ouvrir la modale pour ajouter un service
  openServiceModal() {
    this.isEditMode = false; // On est en mode ajout
    this.currentService = { id_service: 0, nom_service: '' }; // Réinitialiser les champs
    this.isModalOpen = true;
  }

  // Ouvrir la modale pour éditer un service
  editService(service: ServiceModel) {
    this.isEditMode = true;
    this.currentService = { ...service };
    this.isModalOpen = true;
  }

  // Fermer la modale
  closeModal() {
    this.isModalOpen = false;
  }

  // Sauvegarder un service
  saveService() {
    if (this.isEditMode) {
      // Modifier le service
      const index = this.services.findIndex(service => service.id_service === this.currentService.id_service);
      if (index !== -1) {
        this.services[index] = this.currentService;
      }
    } else {
      // Ajouter un service
      const newService = { ...this.currentService, id_service: this.services.length + 1 };
      this.services.push(newService);
    }
    this.filterServices(); // Mettre à jour après l'ajout ou la modification
    this.closeModal(); // Fermer la modale
  }

  // Supprimer un service
  deleteService(id_service: number) {
    if (confirm('Voulez-vous vraiment supprimer ce service ?')) {
      this.services = this.services.filter(s => s.id_service !== id_service);
      this.filterServices(); // Mettre à jour la liste après suppression
    }
  }
}
