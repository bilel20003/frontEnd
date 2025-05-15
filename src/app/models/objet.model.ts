export interface Objet {
  id: number;
  name: string;
  produit: { id: number };
  type: string; // Add type field to match backend
}