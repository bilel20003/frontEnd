import { Component } from '@angular/core';

interface Role {
  id_role: number;
  name: string;
}

@Component({
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.css']
})
export class GererRoleComponent {

  // Liste des rôles (remplacer par une API réelle)
  roles: Role[] = [
    { id_role: 1, name: 'Administrateur' },
    { id_role: 2, name: 'Utilisateur' },
    { id_role: 3, name: 'Manager' },
    { id_role: 4, name: 'Technicien' },
    { id_role: 5, name: 'Superviseur' },
    { id_role: 6, name: 'Guest' },
  ];

  // Recherche et pagination
  searchTerm = '';
  filteredRoles: Role[] = [...this.roles];
  paginatedRoles: Role[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;

  // Mode nuit
  isNightMode = false;

  // Modal
  showModal = false;
  modalTitle = '';
  modalButtonText = '';
  roleName = '';
  currentRole: Role | null = null;

  constructor() {
    this.updatePaginatedRoles();
  }

  // Recherche
  filterRoles() {
    const term = this.searchTerm.toLowerCase();
    this.filteredRoles = this.roles.filter(role =>
      role.name.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.updatePaginatedRoles();
  }

  // Pagination
  get totalPages(): number {
    return Math.ceil(this.filteredRoles.length / this.itemsPerPage);
  }

  updatePaginatedRoles() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedRoles = this.filteredRoles.slice(start, end);
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedRoles();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedRoles();
    }
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePaginatedRoles();
  }

  // Mode nuit
  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }

  // Actions CRUD
  openModal(action: string, role?: Role) {
    this.showModal = true;
    if (action === 'add') {
      this.modalTitle = 'Ajouter un Rôle';
      this.modalButtonText = 'Ajouter';
      this.roleName = '';
      this.currentRole = null;
    } else if (action === 'edit' && role) {
      this.modalTitle = `Modifier le rôle: ${role.name}`;
      this.modalButtonText = 'Modifier';
      this.roleName = role.name;
      this.currentRole = role;
    }
  }

  closeModal() {
    this.showModal = false;
  }

  saveRole() {
    if (this.currentRole) {
      // Mise à jour du rôle
      this.currentRole.name = this.roleName;
    } else {
      // Ajout d'un nouveau rôle
      const newId = this.roles.length + 1;
      this.roles.push({ id_role: newId, name: this.roleName });
    }

    this.closeModal();
    this.filterRoles(); // Mise à jour après ajout/modification
  }

  deleteRole(id_role: number) {
    if (confirm('Voulez-vous vraiment supprimer ce rôle ?')) {
      this.roles = this.roles.filter(r => r.id_role !== id_role);
      this.filterRoles(); // Mise à jour après suppression
    }
  }
}
