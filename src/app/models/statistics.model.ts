export interface Statistics {
  kpiMetrics: {
    totalUsers: number;
    totalClients: number;
    totalTechnicians: number;
    totalGuichetiers: number;
    totalRequests: number;
    activeRequests: number;
    processedRequests: number;
    refusedRequests: number;
    inProgressRequests: number;
    avgProcessingTime: { days: number; hours: number; minutes: number };
    totalMinisteres: number;
    totalServices: number;
    totalProduits: number;
    totalRdvs: number;
  };
  qualityMetrics: {
  kpis: { sameDay: number; withinTwoDays: number; moreThanTwoDays: number };
  percentages: { sameDay: string; withinTwoDays: string; moreThanTwoDays: string };
}
  requestTrends: { date: string; count: number }[];
  requestStatus: { nouveau: number; enCours: number; traitee: number; refusee: number };
  rdvStatus: { pending: number; scheduled: number; completed: number; refused: number };
  userRoles: { clients: number; guichetiers: number; technicians: number; admins: number };
  technicianWorkload: { id: number; username: string; rdvCount: number }[];
  topProducts: { id: number; nom: string; requestCount: number }[];
  requestsByMinistere: { ministereName: string; requestCount: number }[];
  requestsByService: { serviceName: string; requestCount: number }[];
  clientsByMinistere: { ministereName: string; clientCount: number }[];
  avgProcessingTimePerStatus: { nouveau: number; enCours: number; traitee: number; refusee: number };
  dayOfWeekDistribution: number[];
  
}