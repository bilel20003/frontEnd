import { Servicee } from "./service.model";  // à créer aussi selon ton modèle backend

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  password?: string; 
  isDeletable: string; 
  status: boolean; 
  role: 'ADMIN' | 'CLIENT' | 'TECHNICIEN' | 'GUICHETIER' | 'DIRECTEUR_DACA';
  service: Servicee;
}
