import { Injectable } from '@angular/core';

export interface Rendezvous {
  id: number; // ID du rendez-vous
  client: {
    nom: string; // Nom du client
    prenom: string; // Prénom du client
  };
  dateEnvoi: Date; // Date d'envoi du rendez-vous
  typeProbleme: string; // Type de problème
  description: string; // Description du problème
  etat: string; // État du rendez-vous (En attente, Confirmé, Annulé)
}

@Injectable({
  providedIn: 'root'
})
export class RendezvousService {
  private rendezvous: Rendezvous[] = [
    { id: 1, client: { nom: 'Dupont', prenom: 'Jean' }, dateEnvoi: new Date('2023-10-01'), typeProbleme: 'Problème de connexion', description: 'Difficulté à se connecter au réseau', etat: 'En attente' },
    { id: 2, client: { nom: 'Martin', prenom: 'Sophie' }, dateEnvoi: new Date('2023-10-02'), typeProbleme: 'Erreur de serveur', description: 'Le serveur ne répond pas', etat: 'Confirmé' },
    { id: 3, client: { nom: 'Bernard', prenom: 'Luc' }, dateEnvoi: new Date('2023-10-03'), typeProbleme: 'Problème de facturation', description: 'Erreur dans la facturation', etat: 'Annulé' },
    { id: 4, client: { nom: 'Leroy', prenom: 'Marie' }, dateEnvoi: new Date('2023-10-04'), typeProbleme: 'Problème de performance', description: 'L\'application est lente', etat: 'En attente' }
  ];

  constructor() {}

  // Récupérer tous les rendez-vous
  getRendezvous(): Rendezvous[] {
    return [...this.rendezvous]; // Retourne une copie pour éviter la mutation directe
  }

  // Ajouter un nouveau rendez-vous
  addRendezvous(rendezvous: Omit<Rendezvous, 'id' | 'dateEnvoi'>): void {
    const newRendezvous: Rendezvous = {
      id: this.rendezvous.length + 1, // Générer un ID unique
      dateEnvoi: new Date(), // Date d'envoi est la date actuelle
      ...rendezvous
    };
    this.rendezvous.push(newRendezvous);
  }

  // Mettre à jour un rendez-vous existant
  updateRendezvous(index: number, updatedRendezvous: Partial<Rendezvous>): void {
    if (index >= 0 && index < this.rendezvous.length) {
      this.rendezvous[index] = { ...this.rendezvous[index], ...updatedRendezvous };
    }
  }

  // Supprimer un rendez-vous
  deleteRendezvous(index: number): void {
    if (index >= 0 && index < this.rendezvous.length) {
      this.rendezvous.splice(index, 1);
    }
  }
}