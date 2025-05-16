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
import { Statistics } from '../models/statistics.model';
import { format, eachDayOfInterval, differenceInDays, startOfDay, endOfDay, getDay } from 'date-fns';

export interface DashboardUserInfo {
  id: number;
  username: string;
  role: string;
  service?: {
    id: number;
    nomService?: string;
    ministere?: {
      id: number;
      nomMinistere?: string;
    };
  };
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
  statistics: Statistics;
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
          role: u.role,
          service: u.serviceId ? services.find(s => s.id === u.serviceId) : undefined
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

        const kpiMetrics = {
          totalUsers: dashboardUsers.filter(u => ['CLIENT', 'GUICHETIER', 'TECHNICIEN'].includes(u.role)).length,
          totalClients: dashboardUsers.filter(u => u.role === 'CLIENT').length,
          totalTechnicians: dashboardUsers.filter(u => u.role === 'TECHNICIEN').length,
          totalGuichetiers: dashboardUsers.filter(u => u.role === 'GUICHETIER').length,
          totalRequests: dashboardRequetes.length,
          activeRequests: filteredRequetes.filter(r => r.etat !== 'TRAITEE').length,
          processedRequests: filteredRequetes.filter(r => r.etat === 'TRAITEE').length,
          refusedRequests: filteredRequetes.filter(r => r.etat === 'REFUSEE').length,
          inProgressRequests: filteredRequetes.filter(r => r.etat === 'EN_COURS_DE_TRAITEMENT').length,
          avgProcessingTime: { days: 0, hours: 0, minutes: 0 },
          totalMinisteres: ministeres.length,
          totalServices: services.length,
          totalProduits: produits.length,
          totalRdvs: filteredRdvs.length
        };

        const completedRequetes = filteredRequetes.filter(r => r.etat === 'TRAITEE' && r.date && r.dateTraitement);
        const processingTimes = completedRequetes.map(r => {
          const start = new Date(r.date!);
          const end = new Date(r.dateTraitement!);
          return end.getTime() - start.getTime();
        });
        const avgProcessingTimeMs = processingTimes.length
          ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
          : 0;
        kpiMetrics.avgProcessingTime = {
          days: Math.floor(avgProcessingTimeMs / (1000 * 60 * 60 * 24)),
          hours: Math.floor((avgProcessingTimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((avgProcessingTimeMs % (1000 * 60 * 60)) / (1000 * 60))
        };

        const qualityMetrics = completedRequetes.reduce(
          (acc, r) => {
            const start = startOfDay(new Date(r.date!));
            const end = startOfDay(new Date(r.dateTraitement!));
            const daysDiff = differenceInDays(end, start);
            if (daysDiff === 0) acc.sameDay++;
            else if (daysDiff <= 2) acc.withinTwoDays++;
            else acc.moreThanTwoDays++;
            return acc;
          },
          { sameDay: 0, withinTwoDays: 0, moreThanTwoDays: 0 }
        );
        const totalQuality = qualityMetrics.sameDay + qualityMetrics.withinTwoDays + qualityMetrics.moreThanTwoDays;
        const qualityPercentages = {
          sameDay: totalQuality ? ((qualityMetrics.sameDay / totalQuality) * 100).toFixed(1) : '0.0',
          withinTwoDays: totalQuality ? ((qualityMetrics.withinTwoDays / totalQuality) * 100).toFixed(1) : '0.0',
          moreThanTwoDays: totalQuality ? ((qualityMetrics.moreThanTwoDays / totalQuality) * 100).toFixed(1) : '0.0'
        };

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

        const requestsByMinistere = ministeres.map(m => ({
          ministereName: m.nomMinistere || `Ministère ${m.id}`,
          requestCount: filteredRequetes.filter(r => {
            const user = dashboardUsers.find(u => u.id === r.client?.id);
            const service = user?.service;
            return service?.ministere?.id === m.id;
          }).length
        })).filter(m => m.requestCount > 0);

        const requestsByService = services.map(s => ({
          serviceName: s.nomService || `Service ${s.id}`,
          requestCount: filteredRequetes.filter(r => {
            const user = dashboardUsers.find(u => u.id === r.client?.id);
            return user?.service?.id === s.id;
          }).length
        })).filter(s => s.requestCount > 0);

        const clientsByMinistere = ministeres.map(m => ({
          ministereName: m.nomMinistere || `Ministère ${m.id}`,
          clientCount: dashboardUsers.filter(u => u.role === 'CLIENT' && u.service?.ministere?.id === m.id).length
        })).filter(m => m.clientCount > 0);

        const statusProcessingTimes: { [key: string]: number[] } = {
          nouveau: [],
          enCours: [],
          traitee: [],
          refusee: []
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
        const avgProcessingTimePerStatus = {
          nouveau: statusProcessingTimes['nouveau'].length
            ? Math.floor(statusProcessingTimes['nouveau'].reduce((a, b) => a + b, 0) / statusProcessingTimes['nouveau'].length / (1000 * 60))
            : 0,
          enCours: statusProcessingTimes['enCours'].length
            ? Math.floor(statusProcessingTimes['enCours'].reduce((a, b) => a + b, 0) / statusProcessingTimes['enCours'].length / (1000 * 60))
            : 0,
          traitee: statusProcessingTimes['traitee'].length
            ? Math.floor(statusProcessingTimes['traitee'].reduce((a, b) => a + b, 0) / statusProcessingTimes['traitee'].length / (1000 * 60))
            : 0,
          refusee: statusProcessingTimes['refusee'].length
            ? Math.floor(statusProcessingTimes['refusee'].reduce((a, b) => a + b, 0) / statusProcessingTimes['refusee'].length / (1000 * 60))
            : 0
        };

        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const requestTrends = days.map((day: Date) => ({
          date: format(day, 'yyyy-MM-dd'),
          count: filteredRequetes.filter(r => r.date && format(new Date(r.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')).length
        }));

        const dayOfWeekDistribution = [0, 0, 0, 0, 0, 0, 0]; // Monday to Sunday
        filteredRequetes.forEach(r => {
          if (r.date) {
            const day = getDay(new Date(r.date));
            dayOfWeekDistribution[day === 0 ? 6 : day - 1]++;
          }
        });

        const statistics: Statistics = {
          kpiMetrics,
          qualityMetrics: { kpis: qualityMetrics, percentages: qualityPercentages },
          requestTrends,
          requestStatus,
          rdvStatus,
          userRoles,
          technicianWorkload,
          topProducts,
          requestsByMinistere,
          requestsByService,
          clientsByMinistere,
          avgProcessingTimePerStatus,
          dayOfWeekDistribution
        };

        return {
          statistics,
          requests: filteredRequetes,
          rdvs: filteredRdvs,
          users: dashboardUsers
        };
      })
    );
  }
}