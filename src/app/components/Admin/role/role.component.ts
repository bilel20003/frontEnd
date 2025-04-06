import { Component, OnInit } from '@angular/core';
import { RoleService, Role } from 'src/app/services/role.service';

@Component({
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.css']
})
export class GererRoleComponent implements OnInit {
  roles: Role[] = [];
  newRole: Role = { id: 0, name: '', description: '' };
  editingRole: Role | null = null;
  searchTerm: string = '';
  itemsPerPage = 5;
  currentPage = 1;
  totalPages = 1;
  paginatedRoles: Role[] = [];
  isNightMode = false;

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }

  loadRoles() {
    this.roles = this.roleService.getRoles();
    this.paginateRoles();
  }

  paginateRoles() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedRoles = this.roles.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.roles.length / this.itemsPerPage);
  }

  addRole() {
    if (this.newRole.name && this.newRole.description) {
      this.roleService.addRole(this.newRole);
      this.loadRoles();
      this.newRole = { id: 0, name: '', description: '' };
    }
  }

  editRole(role: Role) {
    this.editingRole = { ...role };
  }

  updateRole() {
    if (this.editingRole) {
      this.roleService.updateRole(this.editingRole.id, this.editingRole);
      this.loadRoles();
      this.editingRole = null;
    }
  }

  deleteRole(id: number) {
    if (confirm('Confirmer la suppression de ce rôle ?')) {
      this.roleService.deleteRole(id);
      this.loadRoles();
    }
  }

  filterRoles() {
    if (this.searchTerm) {
      this.paginatedRoles = this.roles.filter(r =>
        r.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.paginateRoles();
    }
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateRoles();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateRoles();
    }
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.paginateRoles();
  }
}
