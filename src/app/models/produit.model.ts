import { Objet } from "./objet.model";
export interface Produit {
  id: number;
  nom: string;
  description: string;
  topologie: string;
  prix: number;
  objets: Objet[];
}