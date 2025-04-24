import { Component, OnInit } from '@angular/core';
import { RoleService } from 'src/app/services/role.service';
import { Role } from 'src/app/models/role.model';

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

  constructor(private roleService: RoleService) {}

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
      this.roleService.updateRole(this.currentRole).subscribe(() => {
        this.fetchRoles(); // Recharger après modification
        this.closeModal();
      });
    }
  }
}