import { Produit } from "./produit.model";
import { Servicee } from "./service.model";  // à créer aussi selon ton modèle backend

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  password?: string;
  isDeletable: string; // 'true' or 'false'
  status: string; // 'true' or 'false'
  role: { id: number; name: 'ADMIN' | 'CLIENT' | 'TECHNICIEN' | 'GUICHETIER' };
  service: Servicee;
  produit: Produit; // Required due to non-nullable produit_id
}
