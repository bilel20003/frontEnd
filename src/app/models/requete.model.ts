export interface Requete {
  id: number;
  type: string;
  objet: {
    id: number;
    name?: string;
    produit?: { id: number; nom?: string };
  };
  description: string;
  etat: string;
  date: Date;
  noteRetour: string;
  client: { id: number };
  guichetier: { id: number };
  technicien: { id: number } | null;
}