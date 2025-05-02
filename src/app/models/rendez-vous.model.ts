export interface Rdv {
  id?: number;
  dateSouhaitee: string;
  dateEnvoi: string;
  typeProbleme: string;
  description: string;
  status: string;
  client: { id: number };
  technicien?: { id: number };
  meetLink?: string; // Ajout du champ meetLink (optionnel)
}

export interface RdvCreate {
  dateSouhaitee: string;
  dateEnvoi: string;
  typeProbleme: string;
  description: string;
  status: string;
  client: { id: number };
  technicien?: { id: number };
}