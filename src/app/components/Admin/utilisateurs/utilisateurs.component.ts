import { Component, OnInit } from '@angular/core';
import { UserInfoService, UserDisplay } from 'src/app/services/user-info.service';
import { ProduitService } from 'src/app/services/produit.service';
import { ServiceService } from 'src/app/services/service.service';
import { Servicee } from 'src/app/models/service.model';
import { Ministere } from 'src/app/models/ministere.model';
import { Produit } from 'src/app/models/produit.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-utilisateurs',
  templateUrl: './utilisateurs.component.html',
  styleUrls: ['./utilisateurs.component.css']
})
export class UtilisateursComponent implements OnInit {
  utilisateurs: UserDisplay[] = [];
  filteredUtilisateurs: UserDisplay[] = [];
  paginatedUtilisateurs: UserDisplay[] = [];
  services: Servicee[] = [];
  produits: Produit[] = [];
  ministeres: { [key: number]: Ministere } = {};
  searchTerm: string = '';
  itemsPerPage: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  isNightMode: boolean = false;
  isModalOpen: boolean = false;
  editingUtilisateur: UserDisplay | null = null;
  errorMessage: string | null = null;
  utilisateurForm: UserDisplay & { serviceId?: number; produitId?: number; password?: string } = {
    id: 0,
    nom: '',
    email: '',
    role: '',
    ministere: '',
    service: '',
    serviceId: undefined,
    produitId: undefined,
    password: ''
  };

  constructor(
    private userInfoService: UserInfoService,
    private produitService: ProduitService,
    private serviceService: ServiceService
  ) {}

  ngOnInit() {
    this.loadUtilisateurs();
    this.loadServices();
    this.loadProduits();
  }

  loadUtilisateurs() {
    this.userInfoService.getAllUsers().subscribe({
      next: (data) => {
        console.log('Utilisateurs received:', data);
        this.utilisateurs = data;
        this.filteredUtilisateurs = [...this.utilisateurs];
        this.updatePagination();
        this.errorMessage = null;
      },
      error: (error: HttpErrorResponse | Error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.errorMessage = error instanceof HttpErrorResponse
          ? `Erreur réseau (statut ${error.status}): Impossible de charger les utilisateurs. Vérifiez votre connexion ou vos permissions.`
          : `Erreur client: ${error.message}. Les données des utilisateurs sont incomplètes ou mal formatées.`;
        this.utilisateurs = [];
        this.filteredUtilisateurs = [];
        this.paginatedUtilisateurs = [];
      }
    });
  }

  loadServices() {
    this.serviceService.getAllServices().subscribe({
      next: (services) => {
        this.services = services;
        console.log('Services loaded:', services);
        this.errorMessage = null;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des services:', error);
        this.errorMessage = 'Impossible de charger les services. Le sélecteur de services peut être vide.';
        this.services = [];
      }
    });
  }

  loadProduits() {
    this.produitService.getAllProduits().subscribe({
      next: (produits) => {
        this.produits = produits;
        console.log('Produits loaded:', produits);
        this.errorMessage = null;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des produits:', error);
        this.errorMessage = 'Impossible de charger les produits. Le sélecteur de produits peut être vide.';
        this.produits = [];
      }
    });
  }

