import { Injectable } from '@angular/core';

export interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  role: string;
  ministere: string;
  service: string;
}

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {
  private utilisateurs: Utilisateur[] = [
    { id: 1, nom: 'Utilisateur A', email: 'utilisateurA@example.com', role: 'Admin', ministere: 'Ministère A', service: 'Service A' },
    { id: 2, nom: 'Utilisateur B', email: 'utilisateurB@example.com', role: 'Technicien', ministere: 'Ministère B', service: 'Service B' },
    { id: 3, nom: 'Utilisateur C', email: 'utilisateurC@example.com', role: 'Guichetier', ministere: 'Ministère C', service: 'Service C' },
    { id: 4, nom: 'Utilisateur D', email: 'utilisateurD@example.com', role: 'Client', ministere: 'Ministère D', service: 'Service D' }
  ];

  constructor() {}

  getUtilisateurs(): Utilisateur[] {
    return [...this.utilisateurs]; // pour éviter la mutation directe
  }

  addUtilisateur(utilisateur: Omit<Utilisateur, 'id'>): void {
    const newUtilisateur: Utilisateur = {
      id: this.utilisateurs.length > 0 ? this.utilisateurs[this.utilisateurs.length - 1].id + 1 : 1,
      ...utilisateur
    };
    this.utilisateurs.push(newUtilisateur);
  }

  updateUtilisateur(id: number, updatedUtilisateur: Partial<Utilisateur>): void {
    const index = this.utilisateurs.findIndex(utilisateur => utilisateur.id === id);
    if (index !== -1) {
      this.utilisateurs[index] = { ...this.utilisateurs[index], ...updatedUtilisateur };
    }
  }

  deleteUtilisateur(id: number): void {
    this.utilisateurs = this.utilisateurs.filter(utilisateur => utilisateur.id !== id);
  }
}
