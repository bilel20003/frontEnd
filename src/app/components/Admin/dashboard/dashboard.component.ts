import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Chart } from 'chart.js/auto';
import { DashboardService, DashboardData, DashboardRequete, DashboardRdv, DashboardUserInfo } from '../../../services/dashboard.service';
import { format, subDays, getDay } from 'date-fns';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // KPI Data
  totalUsers: number = 0;
  totalClients: number = 0;
  totalTechnicians: number = 0;
  totalGuichetiers: number = 0;
  totalRequests: number = 0;
  activeRequests: number = 0;
  processedRequests: number = 0;
  refusedRequests: number = 0;
  inProgressRequests: number = 0;
  avgProcessingTime: { days: number; hours: number; minutes: number } = { days: 0, hours: 0, minutes: 0 };
  totalMinisteres: number = 0;
  totalServices: number = 0;
  totalProduits: number = 0;
  totalRdvs: number = 0;
  technicianWorkload: { id: number; username: string; rdvCount: number }[] = [];
  topProducts: { id: number; nom: string; requestCount: number }[] = [];
  qualityKpis: { sameDay: number; withinTwoDays: number; moreThanTwoDays: number } = { sameDay: 0, withinTwoDays: 0, moreThanTwoDays: 0 };
  qualityPercentages: { sameDay: string; withinTwoDays: string; moreThanTwoDays: string } = { sameDay: '0.0', withinTwoDays: '0.0', moreThanTwoDays: '0.0' };
  displayedUsers: DashboardUserInfo[] = [];
  displayedRequests: DashboardRequete[] = [];
  displayedRdvs: DashboardRdv[] = [];
  displayedProducts: { id: number; nom: string; requestCount: number }[] = [];

  // Chart Configurations
  public qualityPieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { 
        title: { display: true, text: 'Catégories', padding: 10 },
        ticks: { padding: 10 }
      },
      y: { 
        beginAtZero: true, 
        title: { display: true, text: 'Nombre de Requêtes', padding: 10 }
      }
    },
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: context => {
            const dataset = context.dataset;
            const total = (dataset.data as number[]).reduce((sum, val) => sum + val, 0);
            const value = typeof context.parsed === 'number' ? context.parsed : 0;
            const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    layout: {
      padding: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 40
      }
    },
    animation: { duration: 2000, easing: 'easeOutQuart' }
  };
  public qualityPieChartType: ChartType = 'bar';
  public pieChartData: ChartData<'bar'> = {
    labels: ['Même Jour', '≤ 2 Jours', '> 2 Jours'],
    datasets: [{
      data: [],
      backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
      hoverBackgroundColor: ['#16a34a', '#d97706', '#dc2626'],
      barThickness: 50
    }]
  };

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: context => {
            const dataset = context.dataset;
            const total = (dataset.data as number[]).reduce((sum, val) => sum + val, 0);
            const value = typeof context.parsed === 'number' ? context.parsed : 0;
            const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 20
      }
    },
    layout: {
      padding: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 40
      }
    },
    animation: { duration: 2000, easing: 'easeOutQuart' }
  };
  public pieChartType: ChartType = 'pie';

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { 
      x: { ticks: { padding: 10 } },
      y: { beginAtZero: true }
    },
    plugins: { 
      legend: { display: true },
      tooltip: { callbacks: { label: context => `${context.dataset.label}: ${context.parsed.y}` } }
    },
    layout: {
      padding: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 40
      }
    },
    animation: { duration: 2000, easing: 'easeOutQuart' }
  };
  public barChartType: ChartType = 'bar';

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { 
      x: { ticks: { padding: 10 } },
      y: { beginAtZero: true }
    },
    plugins: { legend: { display: false } },
    layout: {
      padding: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 40
      }
    },
    animation: { duration: 2000, easing: 'easeOutQuart' }
  };
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Requêtes',
      borderColor: '#1e40af',
      backgroundColor: 'rgba(30, 64, 175, 0.2)',
      fill: true,
      tension: 0.4
    }]
  };

  public areaChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { 
      x: { title: { display: true, text: 'Types de Requêtes', padding: 10 }, ticks: { padding: 10 } },
      y: { beginAtZero: true }
    },
    plugins: { legend: { display: true } },
    layout: {
      padding: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 40
      }
    },
    animation: { duration: 2000, easing: 'easeOutQuart' }
  };
  public areaChartType: ChartType = 'bar';
  public areaChartData: ChartData<'bar'> = {
    labels: ['Nouveau', 'En cours', 'Traitée', 'Refusée'],
    datasets: [
      { 
        data: [0, 0, 0, 0], 
        label: 'Requêtes', 
        backgroundColor: ['rgba(0, 123, 255, 0.7)', 'rgba(255, 193, 7, 0.7)', 'rgba(40, 167, 69, 0.7)', 'rgba(220, 53, 69, 0.7)'],
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 5
      }
    ]
  };

  public pieCssChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: context => {
            const dataset = context.dataset;
            const total = (dataset.data as number[]).reduce((sum, val) => sum + val, 0);
            const value = typeof context.parsed === 'number' ? context.parsed : 0;
            const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 20
      }
    },
    layout: {
      padding: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 40
      }
    },
    animation: { duration: 2000, easing: 'easeOutQuart' }
  };
  public pieCssChartType: ChartType = 'pie';
  public pieCssChartData: ChartData<'pie'> = {
    labels: ['Nouveau', 'En cours', 'Traitée', 'Refusée'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: [
        'rgba(0, 123, 255, 0.7)',
        'rgba(255, 193, 7, 0.7)',
        'rgba(40, 167, 69, 0.7)',
        'rgba(220, 53, 69, 0.7)'
      ],
      hoverBackgroundColor: [
        'rgba(0, 123, 255, 1)',
        'rgba(255, 193, 7, 1)',
        'rgba(40, 167, 69, 1)',
        'rgba(220, 53, 69, 1)'
      ]
    }]
  };

  public avgProcessingTimeChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: { 
        max: 1440,
        beginAtZero: true,
        title: { display: true, text: 'Temps (minutes)', padding: 10 },
        ticks: { padding: 10 }
      },
      y: { title: { display: true, text: 'Statut', padding: 10 } }
    },
    plugins: { 
      legend: { display: false },
      tooltip: { callbacks: { label: context => `${context.parsed.x} minutes` } }
    },
    layout: {
      padding: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 40
      }
    },
    animation: { duration: 2000, easing: 'easeOutQuart' }
  };
  public avgProcessingTimeChartType: ChartType = 'bar';
  public avgProcessingTimeChartData: ChartData<'bar'> = {
    labels: ['Nouveau', 'En cours', 'Traitée', 'Refusée'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: '#3b82f6',
      borderWidth: 1,
      borderColor: '#000',
      borderRadius: 5
    }]
  };

  public dayOfWeekChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: context => {
            const dataset = context.dataset;
            const total = (dataset.data as number[]).reduce((sum, val) => sum + val, 0);
            const value = typeof context.parsed === 'number' ? context.parsed : 0;
            const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 20
      }
    },
    layout: {
      padding: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 40
      }
    },
    animation: { duration: 2000, easing: 'easeOutQuart' }
  };
  public dayOfWeekChartType: ChartType = 'pie';
  public dayOfWeekChartData: ChartData<'pie'> = {
    labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
    datasets: [{
      data: [0, 0, 0, 0, 0, 0, 0],
      backgroundColor: [
        'rgba(251, 191, 36, 0.7)',
        'rgba(30, 64, 175, 0.7)',
        'rgba(30, 58, 138, 0.7)',
        'rgba(248, 113, 113, 0.7)',
        'rgba(52, 211, 153, 0.7)',
        'rgba(251, 146, 60, 0.7)',
        'rgba(168, 85, 247, 0.7)'
      ],
      hoverBackgroundColor: [
        'rgba(251, 191, 36, 1)',
        'rgba(30, 64, 175, 1)',
        'rgba(30, 58, 138, 1)',
        'rgba(248, 113, 113, 1)',
        'rgba(52, 211, 153, 1)',
        'rgba(251, 146, 60, 1)',
        'rgba(168, 85, 247, 1)'
      ]
    }]
  };

  public userRoleChartData: ChartData<'pie'> = {
    labels: ['Clients', 'Guichetiers', 'Techniciens', 'Admins'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: [
        'rgba(0, 123, 255, 0.7)',
        'rgba(255, 193, 7, 0.7)',
        'rgba(40, 167, 69, 0.7)',
        'rgba(220, 53, 69, 0.7)'
      ],
      hoverBackgroundColor: [
        'rgba(0, 123, 255, 1)',
        'rgba(255, 193, 7, 1)',
        'rgba(40, 167, 69, 1)',
        'rgba(220, 53, 69, 1)'
      ]
    }]
  };

  public technicianWorkloadChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'RDV', backgroundColor: '#1e40af', borderRadius: 5 }]
  };

  public productChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(251, 191, 36, 0.7)',
        'rgba(30, 64, 175, 0.7)',
        'rgba(30, 58, 138, 0.7)',
        'rgba(248, 113, 113, 0.7)',
        'rgba(52, 211, 153, 0.7)'
      ],
      hoverBackgroundColor: [
        'rgba(251, 191, 36, 1)',
        'rgba(30, 64, 175, 1)',
        'rgba(30, 58, 138, 1)',
        'rgba(248, 113, 113, 1)',
        'rgba(52, 211, 153, 1)'
      ]
    }]
  };

  public productTrendChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Requêtes par Produit', backgroundColor: '#3b82f6', borderRadius: 5 }]
  };

  public ministereChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(251, 191, 36, 0.7)',
        'rgba(30, 64, 175, 0.7)',
        'rgba(30, 58, 138, 0.7)',
        'rgba(248, 113, 113, 0.7)',
        'rgba(52, 211, 153, 0.7)'
      ],
      hoverBackgroundColor: [
        'rgba(251, 191, 36, 1)',
        'rgba(30, 64, 175, 1)',
        'rgba(30, 58, 138, 1)',
        'rgba(248, 113, 113, 1)',
        'rgba(52, 211, 153, 1)'
      ]
    }]
  };

  public rdvStatusChartData: ChartData<'bar'> = {
    labels: ['En attente', 'Terminé', 'Refusé'],
    datasets: [
      { 
        data: [0, 0, 0], 
        label: 'RDV', 
        backgroundColor: ['rgba(255, 193, 7, 0.5)', 'rgba(40, 167, 69, 0.5)', 'rgba(220, 53, 69, 0.5)'], 
        borderColor: ['#ffc107', '#28a745', '#dc3545'], 
        borderWidth: 1,
        borderRadius: 5
      }
    ]
  };

  public serviceChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(251, 191, 36, 0.7)',
        'rgba(30, 64, 175, 0.7)',
        'rgba(30, 58, 138, 0.7)',
        'rgba(248, 113, 113, 0.7)',
        'rgba(52, 211, 153, 0.7)'
      ],
      hoverBackgroundColor: [
        'rgba(251, 191, 36, 1)',
        'rgba(30, 64, 175, 1)',
        'rgba(30, 58, 138, 1)',
        'rgba(248, 113, 113, 1)',
        'rgba(52, 211, 153, 1)'
      ]
    }]
  };

  public clientByMinistereChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(251, 191, 36, 0.7)',
        'rgba(30, 64, 175, 0.7)',
        'rgba(30, 58, 138, 0.7)',
        'rgba(248, 113, 113, 0.7)',
        'rgba(52, 211, 153, 0.7)'
      ],
      hoverBackgroundColor: [
        'rgba(251, 191, 36, 1)',
        'rgba(30, 64, 175, 1)',
        'rgba(30, 58, 138, 1)',
        'rgba(248, 113, 113, 1)',
        'rgba(52, 211, 153, 1)'
      ]
    }]
  };

  // Filters
  requestPeriod: '7days' | '30days' | 'custom' = '7days';
  requestStartDate: string = '';
  requestEndDate: string = '';
  userPeriod: '7days' | '30days' | 'custom' = '7days';
  userStartDate: string = '';
  userEndDate: string = '';
  rdvPeriod: '7days' | '30days' | 'custom' = '7days';
  rdvStartDate: string = '';
  rdvEndDate: string = '';
  productPeriod: '7days' | '30days' | 'custom' = '7days';
  productStartDate: string = '';
  productEndDate: string = '';

  // Search
  requestSearch: string = '';
  userSearch: string = '';
  rdvSearch: string = '';
  productSearch: string = '';

  // Table Data
  page: number = 1;
  pageSize: number = 5;
  totalRequestPages: number = 0;
  totalRdvPages: number = 0;
  loading: boolean = true;

  private allRequests: DashboardRequete[] = [];
  private allUsers: DashboardUserInfo[] = [];
  private allRdvs: DashboardRdv[] = [];
  private allProducts: { id: number; nom: string; requestCount: number }[] = [];

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadAllData();
  }

  hasNonZeroData(chartData: ChartData<any>): boolean {
    return chartData?.datasets?.some((ds: any) => ds.data?.some((d: number) => d > 0)) ?? false;
  }

  getRequestBadgeClass(etat: string): string {
    switch (etat?.toUpperCase()) {
      case 'NOUVEAU': return 'bg-blue-500';
      case 'EN_COURS_DE_TRAITEMENT': return 'bg-yellow-500';
      case 'TRAITEE': return 'bg-green-500';
      case 'REFUSEE': return 'bg-red-500';
      case 'BROUILLON': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  }

  getRdvBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'EN_ATTENTE': return 'bg-yellow-500';
      case 'PLANIFIE': return 'bg-blue-600';
      case 'TERMINE': return 'bg-green-500';
      case 'REFUSE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  getRoleBadgeClass(role: string): string {
    switch (role?.toUpperCase()) {
      case 'CLIENT': return 'bg-blue-500';
      case 'TECHNICIEN': return 'bg-yellow-500';
      case 'GUICHETIER': return 'bg-blue-600';
      case 'ADMIN': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  }

  translateStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'NOUVEAU',
      'IN_PROGRESS': 'EN_COURS_DE_TRAITEMENT',
      'COMPLETED': 'TRAITEE',
      'REFUSEE': 'REFUSEE',
      'BROUILLON': 'BROUILLON',
      'EN_ATTENTE': 'EN_ATTENTE',
      'TERMINE': 'TERMINE',
      'REFUSE': 'REFUSE',
      'SCHEDULED': 'PLANIFIE'
    };
    return statusMap[status.toUpperCase()] || status;
  }

  translateRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'CLIENT': 'Client',
      'GUICHETIER': 'Guichetier',
      'TECHNICIEN': 'Technicien',
      'ADMIN': 'Administrateur'
    };
    return roleMap[role.toUpperCase()] || role;
  }

  loadAllData(): void {
    this.loading = true;
    this.loadRequestData();
    this.loadUserData();
    this.loadRdvData();
    this.loadProductData();
  }

  getPeriodDates(period: string, startDate: string, endDate: string): { start: Date; end: Date } {
    let start: Date;
    let end = new Date();
    if (period === '7days') {
      start = subDays(end, 7);
    } else if (period === '30days') {
      start = subDays(end, 30);
    } else {
      start = new Date(startDate);
      end = new Date(endDate);
    }
    return { start, end };
  }

  loadRequestData(): void {
    if (this.requestPeriod === 'custom' && (!this.requestStartDate || !this.requestEndDate)) {
      return;
    }
    this.loading = true;
    const { start, end } = this.getPeriodDates(this.requestPeriod, this.requestStartDate, this.requestEndDate);
    this.dashboardService.getDashboardData(start, end).subscribe({
      next: (data: DashboardData) => {
        console.log('Request data:', data);
        this.totalUsers = data.totalUsers;
        this.totalClients = data.totalClients;
        this.totalTechnicians = data.userRoles.technicians;
        this.totalGuichetiers = data.userRoles.guichetiers;
        this.totalRequests = data.totalRequests;
        this.activeRequests = data.activeRequests;
        this.processedRequests = data.processedRequests;
        this.refusedRequests = data.refusedRequests;
        this.inProgressRequests = data.inProgressRequests;
        this.avgProcessingTime = data.avgProcessingTime;
        this.totalMinisteres = data.totalMinisteres;
        this.totalServices = data.totalServices;
        this.totalProduits = data.totalProduits;

        const totalTime = this.avgProcessingTime.days * 24 * 60 + this.avgProcessingTime.hours * 60 + this.avgProcessingTime.minutes;
        this.avgProcessingTimeChartData.datasets[0].data = [
          data.avgProcessingTimePerStatus?.nouveau || 0,
          data.avgProcessingTimePerStatus?.enCours || 0,
          data.avgProcessingTimePerStatus?.traitee || 0,
          data.avgProcessingTimePerStatus?.refusee || 0
        ];

        this.pieChartData.datasets[0].data = [
          data.qualityKpis.sameDay,
          data.qualityKpis.withinTwoDays,
          data.qualityKpis.moreThanTwoDays
        ];

        const totalNonBrouillon = data.requestStatus.nouveau + data.requestStatus.enCours + data.requestStatus.traitee + data.requestStatus.refusee;
        this.areaChartData.datasets[0].data = totalNonBrouillon ? [
          data.requestStatus.nouveau,
          data.requestStatus.enCours,
          data.requestStatus.traitee,
          data.requestStatus.refusee
        ] : [0, 0, 0, 0];
        this.pieCssChartData.datasets[0].data = [
          data.requestStatus.nouveau,
          data.requestStatus.enCours,
          data.requestStatus.traitee,
          data.requestStatus.refusee
        ];

        this.lineChartData.labels = data.requestTrends.map(t => format(new Date(t.date), 'dd/MM'));
        this.lineChartData.datasets[0].data = data.requestTrends.map(t => t.count);
        this.ministereChartData.labels = data.requestsByMinistere.map(m => m.ministereName);
        this.ministereChartData.datasets[0].data = data.requestsByMinistere.map(m => m.requestCount);
        this.serviceChartData.labels = Array.from({ length: this.totalServices }, (_, i) => `Service ${i + 1}`);
        this.serviceChartData.datasets[0].data = Array(this.totalServices).fill(10);
        this.clientByMinistereChartData.labels = data.requestsByMinistere.map(m => m.ministereName);
        this.clientByMinistereChartData.datasets[0].data = data.requestsByMinistere.map(m => {
          const clients = this.allUsers.filter(u => u.role === 'CLIENT' && u.id);
          return clients.length;
        });
        this.productChartData.labels = data.topProducts.map(p => p.nom);
        this.productChartData.datasets[0].data = data.topProducts.map(p => p.requestCount);
        this.productTrendChartData.labels = data.topProducts.map(p => p.nom);
        this.productTrendChartData.datasets[0].data = data.topProducts.map(p => p.requestCount);

        // Calcul des requêtes par jour de la semaine
        const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Lundi à Dimanche
        data.requests.forEach(req => {
          if (req.date) {
            const day = getDay(new Date(req.date));
            dayCounts[day === 0 ? 6 : day - 1]++; // Ajuster pour commencer à lundi (0 = dimanche -> 6)
          }
        });
        this.dayOfWeekChartData.datasets[0].data = dayCounts;

        this.qualityKpis = data.qualityKpis;
        const totalQuality = data.qualityKpis.sameDay + data.qualityKpis.withinTwoDays + data.qualityKpis.moreThanTwoDays;
        this.qualityPercentages = {
          sameDay: totalQuality ? ((data.qualityKpis.sameDay / totalQuality) * 100).toFixed(1) : '0.0',
          withinTwoDays: totalQuality ? ((data.qualityKpis.withinTwoDays / totalQuality) * 100).toFixed(1) : '0.0',
          moreThanTwoDays: totalQuality ? ((data.qualityKpis.moreThanTwoDays / totalQuality) * 100).toFixed(1) : '0.0'
        };

        this.allRequests = data.requests;
        this.totalRequestPages = data.requests.length;
        this.filterRequests();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading request data:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadUserData(): void {
    if (this.userPeriod === 'custom' && (!this.userStartDate || !this.userEndDate)) {
      return;
    }
    const { start, end } = this.getPeriodDates(this.userPeriod, this.userStartDate, this.userEndDate);
    this.dashboardService.getDashboardData(start, end).subscribe({
      next: (data: DashboardData) => {
        console.log('User data:', data);
        this.userRoleChartData.datasets[0].data = [
          data.userRoles.clients,
          data.userRoles.guichetiers,
          data.userRoles.technicians,
          data.userRoles.admins
        ];

        this.allUsers = data.users || [];
        this.filterUsers();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading user data:', err);
        this.loading = false;
      }
    });
  }

  loadRdvData(): void {
    if (this.rdvPeriod === 'custom' && (!this.rdvStartDate || !this.rdvEndDate)) {
      return;
    }
    this.loading = true;
    const { start, end } = this.getPeriodDates(this.rdvPeriod, this.rdvStartDate, this.rdvEndDate);
    this.dashboardService.getDashboardData(start, end).subscribe({
      next: (data: DashboardData) => {
        console.log('RDV data:', data);
        this.totalRdvs = data.rdvs.length;
        this.rdvStatusChartData.datasets[0].data = [
          data.rdvStatus.pending,
          data.rdvStatus.completed,
          data.rdvStatus.refused
        ];

        this.technicianWorkload = data.technicianWorkload;
        this.technicianWorkloadChartData.labels = data.technicianWorkload.map(t => t.username);
        this.technicianWorkloadChartData.datasets[0].data = data.technicianWorkload.map(t => t.rdvCount);

        this.allRdvs = data.rdvs;
        this.totalRdvPages = data.rdvs.length;
        this.filterRdvs();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading RDV data:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadProductData(): void {
    if (this.productPeriod === 'custom' && (!this.productStartDate || !this.productEndDate)) {
      return;
    }
    const { start, end } = this.getPeriodDates(this.productPeriod, this.productStartDate, this.productEndDate);
    this.dashboardService.getDashboardData(start, end).subscribe({
      next: (data: DashboardData) => {
        console.log('Product data:', data);
        this.topProducts = data.topProducts;
        this.allProducts = data.topProducts;
        this.filterProducts();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading product data:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Filtering methods for search functionality
  filterRequests(): void {
    const search = this.requestSearch.toLowerCase();
    this.displayedRequests = this.allRequests
      .filter(req => 
        req.id.toString().includes(search) ||
        req.client?.username?.toLowerCase().includes(search) ||
        req.etat.toLowerCase().includes(search) ||
        (req.date && format(new Date(req.date), 'dd/MM/yyyy').includes(search))
      )
      .slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
  }

  filterUsers(): void {
    const search = this.userSearch.toLowerCase();
    this.displayedUsers = this.allUsers
      .filter(user => 
        user.id.toString().includes(search) ||
        user.username.toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search)
      )
      .slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
  }

  filterRdvs(): void {
    const search = this.rdvSearch.toLowerCase();
    this.displayedRdvs = this.allRdvs
      .filter(rdv => 
        (rdv.id && rdv.id.toString().includes(search)) ||
        rdv.technicien?.username?.toLowerCase().includes(search) ||
        (rdv.dateSouhaitee && format(new Date(rdv.dateSouhaitee), 'dd/MM/yyyy').includes(search)) ||
        (rdv.status && rdv.status.toLowerCase().includes(search))
      )
      .slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
  }

  filterProducts(): void {
    const search = this.productSearch.toLowerCase();
    this.displayedProducts = this.allProducts
      .filter(product => 
        product.nom.toLowerCase().includes(search) ||
        product.requestCount.toString().includes(search)
      )
      .slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
  }

  // Pagination method
  changePage(newPage: number, type: 'requests' | 'rdvs'): void {
    if (newPage < 1) return;
    const totalItems = type === 'requests' ? this.totalRequestPages : this.totalRdvs;
    if (newPage * this.pageSize > totalItems && totalItems > 0) return;

    this.page = newPage;
    if (type === 'requests') {
      this.filterRequests();
    } else {
      this.filterRdvs();
    }
  }
}