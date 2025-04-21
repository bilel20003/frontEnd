export interface Rendezvous {
  id: number;
  dateSouhaitee: Date;
  dateEnvoi: Date;
  typeProbleme: string;
  description: string;
  status: 'CONFIRME' | 'EN_ATTENTE' | 'REFUSE';
}