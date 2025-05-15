import { Component, OnInit } from '@angular/core';
import { UserInfoService, UserDisplay } from 'src/app/services/user-info.service';
import { ProduitService } from 'src/app/services/produit.service';
import { ServiceService } from 'src/app/services/service.service';
import { AuthService } from 'src/app/services/auth.service';
import { Servicee } from 'src/app/models/service.model';
import { Ministere } from 'src/app/models/ministere.model';
import { Produit } from 'src/app/models/produit.model';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup, FormControl, Validators } from '@angular/forms';

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
  isDetailModalOpen: boolean = false;
  editingUtilisateur: UserDisplay | null = null;
  selectedUtilisateur: UserDisplay | null = null;
  utilisateurForm: FormGroup;
  sortDirection: { [key: string]: boolean } = { id: false };

  constructor(
    private userInfoService: UserInfoService,
    private produitService: ProduitService,
    private serviceService: ServiceService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.utilisateurForm = new FormGroup({
      id: new FormControl(0),
      nom: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      role: new FormControl('', [Validators.required]),
      ministere: new FormControl(''),
      service: new FormControl(''),
      serviceId: new FormControl(undefined, [Validators.required]),
      produitId: new FormControl(undefined, [Validators.required]),
      password: new FormControl(''),
      status: new FormControl('false')
    });
  }

  ngOnInit() {
    const storedMode = localStorage.getItem('mode');
    if (storedMode === 'night') {
      this.isNightMode = true;
      document.body.classList.add('night-mode');
    }
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
        this.utilisateurs = utilisateurs.filter(u => u.status !== 'archived');
        this.filteredUtilisateurs = [...this.utilisateurs];
        this.filteredUtilisateurs.sort((a, b) => b.id - a.id);
        console.log('Sorted utilisateurs (descending by id):', this.filteredUtilisateurs);
        this.services = services;
        this.produits = produits;
        console.log('Loaded produits:', this.produits);
        this.updatePagination();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des données initiales:', error);
        this.showError(`Erreur réseau (statut ${error.status}): Impossible de charger les données.`);
        this.utilisateurs = [];
        this.filteredUtilisateurs = [];
        this.paginatedUtilisateurs = [];
        this.services = [];
        this.produits = [];
      }
    });
  }

  generateNewPassword() {
    const email = this.utilisateurForm.get('email')?.value;
    if (!email) {
      this.showError('L\'email de l\'utilisateur est requis pour générer un lien de réinitialisation.');
      return;
    }
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.showSuccess('Un lien de réinitialisation de mot de passe a été envoyé à l\'utilisateur.');
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors de l\'envoi du lien de réinitialisation:', error);
        this.showError(`Erreur lors de l'envoi du lien de réinitialisation: ${error.message || 'Erreur inconnue.'}`);
      }
    });
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
    this.searchTerm = '';
    this.filterUtilisateurs();

    if (utilisateur) {
      this.editingUtilisateur = utilisateur;
      const service = this.services.find(s => s.nomService === utilisateur.service);

      // If produitId is undefined, fetch the user details from the backend
      if (!utilisateur.produitId) {
        console.warn(`ProduitId is undefined for user ID ${utilisateur.id}, fetching user details from backend...`);
        this.userInfoService.getUserById(utilisateur.id).subscribe({
          next: (userInfo) => {
            const fetchedProduitId = userInfo.produit && typeof userInfo.produit === 'object' && 'id' in userInfo.produit && userInfo.produit.id != null ? userInfo.produit.id : 1; // Default to 1 ('Any')
            console.log(`Fetched produitId for user ID ${utilisateur.id}:`, fetchedProduitId);

            this.utilisateurForm.patchValue({
              id: utilisateur.id,
              nom: utilisateur.nom,
              email: utilisateur.email,
              role: utilisateur.role,
              ministere: utilisateur.ministere,
              service: utilisateur.service,
              serviceId: service ? service.id : (this.services.length > 0 ? this.services[0].id : undefined),
              produitId: fetchedProduitId,
              password: '',
              status: utilisateur.status
            });
            console.log('Opening modal for edit, utilisateurForm:', this.utilisateurForm.value);
            this.updateServiceName();
          },
          error: (error: HttpErrorResponse) => {
            console.error(`Failed to fetch user ID ${utilisateur.id}:`, error);
            this.showError(`Erreur lors de la récupération des détails de l'utilisateur: ${error.message}`);
            // Fallback to default 'Any' product (id: 1)
            this.utilisateurForm.patchValue({
              id: utilisateur.id,
              nom: utilisateur.nom,
              email: utilisateur.email,
              role: utilisateur.role,
              ministere: utilisateur.ministere,
              service: utilisateur.service,
              serviceId: service ? service.id : (this.services.length > 0 ? this.services[0].id : undefined),
              produitId: 1, // Default to 'Any'
              password: '',
              status: utilisateur.status
            });
            console.log('Opening modal for edit (fallback), utilisateurForm:', this.utilisateurForm.value);
            this.updateServiceName();
          }
        });
      } else {
        this.utilisateurForm.patchValue({
          id: utilisateur.id,
          nom: utilisateur.nom,
          email: utilisateur.email,
          role: utilisateur.role,
          ministere: utilisateur.ministere,
          service: utilisateur.service,
          serviceId: service ? service.id : (this.services.length > 0 ? this.services[0].id : undefined),
          produitId: utilisateur.produitId,
          password: '',
          status: utilisateur.status
        });
        console.log('Opening modal for edit, utilisateurForm:', this.utilisateurForm.value);
        this.updateServiceName();
      }
    } else {
      this.editingUtilisateur = null;
      this.utilisateurForm.patchValue({
        id: 0,
        nom: '',
        email: '',
        role: '',
        ministere: '',
        service: '',
        serviceId: this.services.length > 0 ? this.services[0].id : undefined,
        produitId: this.produits.length > 0 ? this.produits[0].id : undefined,
        password: '',
        status: 'false'
      });
      console.log('Opening modal for add, utilisateurForm:', this.utilisateurForm.value);
    }
    this.updatePagination();
  }

  openDetailModal(utilisateur: UserDisplay) {
    console.log('openDetailModal called, utilisateur:', utilisateur);
    this.selectedUtilisateur = utilisateur;
    this.isDetailModalOpen = true;
  }

  closeDetailModal() {
    console.log('closeDetailModal called');
    this.isDetailModalOpen = false;
    this.selectedUtilisateur = null;
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
    this.utilisateurForm.reset({
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
    });
    console.log('Modal closed, utilisateurForm reset:', this.utilisateurForm.value);
    this.updatePagination();
  }

  updateServiceName() {
    const serviceId = Number(this.utilisateurForm.get('serviceId')?.value);
    const service = this.services.find(s => s.id === serviceId);
    this.utilisateurForm.patchValue({ service: service?.nomService || '' });
    this.utilisateurForm.get('serviceId')?.setValue(serviceId);
    console.log('updateServiceName called, serviceId:', serviceId, 'service:', service, 'utilisateurForm:', this.utilisateurForm.value);
  }

  addUtilisateur() {
    console.log('addUtilisateur called, utilisateurForm:', this.utilisateurForm.value);
    if (this.utilisateurForm.invalid) {
      if (this.utilisateurForm.get('email')?.errors?.['email']) {
        this.showError('Veuillez entrer un email valide (ex: exemple@domaine.com).');
      } else if (this.utilisateurForm.get('email')?.errors?.['required'] || !this.utilisateurForm.get('nom')?.value || !this.utilisateurForm.get('role')?.value || !this.utilisateurForm.get('serviceId')?.value || !this.utilisateurForm.get('produitId')?.value) {
        this.showError('Veuillez remplir tous les champs obligatoires (Nom, Email, Rôle, Service, Produit).');
      }
      console.error('Form validation failed:', this.utilisateurForm.errors);
      return;
    }
    const serviceId = Number(this.utilisateurForm.get('serviceId')?.value);
    const service = this.services.find(s => s.id === serviceId);
    if (!service) {
      this.showError(`Service avec ID ${serviceId} non trouvé dans la liste des services.`);
      console.error('Service not found, serviceId:', serviceId, 'services:', this.services);
      return;
    }
    const produitId = Number(this.utilisateurForm.get('produitId')?.value);
    const produit = this.produits.find(p => p.id === produitId);
    if (!produit) {
      this.showError(`Produit avec ID ${produitId} non trouvé dans la liste des produits.`);
      console.error('Produit not found, produitId:', produitId, 'produits:', this.produits);
      return;
    }
    const validRoles = ['CLIENT', 'GUICHETIER', 'TECHNICIEN', 'ADMIN'];
    if (!validRoles.includes(this.utilisateurForm.get('role')?.value)) {
      this.showError('Rôle sélectionné non valide.');
      console.error('Invalid role:', this.utilisateurForm.get('role')?.value);
      return;
    }
    const userDisplay: UserDisplay = {
      id: this.utilisateurForm.get('id')?.value,
      nom: this.utilisateurForm.get('nom')?.value,
      email: this.utilisateurForm.get('email')?.value,
      role: this.utilisateurForm.get('role')?.value,
      ministere: service.ministere ? this.getMinistereName(service.ministere.id) : 'N/A',
      service: service.nomService || 'N/A',
      produitId: produitId,
      produitNom: produit.nom,
      serviceId: serviceId,
      status: this.utilisateurForm.get('status')?.value
    };
    this.userInfoService.addUser(userDisplay).subscribe({
      next: () => {
        console.log('Utilisateur ajouté avec succès');
        this.authService.sendWelcomeEmail(userDisplay.email).subscribe({
          next: () => {
            this.showSuccess('Utilisateur ajouté avec succès ! Un email de bienvenue avec un lien pour définir le mot de passe a été envoyé à l\'utilisateur.');
          },
          error: (error: HttpErrorResponse) => {
            console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
            this.showError(`Utilisateur ajouté, mais erreur lors de l'envoi de l\'email de bienvenue: ${error.message || 'Erreur inconnue.'}`);
          }
        });
        this.loadInitialData();
        this.closeModal();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
        this.showError(`Erreur serveur (statut ${error.status}): ${error.message || 'Impossible d\'ajouter l\'utilisateur.'}`);
      }
    });
  }

  updateUtilisateur() {
    console.log('updateUtilisateur called, utilisateurForm:', this.utilisateurForm.value);
    if (this.utilisateurForm.invalid) {
      if (this.utilisateurForm.get('email')?.errors?.['email']) {
        this.showError('Veuillez entrer un email valide (ex: exemple@domaine.com).');
      } else if (this.utilisateurForm.get('email')?.errors?.['required'] || !this.utilisateurForm.get('nom')?.value || !this.utilisateurForm.get('role')?.value || !this.utilisateurForm.get('serviceId')?.value || !this.utilisateurForm.get('produitId')?.value) {
        this.showError('Veuillez remplir tous les champs obligatoires (ID, Nom, Email, Rôle, Service, Produit).');
      }
      console.error('Form validation failed:', this.utilisateurForm.errors);
      return;
    }
    const serviceId = Number(this.utilisateurForm.get('serviceId')?.value);
    const service = this.services.find(s => s.id === serviceId);
    if (!service) {
      this.showError(`Service avec ID ${serviceId} non trouvé dans la liste des services.`);
      console.error('Service not found, serviceId:', serviceId, 'services:', this.services);
      return;
    }
    const produitId = Number(this.utilisateurForm.get('produitId')?.value);
    const produit = this.produits.find(p => p.id === produitId);
    if (!produit) {
      this.showError(`Produit avec ID ${produitId} non trouvé dans la liste des produits.`);
      console.error('Produit not found, produitId:', produitId, 'produits:', this.produits);
      return;
    }
    const validRoles = ['CLIENT', 'GUICHETIER', 'TECHNICIEN', 'ADMIN'];
    if (!validRoles.includes(this.utilisateurForm.get('role')?.value)) {
      this.showError('Rôle sélectionné non valide.');
      console.error('Invalid role:', this.utilisateurForm.get('role')?.value);
      return;
    }
    const userDisplay: UserDisplay & { password?: string } = {
      id: this.utilisateurForm.get('id')?.value,
      nom: this.utilisateurForm.get('nom')?.value,
      email: this.utilisateurForm.get('email')?.value,
      role: this.utilisateurForm.get('role')?.value,
      ministere: service.ministere ? this.getMinistereName(service.ministere.id) : 'N/A',
      service: service.nomService || 'N/A',
      produitId: produitId,
      produitNom: produit.nom,
      serviceId: serviceId,
      password: this.utilisateurForm.get('password')?.value,
      status: this.utilisateurForm.get('status')?.value
    };
    this.userInfoService.updateUser(this.utilisateurForm.get('id')?.value, userDisplay).subscribe({
      next: () => {
        console.log('Utilisateur mis à jour avec succès');
        this.loadInitialData();
        this.closeModal();
        this.showSuccess('Utilisateur mis à jour avec succès !');
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        this.showError(`Erreur serveur (statut ${error.status}): ${error.message || 'Impossible de mettre à jour l\'utilisateur.'}`);
      }
    });
  }

  archiverUtilisateur(utilisateur: UserDisplay) {
    this.snackBar.open('Voulez-vous vraiment archiver cet utilisateur ? Il ne sera plus visible dans la liste active.', 'Confirmer', {
      duration: 10000,
      panelClass: ['custom-warning-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    }).onAction().subscribe(() => {
      this.userInfoService.archiveUser(utilisateur.id).subscribe({
        next: () => {
          console.log('Utilisateur archivé avec succès');
          this.loadInitialData();
          this.showSuccess('Utilisateur archivé avec succès !');
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur lors de l\'archivage de l\'utilisateur:', error);
          this.showError(`Erreur serveur (statut ${error.status}): Impossible d\'archiver l\'utilisateur.`);
        }
      });
    });
  }

  toggleUserStatus(utilisateur: UserDisplay) {
    console.log('toggleUserStatus called for user:', utilisateur);
    this.userInfoService.toggleUserStatus(utilisateur.id).subscribe({
      next: () => {
        utilisateur.status = utilisateur.status === 'true' ? 'false' : 'true';
        console.log(`Statut de l'utilisateur ${utilisateur.id} basculé à ${utilisateur.status}`);
        this.updatePagination();
        this.showSuccess(`Statut de l'utilisateur ${utilisateur.nom} mis à jour avec succès !`);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors de la bascule du statut:', error);
        this.showError(`Erreur serveur (statut ${error.status}): Impossible de basculer le statut.`);
      }
    });
  }

  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
    localStorage.setItem('mode', this.isNightMode ? 'night' : 'day');
  }

  private getMinistereName(ministereId: number): string {
    return this.ministeres[ministereId]?.nomMinistere || 'N/A';
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 10000,
      panelClass: ['custom-success-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 10000,
      panelClass: ['custom-error-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }
}