export interface Rdv {
  id?: number;
  dateSouhaitee: string;
  dateEnvoi: string;
  typeProbleme: string;
  description: string;
  status: string;
  client: { id: number };
}

export interface RdvCreate {
  dateSouhaitee: string;
  dateEnvoi: string;
  typeProbleme: string;
  description: string;
  status: string;
  client: { id: number };
}