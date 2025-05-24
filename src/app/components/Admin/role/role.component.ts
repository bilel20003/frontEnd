import { Component, OnInit } from '@angular/core';
import { RoleService } from 'src/app/services/role.service';
import { Role } from 'src/app/models/role.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.css']
})
export class GererRoleComponent implements OnInit {

  roles: Role[] = [];
  filteredRoles: Role[] = [];
  paginatedRoles: Role[] = [];
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 5;
  isNightMode = false;
  showModal = false;
  modalTitle = '';
  modalButtonText = '';
  roleName = '';
  currentRole: Role | null = null;

  constructor(private roleService: RoleService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.fetchRoles();
  }

  fetchRoles() {
    this.roleService.getAllRoles().subscribe(data => {
      this.roles = data;
      this.filterRoles();
    });
  }

  filterRoles() {
    const term = this.searchTerm.toLowerCase();
    this.filteredRoles = this.roles.filter(role =>
      role.name.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.updatePaginatedRoles();
  }

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

  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }

  openModal(action: string, role: Role) {
    this.showModal = true;
    this.modalTitle = `Modifier le rôle: ${role.name}`;
    this.modalButtonText = 'Modifier';
    this.roleName = role.name;
    this.currentRole = { ...role };
  }

  closeModal() {
    this.showModal = false;
  }

  saveRole() {
    if (this.currentRole) {
      this.currentRole.name = this.roleName;
      this.roleService.updateRole(this.currentRole).subscribe({
        next: () => {
          this.fetchRoles();
          this.closeModal();
          this.snackBar.open('Rôle mis à jour avec succès!', 'Fermer', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          this.snackBar.open('Erreur lors de la mise à jour du rôle.', 'Fermer', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          console.error('Erreur lors de la mise à jour:', error);
        }
      });
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

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updatePaginatedRoles();
    }
  }

  // Method to get badge class based on role ID
  getRoleBadgeClass(roleId: number): string {
    const badgeMap: { [key: number]: string } = {
      1: 'role-admin',    // Assuming ID 1 is for ADMIN
      2: 'role-client',   // Assuming ID 2 is for CLIENT
      3: 'role-guichetier', // Assuming ID 3 is for GUICHETIER
      4: 'role-technicien',  // Assuming ID 4 is for TECHNICIEN
      5: 'role-daca'
    };
    return badgeMap[roleId] || 'role-client'; // Default to 'role-client' if ID not found
  }
}