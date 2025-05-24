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
  dateTraitement?: Date | null;
  noteRetour?: string;
  client: {
    id: number;
    name: string;
    service?: {
      id: number;
      nomService: string;
      ministere: { id: number; nomMinistere: string };
    };
  };
  guichetier: { id: number; name?: string };
  technicien: { id: number; name?: string } | null;
  piecesJointes?: { id?: number; url: string; nom_fichier: string; typeFichier?: string }[];
  isArchived?: boolean;
}