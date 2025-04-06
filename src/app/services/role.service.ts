import { Injectable } from '@angular/core';

export interface Role {
  id: number;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private roles: Role[] = [
    { id: 1, name: 'Admin', description: 'Accès total à l’application' },
    { id: 2, name: 'Technicien', description: 'Gère les réclamations techniques' },
    { id: 3, name: 'Guichetier', description: 'Interagit avec les clients' },
    { id: 4, name: 'Client', description: 'Soumet des réclamations' }
  ];

  private nextId: number = this.roles.length + 1;

  constructor() {}

  getRoles(): Role[] {
    return [...this.roles];
  }

  addRole(role: Role): void {
    role.id = this.nextId++;
    this.roles.push({ ...role });
  }

  updateRole(id: number, updatedRole: Role): void {
    const index = this.roles.findIndex(r => r.id === id);
    if (index !== -1) {
      this.roles[index] = { ...updatedRole };
    }
  }

  deleteRole(id: number): void {
    this.roles = this.roles.filter(r => r.id !== id);
  }
}
