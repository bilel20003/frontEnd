import { Servicee } from './service.model';

export interface Ministere {
  id: number;
  nomMinistere: string;
  services?: Servicee[]; // souvent pas présent côté frontend sauf cas particuliers
}
