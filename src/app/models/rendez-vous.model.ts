export interface Rdv {
  id?: number;
  dateSouhaitee: string;
  dateEnvoi: string;
  typeProbleme: string;
  description: string;
  status: string;
  client: { id: number };
  technicien?: { id: number; name: string };
  meetLink?: string;
  noteRetour?: string | null;
}

export interface RdvCreate {
  dateSouhaitee: string;
  dateEnvoi: string;
  typeProbleme: string;
  description: string;
  status: string;
  client: { id: number };
  technicien?: { id: number; name?: string };
}