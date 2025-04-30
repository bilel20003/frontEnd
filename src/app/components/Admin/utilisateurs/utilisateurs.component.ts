import { Component, OnInit } from '@angular/core';
import { UserInfoService, UserDisplay } from 'src/app/services/user-info.service';
import { ProduitService } from 'src/app/services/produit.service';
import { ServiceService } from 'src/app/services/service.service';
import { Servicee } from 'src/app/models/service.model';
import { Ministere } from 'src/app/models/ministere.model';
import { Produit } from 'src/app/models/produit.model';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';

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
    password: '',
    status: 'false'
  };
  generatedPassword: string | null = null;
  sortDirection: { [key: string]: boolean } = { id: false }; // Default to descending for id

  constructor(
    private userInfoService: UserInfoService,
    private produitService: ProduitService,
    private serviceService: ServiceService
  ) {}

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    forkJoin({
      utilisateurs: this.userInfoService.getAllUsers(),
      services: this.serviceService.getAllServices(),
      produits: this.produitService.getAllProduits()
    }).subscribe({
      next: ({ utilisateurs, services, produits }) => {
        console.log('Initial data loaded:', { utilisateurs, services, produits });
        this.utilisateurs = utilisateurs.filter(u => u.status !== 'archived'); // Exclude archived users
        this.filteredUtilisateurs = [...this.utilisateurs];
        // Sort by id in descending order
        this.filteredUtilisateurs.sort((a, b) => b.id - a.id);
        console.log('Sorted utilisateurs (descending by id):', this.filteredUtilisateurs);
        this.services = services;
        this.produits = produits;
        this.updatePagination();
        this.errorMessage = null;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des données initiales:', error);
        this.errorMessage = `Erreur réseau (statut ${error.status}): Impossible de charger les données.`;
        this.utilisateurs = [];
        this.filteredUtilisateurs = [];
        this.paginatedUtilisateurs = [];
        this.services = [];
        this.produits = [];
      }
    });
  }

  generateNewPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.utilisateurForm.password = password;
    this.generatedPassword = password;
    console.log('Generated new password:', password);
  }

  filterUtilisateurs() {
    console.log('filterUtilisateurs called, searchTerm:', this.searchTerm);
    const term = this.searchTerm.toLowerCase();
    this.filteredUtilisateurs = this.utilisateurs.filter(utilisateur =>
      utilisateur.nom.toLowerCase().includes(term) ||
      utilisateur.email.toLowerCase().includes(term) ||
      utilisateur.role.toLowerCase().includes(term) ||
      utilisateur.ministere.toLowerCase().includes(term) ||
      utilisateur.service.toLowerCase().includes(term) ||
      utilisateur.status.toLowerCase().includes(term)
    );
    console.log('filteredUtilisateurs:', this.filteredUtilisateurs);
    this.currentPage = 1;
    this.updatePagination();
  }

  sort(column: keyof UserDisplay): void {
    if (this.sortDirection[column] === undefined) {
      this.sortDirection[column] = column === 'id' ? false : true;
    } else {
      this.sortDirection[column] = !this.sortDirection[column];
    }
    const dir = this.sortDirection[column] ? 1 : -1;

    this.filteredUtilisateurs.sort((a, b) => {
      let valA: any = a[column] ?? '';
      let valB: any = b[column] ?? '';
      if (column === 'id') {
        valA = Number(a.id) || 0;
        valB = Number(b.id) || 0;
        return dir * (valA - valB);
      }
      const strA = valA.toString();
      const strB = valB.toString();
      return dir * strA.localeCompare(strB, 'fr', { numeric: true });
    });

    console.log(`Sorted by ${column}, direction: ${this.sortDirection[column] ? 'ascending' : 'descending'}`, this.filteredUtilisateurs);
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredUtilisateurs.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedUtilisateurs = this.filteredUtilisateurs.slice(start, start + this.itemsPerPage);
    console.log('updatePagination called, paginatedUtilisateurs:', this.paginatedUtilisateurs);
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
    console.log('openModal called, utilisateur:', utilisateur, 'produits:', this.produits, 'roleOptions:', this.getSortedRoleOptions());
    this.isModalOpen = true;
    this.errorMessage = null;
    this.generatedPassword = null;
    this.searchTerm = '';
    this.filterUtilisateurs();
    if (utilisateur) {
      this.editingUtilisateur = utilisateur;
      const service = this.services.find(s => s.nomService === utilisateur.service);
      const produit = this.produits.find(p => p.id === utilisateur.produitId);
      this.utilisateurForm = {
        ...utilisateur,
        serviceId: service ? service.id : utilisateur.serviceId,
        produitId: produit ? produit.id : utilisateur.produitId,
        password: '',
        status: utilisateur.status
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
        password: '',
        status: 'false'
      };
      console.log('Opening modal for add, utilisateurForm:', this.utilisateurForm);
    }
    this.updatePagination();
  }

  getSortedRoleOptions(): { value: string; label: string }[] {
    return [
      { value: 'CLIENT', label: 'Client' },
      { value: 'GUICHETIER', label: 'Guichetier' },
      { value: 'TECHNICIEN', label: 'Technicien' },
      { value: 'ADMIN', label: 'Admin' }
    ];
  }

  closeModal() {
    console.log('closeModal called');
    this.isModalOpen = false;
    this.editingUtilisateur = null;
    this.errorMessage = null;
    this.generatedPassword = null;
    this.utilisateurForm = {
      id: 0,
      nom: '',
      email: '',
      role: '',
      ministere: '',
      service: '',
      serviceId: undefined,
      produitId: undefined,
      password: '',
      status: 'false'
    };
    console.log('Modal closed, utilisateurForm reset:', this.utilisateurForm);
    this.updatePagination();
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
    if (!this.utilisateurForm.nom || !this.utilisateurForm.email || !this.utilisateurForm.role || !this.utilisateurForm.serviceId || !this.utilisateurForm.produitId) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires (Nom, Email, Rôle, Service, Produit).';
      console.error('Form validation failed:', this.utilisateurForm);
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
      serviceId: serviceId,
      status: this.utilisateurForm.status
    };
    this.userInfoService.addUser(userDisplay).subscribe({
      next: () => {
        console.log('Utilisateur ajouté avec succès');
        this.loadInitialData();
        this.closeModal();
        this.errorMessage = null;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
        this.errorMessage = `Erreur serveur (statut ${error.status}): ${error.message || 'Impossible d\'ajouter l\'utilisateur.'}`;
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
    const userDisplay: UserDisplay & { password?: string } = {
      id: this.utilisateurForm.id,
      nom: this.utilisateurForm.nom,
      email: this.utilisateurForm.email,
      role: this.utilisateurForm.role,
      ministere: service.ministere ? this.getMinistereName(service.ministere.id) : 'N/A',
      service: service.nomService || 'N/A',
      produitId: produitId,
      serviceId: serviceId,
      password: this.utilisateurForm.password,
      status: this.utilisateurForm.status
    };
    this.userInfoService.updateUser(this.utilisateurForm.id, userDisplay).subscribe({
      next: () => {
        console.log('Utilisateur mis à jour avec succès');
        this.loadInitialData();
        this.closeModal();
        this.errorMessage = null;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        this.errorMessage = `Erreur serveur (statut ${error.status}): ${error.message || 'Impossible de mettre à jour l\'utilisateur.'}`;
      }
    });
  }

  archiverUtilisateur(utilisateur: UserDisplay) {
    if (confirm('Voulez-vous vraiment archiver cet utilisateur ? Il ne sera plus visible dans la liste active.')) {
      this.userInfoService.archiveUser(utilisateur.id).subscribe({
        next: () => {
          console.log('Utilisateur archivé avec succès');
          this.loadInitialData();
          this.errorMessage = null;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur lors de l\'archivage de l\'utilisateur:', error);
          this.errorMessage = `Erreur serveur (statut ${error.status}): Impossible d\'archiver l\'utilisateur.`;
        }
      });
    }
  }

  toggleUserStatus(utilisateur: UserDisplay) {
    console.log('toggleUserStatus called for user:', utilisateur);
    this.userInfoService.toggleUserStatus(utilisateur.id).subscribe({
      next: () => {
        utilisateur.status = utilisateur.status === 'true' ? 'false' : 'true';
        console.log(`Statut de l'utilisateur ${utilisateur.id} basculé à ${utilisateur.status}`);
        this.updatePagination();
        this.errorMessage = null;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors de la bascule du statut:', error);
        this.errorMessage = `Erreur serveur (statut ${error.status}): Impossible de basculer le statut.`;
      }
    });
  }

  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }

  private getMinistereName(ministereId: number): string {
    return this.ministeres[ministereId]?.nomMinistere || 'N/A';
  }
}