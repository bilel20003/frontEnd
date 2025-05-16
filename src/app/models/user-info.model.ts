export interface UserInfo {
  id: number;
  name: string;
  email: string;
  password: string;
  isDeletable: string;
  status: string;
  role: { id: number };
  service: {
    id: number;
    nomService?: string;
    ministere?: { id: number; nomMinistere: string };
  };
  produit: { id: number; nom?: string };
}