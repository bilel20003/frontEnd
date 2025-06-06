export interface Produit {
  id: number;
  nom: string;
  description: string;
  topologie: string;
  prix: number;
}

export type CreateProduit = Omit<Produit, 'id'>;