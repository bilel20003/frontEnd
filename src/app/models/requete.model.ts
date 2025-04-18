import { UserInfo } from "./user-info.model"; // à créer aussi si tu ne l'as pas

export interface Requete {
  id: number;
  type: 'DEMANDE_DE_TRAVAUX' | 'RECLAMATION' ; 
  objet: 'OBJET_1' | 'OBJET_2' | 'OBJET_3' ; 
  description: string;
  etat: 'NOUVEAU' | 'EN_COURS_DE_TRAITEMENT' | 'TRAITEE' | 'REFUSEE' | `BROUILLON`; 
  noteRetour?: string;
  date: Date;

  client?: UserInfo;
  guichetier?: UserInfo;
  technicien?: UserInfo;
}
