export interface Reclamation {
    id: number;
    titre: string;
    description: string;
    statut: 'En attente' | 'En cours' | 'Résolu';
    dateCreation: Date;
    utilisateurId: number;
  }
