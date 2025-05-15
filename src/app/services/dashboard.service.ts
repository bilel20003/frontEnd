import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequeteService } from './requete.service';
import { RendezvousService } from './rendez-vous.service';
import { UserInfoService, UserDisplay } from './user-info.service';
import { ProduitService } from './produit.service';
import { MinistereService } from './ministere.service';
import { ServiceService } from './service.service';
import { Requete } from '../models/requete.model';
import { Rdv } from '../models/rendez-vous.model';
import { Produit } from '../models/produit.model';
import { Ministere } from '../models/ministere.model';
import { Servicee } from '../models/service.model';
import { format, eachDayOfInterval, differenceInDays, startOfDay, endOfDay } from 'date-fns';

export interface DashboardUserInfo {
  id: number;
  username: string;
  role: string;
}

export interface DashboardRequete {
  id: number;
  client?: { id: number; username: string };
  objet?: { id: number; produit?: { id: number } };
  etat: string;
  date?: Date | string | null;
  dateTraitement?: Date | string | null;
}

export interface DashboardRdv {
  id?: number;
  technicien?: { id: number; username: string };
  dateSouhaitee?: string | null;
  status: string;
}

export interface DashboardData {
  totalUsers: number;
  totalClients: number;
  totalRequests: number;
  activeRequests: number;
  processedRequests: number;
  refusedRequests: number;
  inProgressRequests: number;
  avgProcessingTime: { days: number; hours: number; minutes: number };
  avgProcessingTimePerStatus: {
    nouveau: number;
    enCours: number;
    traitee: number;
    refusee: number;
  };
  totalMinisteres: number;
  totalServices: number;
  totalProduits: number;
  technicianWorkload: { id: number; username: string; rdvCount: number }[];
  topProducts: { id: number; nom: string; requestCount: number }[];
  requestStatus: { nouveau: number; enCours: number; traitee: number; refusee: number };
  rdvStatus: { pending: number; scheduled: number; completed: number; refused: number };
  userRoles: { clients: number; guichetiers: number; technicians: number; admins: number };
  requestTrends: { date: string; count: number }[];
  requestsByMinistere: { ministereName: string; requestCount: number }[];
  qualityKpis: { sameDay: number; withinTwoDays: number; moreThanTwoDays: number };
  requests: DashboardRequete[];
  rdvs: DashboardRdv[];
  users?: DashboardUserInfo[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(
    private requeteService: RequeteService,
    private rendezvousService: RendezvousService,
    private userInfoService: UserInfoService,
    private produitService: ProduitService,
    private ministereService: MinistereService,
    private serviceService: ServiceService
  ) {}

  getDashboardData(startDate: Date, endDate: Date): Observable<DashboardData> {
    return forkJoin({
      requetes: this.requeteService.getAllRequetes(),
      rdvs: this.rendezvousService.getRendezvous(),
      users: this.userInfoService.getAllUsers(),
      produits: this.produitService.getAllProduits(),
      ministeres: this.ministereService.getAllMinisteres(),
      services: this.serviceService.getAllServices()
    }).pipe(
      map(({ requetes, rdvs, users, produits, ministeres, services }) => {
        console.log('Raw API data:', { requetes, rdvs, users, produits, ministeres, services });

        // Mock data for testing
        const mockRdvs: Rdv[] = [
          { 
            id: 1, 
            technicien: { id: 1, name: 'Tech 1' }, 
            dateSouhaitee: '2025-05-07T10:00:00Z', 
            status: 'PLANIFIE', 
            dateEnvoi: new Date('2025-05-07T08:00:00Z').toISOString(), 
            typeProbleme: 'Installation', 
            description: 'Installation de matériel', 
            client: { id: 1 } 
          },
          { 
            id: 2, 
            technicien: { id: 2, name: 'Tech 2' }, 
            dateSouhaitee: '2025-05-08T14:00:00Z', 
            status: 'EN_ATTENTE', 
            dateEnvoi: new Date('2025-05-08T12:00:00Z').toISOString(), 
            typeProbleme: 'Maintenance', 
            description: 'Maintenance préventive', 
            client: { id: 2 } 
          },
          { 
            id: 3, 
            technicien: { id: 1, name: 'Tech 1' }, 
            dateSouhaitee: '2025-05-09T09:00:00Z', 
            status: 'TERMINE', 
            dateEnvoi: new Date('2025-05-09T07:00:00Z').toISOString(), 
            typeProbleme: 'Réparation', 
            description: 'Réparation de matériel', 
            client: { id: 3 } 
          }
        ];
        const mockProduits: Produit[] = [
          { id: 1, nom: 'Produit A', description: 'Description A', topologie: 'Type A', prix: 100 },
          { id: 2, nom: 'Produit B', description: 'Description B', topologie: 'Type B', prix: 200 },
          { id: 3, nom: 'Produit C', description: 'Description C', topologie: 'Type C', prix: 300 }
        ];
        const mockRequetes: Requete[] = [
          { 
            id: 1, 
            client: { id: 1, name: 'Client 1' }, 
            objet: { id: 1, produit: { id: 1 } }, 
            etat: 'TRAITEE', 
            date: new Date('2025-05-07T08:00:00Z'), 
            dateTraitement: new Date('2025-05-07T16:00:00Z'),
            type: 'DEMANDE_DE_TRAVAUX',
            description: 'Demande de travaux pour produit A',
            guichetier: { id: 0 },
            technicien: { id: 0 }
          },
          { 
            id: 2, 
            client: { id: 2, name: 'Client 2' }, 
            objet: { id: 2, produit: { id: 2 } }, 
            etat: 'EN_COURS_DE_TRAITEMENT', 
            date: new Date('2025-05-06T09:00:00Z'), 
            dateTraitement: new Date('2025-05-08T10:00:00Z'),
            type: 'RECLAMATION',
            description: 'Réclamation pour produit B',
            guichetier: { id: 0 },
            technicien: { id: 0 }
          },
          { 
            id: 3, 
            client: { id: 3, name: 'Client 3' }, 
            objet: { id: 3, produit: { id: 1 } }, 
            etat: 'NOUVEAU', 
            date: new Date('2025-05-05T10:00:00Z'), 
            dateTraitement: new Date('2025-05-09T12:00:00Z'),
            type: 'DEMANDE_DE_TRAVAUX',
            description: 'Demande de travaux pour produit C',
            guichetier: { id: 0 },
            technicien: { id: 0 }
          },
          { 
            id: 4, 
            client: { id: 4, name: 'Client 4' }, 
            objet: { id: 4, produit: { id: 2 } }, 
            etat: 'REFUSEE', 
            date: new Date('2025-05-04T11:00:00Z'), 
            dateTraitement: new Date('2025-05-06T12:00:00Z'),
            type: 'RECLAMATION',
            description: 'Réclamation refusée pour produit B',
            guichetier: { id: 0 },
            technicien: { id: 0 }
          }
        ];
        // Use mock data if API returns empty
        requetes = requetes.length ? requetes : mockRequetes;
        rdvs = rdvs.length ? rdvs : mockRdvs;
        produits = produits.length ? produits : mockProduits;

        const dashboardUsers: DashboardUserInfo[] = users.map(u => ({
          id: u.id,
          username: u.nom,
          role: u.role
        }));

        const dashboardRequetes: DashboardRequete[] = requetes.map(r => ({
          id: r.id,
          client: r.client ? { id: r.client.id, username: r.client.name } : undefined,
          objet: r.objet ? { id: r.objet.id, produit: r.objet.produit ? { id: r.objet.produit.id } : undefined } : undefined,
          etat: r.etat,
          date: r.date,
          dateTraitement: r.dateTraitement
        }));

        const dashboardRdvs: DashboardRdv[] = rdvs.map(r => ({
          id: r.id,
          technicien: r.technicien ? { id: r.technicien.id, username: r.technicien.name } : undefined,
          dateSouhaitee: r.dateSouhaitee,
          status: r.status
        }));

        // Adjust endDate to include the full day
        const adjustedEndDate = endOfDay(endDate);

        const filteredRequetes = dashboardRequetes.filter(r => {
          const reqDate = r.date ? new Date(r.date) : null;
          return reqDate && reqDate >= startOfDay(startDate) && reqDate <= adjustedEndDate;
        });

        const filteredRdvs = dashboardRdvs.filter(r => {
          const rdvDate = r.dateSouhaitee ? new Date(r.dateSouhaitee) : null;
          return rdvDate && rdvDate >= startOfDay(startDate) && rdvDate <= adjustedEndDate;
        });

        console.log('Filtered RDVs:', filteredRdvs, 'Start:', startOfDay(startDate), 'End:', adjustedEndDate);

        const totalUsers = dashboardUsers.filter(u =>
          ['CLIENT', 'GUICHETIER', 'TECHNICIEN'].includes(u.role)
        ).length;

        const totalClients = dashboardUsers.filter(u => u.role === 'CLIENT').length;
        const totalRequests = dashboardRequetes.length;
        const activeRequests = filteredRequetes.filter(r => r.etat !== 'TRAITEE').length;
        const processedRequests = filteredRequetes.filter(r => r.etat === 'TRAITEE').length;
        const refusedRequests = filteredRequetes.filter(r => r.etat === 'REFUSEE').length;
        const inProgressRequests = filteredRequetes.filter(r => r.etat === 'EN_COURS_DE_TRAITEMENT').length;

        const completedRequetes = filteredRequetes.filter(r => r.etat === 'TRAITEE' && r.date && r.dateTraitement);
        console.log('Completed requests for avgProcessingTime:', completedRequetes);
        const processingTimes = completedRequetes.map(r => {
          const start = new Date(r.date!);
          const end = new Date(r.dateTraitement!);
          const diff = end.getTime() - start.getTime();
          console.log(`Request ${r.id}: start=${r.date}, end=${r.dateTraitement}, diff=${diff}ms`);
          return diff;
        });
        const avgProcessingTimeMs = processingTimes.length
          ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
          : 0;
        console.log('Average processing time (ms):', avgProcessingTimeMs);
        const avgProcessingTime = {
          days: Math.floor(avgProcessingTimeMs / (1000 * 60 * 60 * 24)),
          hours: Math.floor((avgProcessingTimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((avgProcessingTimeMs % (1000 * 60 * 60)) / (1000 * 60))
        };

        // Calculate average processing time per status
        const avgProcessingTimePerStatus = {
          nouveau: 0,
          enCours: 0,
          traitee: 0,
          refusee: 0
        };
        const statusProcessingTimes: { [key: string]: number[] } = {
          ['nouveau']: [],
          ['enCours']: [],
          ['traitee']: [],
          ['refusee']: []
        };
        filteredRequetes.forEach(r => {
          if (r.date && r.dateTraitement) {
            const start = new Date(r.date);
            const end = new Date(r.dateTraitement);
            const diffMs = end.getTime() - start.getTime();
            switch (r.etat) {
              case 'NOUVEAU':
                statusProcessingTimes['nouveau'].push(diffMs);
                break;
              case 'EN_COURS_DE_TRAITEMENT':
                statusProcessingTimes['enCours'].push(diffMs);
                break;
              case 'TRAITEE':
                statusProcessingTimes['traitee'].push(diffMs);
                break;
              case 'REFUSEE':
                statusProcessingTimes['refusee'].push(diffMs);
                break;
            }
          }
        });
        avgProcessingTimePerStatus.nouveau = statusProcessingTimes['nouveau'].length
          ? Math.floor(statusProcessingTimes['nouveau'].reduce((a, b) => a + b, 0) / statusProcessingTimes['nouveau'].length / (1000 * 60)) // Convert to minutes
          : 0;
        avgProcessingTimePerStatus.enCours = statusProcessingTimes['enCours'].length
          ? Math.floor(statusProcessingTimes['enCours'].reduce((a, b) => a + b, 0) / statusProcessingTimes['enCours'].length / (1000 * 60))
          : 0;
        avgProcessingTimePerStatus.traitee = statusProcessingTimes['traitee'].length
          ? Math.floor(statusProcessingTimes['traitee'].reduce((a, b) => a + b, 0) / statusProcessingTimes['traitee'].length / (1000 * 60))
          : 0;
        avgProcessingTimePerStatus.refusee = statusProcessingTimes['refusee'].length
          ? Math.floor(statusProcessingTimes['refusee'].reduce((a, b) => a + b, 0) / statusProcessingTimes['refusee'].length / (1000 * 60))
          : 0;

        // Calculate Quality KPIs
        const qualityMetrics = completedRequetes.reduce(
          (acc, r) => {
            const start = startOfDay(new Date(r.date!));
            const end = startOfDay(new Date(r.dateTraitement!));
            const daysDiff = differenceInDays(end, start);
            if (daysDiff === 0) {
              acc.sameDay++;
            } else if (daysDiff <= 2) {
              acc.withinTwoDays++;
            } else {
              acc.moreThanTwoDays++;
            }
            return acc;
          },
          { sameDay: 0, withinTwoDays: 0, moreThanTwoDays: 0 }
        );
        const totalCompleted = completedRequetes.length;
        const qualityKpis = {
          sameDay: totalCompleted ? parseFloat((qualityMetrics.sameDay / totalCompleted * 100).toFixed(1)) : 0,
          withinTwoDays: totalCompleted ? parseFloat((qualityMetrics.withinTwoDays / totalCompleted * 100).toFixed(1)) : 0,
          moreThanTwoDays: totalCompleted ? parseFloat((qualityMetrics.moreThanTwoDays / totalCompleted * 100).toFixed(1)) : 0
        };

        const technicianWorkload = dashboardUsers
          .filter(u => u.role === 'TECHNICIEN')
          .map(t => ({
            id: t.id,
            username: t.username,
            rdvCount: filteredRdvs.filter(r => r.technicien?.id === t.id).length
          }))
          .sort((a, b) => b.rdvCount - a.rdvCount);

        const topProducts = produits.map(p => ({
          id: p.id,
          nom: p.nom,
          requestCount: filteredRequetes.filter(r => r.objet?.produit?.id === p.id).length
        })).sort((a, b) => b.requestCount - a.requestCount);

        const requestStatus = {
          nouveau: filteredRequetes.filter(r => r.etat === 'NOUVEAU').length,
          enCours: filteredRequetes.filter(r => r.etat === 'EN_COURS_DE_TRAITEMENT').length,
          traitee: filteredRequetes.filter(r => r.etat === 'TRAITEE').length,
          refusee: filteredRequetes.filter(r => r.etat === 'REFUSEE').length
        };

        const rdvStatus = {
          pending: filteredRdvs.filter(r => r.status === 'EN_ATTENTE').length,
          scheduled: filteredRdvs.filter(r => r.status === 'PLANIFIE').length,
          completed: filteredRdvs.filter(r => r.status === 'TERMINE').length,
          refused: filteredRdvs.filter(r => r.status === 'REFUSE').length
        };

        const userRoles = {
          clients: dashboardUsers.filter(u => u.role === 'CLIENT').length,
          guichetiers: dashboardUsers.filter(u => u.role === 'GUICHETIER').length,
          technicians: dashboardUsers.filter(u => u.role === 'TECHNICIEN').length,
          admins: dashboardUsers.filter(u => u.role === 'ADMIN').length
        };

        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const requestTrends = days.map((day: Date) => ({
          date: format(day, 'yyyy-MM-dd'),
          count: filteredRequetes.filter(r => r.date && format(new Date(r.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')).length
        }));

        const requestsByMinistere = ministeres.map(m => ({
          ministereName: m.nomMinistere,
          requestCount: filteredRequetes.filter(r => {
            const user = users.find(u => u.id === r.client?.id);
            const service = user?.serviceId ? services.find(s => s.id === user.serviceId) : null;
            return service?.ministere?.id === m.id;
          }).length
        })).filter(m => m.requestCount > 0);

        return {
          totalUsers,
          totalClients,
          totalRequests,
          activeRequests,
          processedRequests,
          refusedRequests,
          inProgressRequests,
          avgProcessingTime,
          avgProcessingTimePerStatus,
          totalMinisteres: ministeres.length,
          totalServices: services.length,
          totalProduits: produits.length,
          technicianWorkload,
          topProducts,
          requestStatus,
          rdvStatus,
          userRoles,
          requestTrends,
          requestsByMinistere,
          qualityKpis,
          requests: filteredRequetes,
          rdvs: filteredRdvs,
          users: dashboardUsers
        };
      })
    );
  }
}