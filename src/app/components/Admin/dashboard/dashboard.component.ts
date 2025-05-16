import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DashboardService, DashboardData, DashboardRequete, DashboardRdv, DashboardUserInfo } from '../../../services/dashboard.service';
import { format, subDays, getDay } from 'date-fns';

// Register Chart.js components and the ChartDataLabels plugin
Chart.register(...registerables, ChartDataLabels);

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

  // Modern color palette
  private modernColors = [
    '#6B7280', // Gray
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#FBBF24', // Amber
    '#14B8A6', // Teal
    '#F87171', // Light Red
  ];

  private modernHoverColors = [
    '#4B5563',
    '#2563EB',
    '#059669',
    '#D97706',
    '#DC2626',
    '#7C3AED',
    '#DB2777',
    '#F59E0B',
    '#0D9488',
    '#EF4444',
  ];

  // Chart Configurations
  public qualityPieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { 
        title: { display: true, text: 'Catégories', color: '#1F2937', padding: 10, font: { size: 14, family: 'Inter', weight: '600' } },
        ticks: { padding: 10, color: '#6B7280' }
      },
      y: { 
        beginAtZero: true, 
        title: { display: true, text: 'Nombre de Requêtes', color: '#1F2937', padding: 10, font: { size: 14, family: 'Inter', weight: '600' } },
        ticks: { color: '#6B7280' }
      }
    },
    plugins: {
      legend: { position: 'top', labels: { color: '#1F2937', font: { size: 12, family: 'Inter' } } },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        callbacks: {
          label: (context) => {
            const value = context.parsed as number; // Type assertion for parsed value
            const dataset = context.dataset;
            const total = (dataset.data as number[]).reduce((sum: number, val: number) => sum + val, 0); // Explicit typing
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
    animation: { duration: 1500, easing: 'easeInOutQuart' }
  };
  public qualityPieChartType: ChartType = 'bar';
  public pieChartData: ChartData<'bar'> = {
    labels: ['Même Jour', '≤ 2 Jours', '> 2 Jours'],
    datasets: [{
      data: [],
      backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
      hoverBackgroundColor: ['#16a34a', '#d97706', '#dc2626'],
      barThickness: 50,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#FFFFFF'
    }]
  };

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#1F2937', font: { size: 14, family: 'Inter' } } },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        callbacks: {
          label: (context) => {
            const value = context.parsed as number; // Type assertion for parsed value
            const dataset = context.dataset;
            const total = (dataset.data as number[]).reduce((sum: number, val: number) => sum + val, 0); // Explicit typing
            const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#FFFFFF',
        font: { size: 12, weight: 'bold', family: 'Inter' },
        formatter: (value: number, context) => {
          const dataset = context.dataset;
          const total = (dataset.data as number[]).reduce((sum: number, val: number) => sum + val, 0); // Explicit typing
          const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
          return percentage !== '0.0' ? `${percentage}%` : '';
        },
        anchor: 'end',
        align: 'end',
        offset: 20,
        backgroundColor: (context) => this.modernColors[context.dataIndex % this.modernColors.length],
        borderRadius: 4,
        padding: 6,
        textAlign: 'center',
        display: (context) => {
          const dataset = context.dataset;
          const total = (dataset.data as number[]).reduce((sum: number, val: number) => sum + val, 0); // Explicit typing
          const value = dataset.data[context.dataIndex] as number;
          return total ? (value / total) * 100 >= 5 : false;
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#FFFFFF',
        hoverOffset: 20
      }
    },
    layout: {
      padding: {
        left: 30,
        right: 30,
        top: 30,
        bottom: 50
      }
    },
    animation: { duration: 1500, easing: 'easeInOutQuart' }
  };
  public pieChartType: ChartType = 'pie';

  public pieCssChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#1F2937', font: { size: 14, family: 'Inter' } } },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        callbacks: {
          label: (context) => {
            const value = context.parsed as number; // Type assertion for parsed value
            const dataset = context.dataset;
            const total = (dataset.data as number[]).reduce((sum: number, val: number) => sum + val, 0); // Explicit typing
            const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#FFFFFF',
        font: { size: 12, weight: 'bold', family: 'Inter' },
        formatter: (value: number, context) => {
          const dataset = context.dataset;
          const total = (dataset.data as number[]).reduce((sum: number, val: number) => sum + val, 0); // Explicit typing
          const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
          return percentage !== '0.0' ? `${percentage}%` : '';
        },
        anchor: 'end',
        align: 'end',
        offset: 20,
        backgroundColor: (context) => this.modernColors[context.dataIndex % this.modernColors.length],
        borderRadius: 4,
        padding: 6,
        textAlign: 'center',
        display: (context) => {
          const dataset = context.dataset;
          const total = (dataset.data as number[]).reduce((sum: number, val: number) => sum + val, 0); // Explicit typing
          const value = dataset.data[context.dataIndex] as number;
          return total ? (value / total) * 100 >= 5 : false;
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#FFFFFF',
        hoverOffset: 20
      }
    },
    layout: {
      padding: {
        left: 30,
        right: 30,
        top: 30,
        bottom: 50
      }
    },
    animation: { duration: 1500, easing: 'easeInOutQuart' }
  };
  public pieCssChartType: ChartType = 'pie';
  public pieCssChartData: ChartData<'pie'> = {
    labels: ['Nouveau', 'En cours', 'Traitée', 'Refusée'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: this.modernColors.slice(0, 4),
      hoverBackgroundColor: this.modernHoverColors.slice(0, 4)
    }]
  };

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { 
      x: { ticks: { padding: 10, color: '#6B7280' }, title: { display: true, text: 'Catégories', color: '#1F2937', padding: 10, font: { size: 14, family: 'Inter', weight: '600' } } },
      y: { beginAtZero: true, ticks: { color: '#6B7280' }, title: { display: true, text: 'Nombre', color: '#1F2937', padding: 10, font: { size: 14, family: 'Inter', weight: '600' } } }
    },
    plugins: { 
      legend: { display: true, labels: { color: '#1F2937', font: { size: 12, family: 'Inter' } } },
      tooltip: { 
        backgroundColor: '#1F2937',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        callbacks: { label: context => `${context.dataset.label}: ${context.parsed.y as number}` } 
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
    animation: { duration: 1500, easing: 'easeInOutQuart' }
  };
  public barChartType: ChartType = 'bar';

  public avgProcessingTimeChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: { 
        max: 1440,
        beginAtZero: true,
        title: { display: true, text: 'Temps (minutes)', color: '#1F2937', padding: 10, font: { size: 14, family: 'Inter', weight: '600' } },
        ticks: { padding: 10, color: '#6B7280' }
      },
      y: { 
        title: { display: true, text: 'Statut', color: '#1F2937', padding: 10, font: { size: 14, family: 'Inter', weight: '600' } },
        ticks: { color: '#6B7280' }
      }
    },
    plugins: { 
      legend: { display: false },
      tooltip: { 
        backgroundColor: '#1F2937',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        callbacks: { label: context => `${context.parsed.x as number} minutes` } 
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
    animation: { duration: 1500, easing: 'easeInOutQuart' }
  };
  public avgProcessingTimeChartType: ChartType = 'bar';
  public avgProcessingTimeChartData: ChartData<'bar'> = {
    labels: ['Nouveau', 'En cours', 'Traitée', 'Refusée'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: '#3b82f6',
      hoverBackgroundColor: '#2563EB',
      borderWidth: 1,
      borderColor: '#FFFFFF',
      borderRadius: 8
    }]
  };

  public dayOfWeekChartOptions: ChartConfiguration['options'] = this.pieChartOptions; // Reuse pie chart options
  public dayOfWeekChartType: ChartType = 'pie';
  public dayOfWeekChartData: ChartData<'pie'> = {
    labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
    datasets: [{
      data: [0, 0, 0, 0, 0, 0, 0],
      backgroundColor: this.modernColors.slice(0, 7),
      hoverBackgroundColor: this.modernHoverColors.slice(0, 7)
    }]
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { 
      x: { ticks: { padding: 10, color: '#6B7280' }, title: { display: true, text: 'Date', color: '#1F2937', padding: 10, font: { size: 14, family: 'Inter', weight: '600' } } },
      y: { beginAtZero: true, ticks: { color: '#6B7280' }, title: { display: true, text: 'Nombre de Requêtes', color: '#1F2937', padding: 10, font: { size: 14, family: 'Inter', weight: '600' } } }
    },
    plugins: { 
      legend: { display: false },
      tooltip: { 
        backgroundColor: '#1F2937',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF'
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
    animation: { duration: 1500, easing: 'easeInOutQuart' }
  };
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Requêtes',
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };

  public areaChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { 
      x: { 
        title: { display: true, text: 'Types de Requêtes', color: '#1F2937', padding: 10, font: { size: 14, family: 'Inter', weight: '600' } }, 
        ticks: { padding: 10, color: '#6B7280' } 
      },
      y: { 
        beginAtZero: true, 
        ticks: { color: '#6B7280' }, 
        title: { display: true, text: 'Nombre', color: '#1F2937', padding: 10, font: { size: 14, family: 'Inter', weight: '600' } } 
      }
    },
    plugins: { 
      legend: { display: true, labels: { color: '#1F2937', font: { size: 12, family: 'Inter' } } },
      tooltip: { 
        backgroundColor: '#1F2937',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF'
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
    animation: { duration: 1500, easing: 'easeInOutQuart' }
  };
  public areaChartType: ChartType = 'bar';
  public areaChartData: ChartData<'bar'> = {
    labels: ['Nouveau', 'En cours', 'Traitée', 'Refusée'],
    datasets: [
      { 
        data: [0, 0, 0, 0], 
        label: 'Requêtes', 
        backgroundColor: this.modernColors.slice(0, 4),
        hoverBackgroundColor: this.modernHoverColors.slice(0, 4),
        borderWidth: 1,
        borderColor: '#FFFFFF',
        borderRadius: 8
      }
    ]
  };

  public userRoleChartData: ChartData<'pie'> = {
    labels: ['Clients', 'Guichetiers', 'Techniciens', 'Admins'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: this.modernColors.slice(0, 4),
      hoverBackgroundColor: this.modernHoverColors.slice(0, 4)
    }]
  };

  public technicianWorkloadChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ 
      data: [], 
      label: 'RDV', 
      backgroundColor: '#3B82F6', 
      hoverBackgroundColor: '#2563EB', 
      borderRadius: 8 
    }]
  };

  public productChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: this.modernColors.slice(0, 5),
      hoverBackgroundColor: this.modernHoverColors.slice(0, 5)
    }]
  };

  public productTrendChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ 
      data: [], 
      label: 'Requêtes par Produit', 
      backgroundColor: '#3B82F6', 
      hoverBackgroundColor: '#2563EB', 
      borderRadius: 8 
    }]
  };

  public ministereChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: this.modernColors.slice(0, 5),
      hoverBackgroundColor: this.modernHoverColors.slice(0, 5)
    }]
  };

  public rdvStatusChartData: ChartData<'bar'> = {
    labels: ['En attente', 'Terminé', 'Refusé'],
    datasets: [
      { 
        data: [0, 0, 0], 
        label: 'RDV', 
        backgroundColor: ['#F59E0B', '#10B981', '#EF4444'], 
        hoverBackgroundColor: ['#D97706', '#059669', '#DC2626'], 
        borderWidth: 1,
        borderColor: '#FFFFFF',
        borderRadius: 8
      }
    ]
  };

  public serviceChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: this.modernColors.slice(0, 5),
      hoverBackgroundColor: this.modernHoverColors.slice(0, 5)
    }]
  };

  public clientByMinistereChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: this.modernColors.slice(0, 5),
      hoverBackgroundColor: this.modernHoverColors.slice(0, 5)
    }]
  };

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