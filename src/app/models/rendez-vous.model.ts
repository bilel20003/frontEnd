export interface Rdv {
  id: number;
  dateSouhaitee: Date;
  dateEnvoi: Date;
  typeProbleme: string;
  description: string;
  status: 'CONFIRME' | 'EN_ATTENTE' | 'REFUSE';
  client: { id: number };
  guichetier: { id: number };
}