  filterUtilisateurs() {
    const term = this.searchTerm.toLowerCase();
    this.filteredUtilisateurs = this.utilisateurs.filter(utilisateur =>
      utilisateur.nom.toLowerCase().includes(term) ||
      utilisateur.email.toLowerCase().includes(term) ||
      utilisateur.role.toLowerCase().includes(term) ||
      utilisateur.ministere.toLowerCase().includes(term) ||
      utilisateur.service.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredUtilisateurs.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedUtilisateurs = this.filteredUtilisateurs.slice(start, start + this.itemsPerPage);
  }

  onItemsPerPageChange(event: Event) {
    this.itemsPerPage = Number((event.target as HTMLSelectElement).value);
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updatePagination();
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

  openModal(utilisateur: UserDisplay | null = null) {
    this.isModalOpen = true;
    this.errorMessage = null;
    if (utilisateur) {
      this.editingUtilisateur = utilisateur;
      const service = this.services.find(s => s.nomService === utilisateur.service);
      this.utilisateurForm = {
        ...utilisateur,
        serviceId: service?.id,
        produitId: utilisateur.produitId,
        password: ''
      };
      console.log('Opening modal for edit, utilisateurForm:', this.utilisateurForm);
      this.updateServiceName();
    } else {
      this.editingUtilisateur = null;
      this.utilisateurForm = {
        id: 0,
        nom: '',
        email: '',
        role: '',
        ministere: '',
        service: '',
        serviceId: undefined,
        produitId: undefined,
        password: ''
      };
      console.log('Opening modal for add, utilisateurForm:', this.utilisateurForm);
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingUtilisateur = null;
    this.errorMessage = null;
    this.utilisateurForm = {
      id: 0,
      nom: '',
      email: '',
      role: '',
      ministere: '',
      service: '',
      serviceId: undefined,
      produitId: undefined,
      password: ''
    };
    console.log('Modal closed, utilisateurForm reset:', this.utilisateurForm);
  }

  updateServiceName() {
    const serviceId = Number(this.utilisateurForm.serviceId);
    const service = this.services.find(s => s.id === serviceId);
    this.utilisateurForm.service = service?.nomService || '';
    this.utilisateurForm.serviceId = serviceId;
    console.log('updateServiceName called, serviceId:', serviceId, 'service:', service, 'utilisateurForm:', this.utilisateurForm);
  }

  addUtilisateur() {
    console.log('addUtilisateur called, utilisateurForm:', this.utilisateurForm);
    if (!this.utilisateurForm.nom || !this.utilisateurForm.email || !this.utilisateurForm.role || !this.utilisateurForm.serviceId || !this.utilisateurForm.produitId || !this.utilisateurForm.password) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires (Nom, Email, Mot de passe, Rôle, Service, Produit).';
      console.error('Form validation failed:', this.utilisateurForm);
      return;
    }
    if (this.services.length === 0) {
      this.errorMessage = 'Aucun service disponible. Veuillez vérifier la connexion au serveur.';
      console.error('No services available:', this.services);
      return;
    }
    const serviceId = Number(this.utilisateurForm.serviceId);
    const service = this.services.find(s => s.id === serviceId);
    if (!service) {
      this.errorMessage = `Service avec ID ${serviceId} non trouvé dans la liste des services.`;
      console.error('Service not found, serviceId:', serviceId, 'services:', this.services);
      return;
    }
    const produitId = Number(this.utilisateurForm.produitId);
    const produit = this.produits.find(p => p.id === produitId);
    if (!produit) {
      this.errorMessage = `Produit avec ID ${produitId} non trouvé dans la liste des produits.`;
      console.error('Produit not found, produitId:', produitId, 'produits:', this.produits);
      return;
    }
    const validRoles = ['CLIENT', 'GUICHETIER', 'TECHNICIEN', 'ADMIN'];
    if (!validRoles.includes(this.utilisateurForm.role)) {
      this.errorMessage = 'Rôle sélectionné non valide.';
      console.error('Invalid role:', this.utilisateurForm.role);
      return;
    }
    const userDisplay: UserDisplay = {
      id: this.utilisateurForm.id,
      nom: this.utilisateurForm.nom,
      email: this.utilisateurForm.email,
      role: this.utilisateurForm.role,
      ministere: service.ministere ? this.getMinistereName(service.ministere.id) : 'N/A',
      service: service.nomService || 'N/A',
      password: this.utilisateurForm.password,
      produitId: produitId,
      serviceId: serviceId
    };
    console.log('Submitting userDisplay:', userDisplay);
    this.userInfoService.addUser(userDisplay).subscribe({
      next: () => {
        console.log('Utilisateur ajouté avec succès');
        this.loadUtilisateurs();
        this.closeModal();
        this.errorMessage = null;
      },
      error: (error: HttpErrorResponse | Error) => {
        console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
        this.errorMessage = error instanceof HttpErrorResponse
          ? `Erreur serveur (statut ${error.status}): ${error.message || 'Impossible d\'ajouter l\'utilisateur. Vérifiez les logs du serveur, assurez-vous que l\'email est unique et que les IDs sont valides.'}`
          : `Erreur client: ${error.message}`;
      }
    });
  }

  updateUtilisateur() {
    console.log('updateUtilisateur called, utilisateurForm:', this.utilisateurForm);
    if (!this.utilisateurForm.id || !this.utilisateurForm.nom || !this.utilisateurForm.email || !this.utilisateurForm.role || !this.utilisateurForm.serviceId || !this.utilisateurForm.produitId) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires (ID, Nom, Email, Rôle, Service, Produit).';
      console.error('Form validation failed:', this.utilisateurForm);
      return;
    }
    if (this.services.length === 0) {
      this.errorMessage = 'Aucun service disponible. Veuillez vérifier la connexion au serveur.';
      console.error('No services available:', this.services);
      return;
    }
    const serviceId = Number(this.utilisateurForm.serviceId);
    const service = this.services.find(s => s.id === serviceId);
    if (!service) {
      this.errorMessage = `Service avec ID ${serviceId} non trouvé dans la liste des services.`;
      console.error('Service not found, serviceId:', serviceId, 'services:', this.services);
      return;
    }
    const produitId = Number(this.utilisateurForm.produitId);
    const produit = this.produits.find(p => p.id === produitId);
    if (!produit) {
      this.errorMessage = `Produit avec ID ${produitId} non trouvé dans la liste des produits.`;
      console.error('Produit not found, produitId:', produitId, 'produits:', this.produits);
      return;
    }
    const validRoles = ['CLIENT', 'GUICHETIER', 'TECHNICIEN', 'ADMIN'];
    if (!validRoles.includes(this.utilisateurForm.role)) {
      this.errorMessage = 'Rôle sélectionné non valide.';
      console.error('Invalid role:', this.utilisateurForm.role);
      return;
    }
    const userDisplay: UserDisplay = {
      id: this.utilisateurForm.id,
      nom: this.utilisateurForm.nom,
      email: this.utilisateurForm.email,
      role: this.utilisateurForm.role,
      ministere: service.ministere ? this.getMinistereName(service.ministere.id) : 'N/A',
      service: service.nomService || 'N/A',
      produitId: produitId,
      serviceId: serviceId
    };
    console.log('Submitting userDisplay for update:', userDisplay);
    this.userInfoService.updateUser(this.utilisateurForm.id, userDisplay).subscribe({
      next: () => {
        console.log('Utilisateur mis à jour avec succès');
        this.loadUtilisateurs();
        this.closeModal();
        this.errorMessage = null;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        this.errorMessage = `Erreur serveur (statut ${error.status}): ${error.message || 'Impossible de mettre à jour l\'utilisateur. Vérifiez les logs du serveur.'}`;
      }
    });
  }

  supprimerUtilisateur(utilisateur: UserDisplay) {
    if (confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      this.userInfoService.deleteUser(utilisateur.id).subscribe({
        next: () => {
          console.log('Utilisateur supprimé avec succès');
          this.loadUtilisateurs();
          this.errorMessage = null;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur lors de la suppression de l\'utilisateur:', error);
          this.errorMessage = `Erreur serveur (statut ${error.status}): Impossible de supprimer l\'utilisateur. Cet utilisateur peut ne pas être supprimable.`;
        }
      });
    }
  }

  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }

  private getMinistereName(ministereId: number): string {
    return this.ministeres[ministereId]?.nomMinistere || 'N/A';
  }
}