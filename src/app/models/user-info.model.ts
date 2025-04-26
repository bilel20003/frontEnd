export interface UserInfo {
  id: number;
  name: string;
  email: string;
  password: string;
  isDeletable: string;
  status: string;
  role: { id: number };
  service: { id: number };
  produit: { id: number };
}