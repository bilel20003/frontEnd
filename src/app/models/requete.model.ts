import { UserInfo } from "./user-info.model"; // Assurez-vous que ce modèle existe

export interface Requete {
  id: number;
  type: 'DEMANDE_DE_TRAVAUX' | 'RECLAMATION'; // Retirer String
  objet: 'OBJET_1' | 'OBJET_2' | 'OBJET_3'; // Retirer String
  description: string;
  etat: 'NOUVEAU' | 'EN_COURS_DE_TRAITEMENT' | 'TRAITEE' | 'REFUSEE' | 'BROUILLON'; // Retirer String
  noteRetour?: string;
  date: Date;

  client?: { id: number };
  guichetier?: { id: number };
  technicien?: { id: number };
}