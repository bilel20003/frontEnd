import { Ministere } from "./ministere.model"; 

export interface Servicee {
  id: number;
  nomService: string;
  ministere?: Ministere;
}
