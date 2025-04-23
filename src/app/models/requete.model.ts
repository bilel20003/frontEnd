import { Produit } from "./produit.model";

export interface Requete {
  id: number;
  type: 'DEMANDE_DE_TRAVAUX' | 'RECLAMATION';
  objet: 'OBJET_1' | 'OBJET_2' | 'OBJET_3';
  description: string;
  etat: 'NOUVEAU' | 'EN_COURS_DE_TRAITEMENT' | 'TRAITEE' | 'REFUSEE' | 'BROUILLON';
  noteRetour?: string;
  date: Date;
  client: { id: number; name?: string; email?: string };
  guichetier?: { id: number; name?: string; email?: string };
  technicien?: { id: number; name?: string; email?: string };
  produit?: Produit; // Added to support CLIENT-specific products
}