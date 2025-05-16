import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DashboardService, DashboardData, DashboardRequete, DashboardRdv, DashboardUserInfo } from '../../../services/dashboard.service';
import { Statistics } from '../../../models/statistics.model';
import { format, subDays } from 'date-fns';

// Register Chart.js components and the ChartDataLabels plugin
Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Main statistics object
  statistics: Statistics | null = null;

  // Table Data
  displayedUsers: DashboardUserInfo[] = [];
  displayedRequests: DashboardRequete[] = [];
  displayedRdvs: DashboardRdv[] = [];
  displayedProducts: { id: number; nom: string; requestCount: number }[] = [];
  private allRequests: DashboardRequete[] = [];
  private allUsers: DashboardUserInfo[] = [];
  private allRdvs: DashboardRdv[] = [];
  private allProducts: { id: number; nom: string; requestCount: number }[] = [];

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

  // Pagination
  page: number = 1;
  pageSize: number = 5;
  totalRequestPages: number = 0;
  totalRdvPages: number = 0;
  loading: boolean = true;

  // Modern color palette
  private modernColors = [
    '#6B7280', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#FBBF24', '#14B8A6', '#F87171'
  ];

  private modernHoverColors = [
    '#4B5563', '#2563EB', '#059669', '#D97706', '#DC2626',
    '#7C3AED', '#DB2777', '#F59E0B', '#0D9488', '#EF4444'
  ];

  // Chart Configurations
  public qualityPieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { 
        title: { display: true, text: 'Catégories', color: '#1F2937', font: { size: 14, family: 'Inter', weight: 600 as any } },
        ticks: { color: '#6B7280' }
      },
      y: { 
        beginAtZero: true, 
        title: { display: true, text: 'Nombre de Requêtes', color: '#1F2937', font: { size: 14, family: 'Inter', weight: 600 as any } },
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
            const value = context.parsed as number;
            const dataset = context.dataset;
            const total = (dataset.data as number[]).reduce((sum: number, val: number) => sum + val, 0);
            const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
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
            const value = context.parsed as number;
            const dataset = context.dataset;
            const total = (dataset.data as number[]).reduce((sum: number, val: number) => sum + val, 0);
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
          const total = (dataset.data as number[]).reduce((sum: number, val: number) => sum + val, 0);
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
          const total = (dataset.data as number[]).reduce((sum: number, val: number) => sum + val, 0);
          const value = dataset.data[context.dataIndex] as number;
          return total ? (value / total) * 100 >= 5 : false;
        }
      }
    }
  };
  public pieChartType: ChartType = 'pie';

  public pieChartDataRequestStatus: ChartData<'pie'> = {
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
      x: { ticks: { color: '#6B7280' }, title: { display: true, text: 'Catégories', color: '#1F2937', font: { size: 14, family: 'Inter', weight: 600 as any } } },
      y: { beginAtZero: true, ticks: { color: '#6B7280' }, title: { display: true, text: 'Nombre', color: '#1F2937', font: { size: 14, family: 'Inter', weight: 600 as any } } }
    },
    plugins: { 
      legend: { display: true, labels: { color: '#1F2937', font: { size: 12, family: 'Inter' } } },
      tooltip: { 
        backgroundColor: '#1F2937',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        callbacks: { label: context => `${context.dataset.label}: ${context.parsed.y as number}` } 
      }
    }
  };
  public barChartType: ChartType = 'bar';

  public avgProcessingTimeChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { 
        title: { display: true, text: 'Statut', color: '#1F2937', font: { size: 14, family: 'Inter', weight: 600 as any } },
        ticks: { color: '#6B7280' }
      },
      y: { 
        beginAtZero: true,
        title: { display: true, text: 'Temps (minutes)', color: '#1F2937', font: { size: 14, family: 'Inter', weight: 600 as any } },
        ticks: { color: '#6B7280' }
      }
    },
    plugins: { 
      legend: { display: false },
      tooltip: { 
        backgroundColor: '#1F2937',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        callbacks: { label: context => `${context.parsed.y as number} minutes` } 
      }
    }
  };
  public avgProcessingTimeChartType: ChartType = 'line';
  public avgProcessingTimeChartData: ChartData<'line'> = {
    labels: ['En cours', 'Traitée', 'Refusée'],
    datasets: [{
      data: [0, 0, 0],
      label: 'Temps Moyen (minutes)',
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };

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
      x: { ticks: { color: '#6B7280' }, title: { display: true, text: 'Date', color: '#1F2937', font: { size: 14, family: 'Inter', weight: 600 as any } } },
      y: { beginAtZero: true, ticks: { color: '#6B7280' }, title: { display: true, text: 'Nombre de Requêtes', color: '#1F2937', font: { size: 14, family: 'Inter', weight: 600 as any } } }
    },
    plugins: { 
      legend: { display: false },
      tooltip: { 
        backgroundColor: '#1F2937',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF'
      }
    }
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

  public barChartDataRequestStatus: ChartData<'bar'> = {
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
        this.statistics = data.statistics;
        this.allRequests = data.requests;
        this.totalRequestPages = data.requests.length;

        this.pieChartData.datasets[0].data = [
          this.statistics.qualityMetrics.kpis.sameDay,
          this.statistics.qualityMetrics.kpis.withinTwoDays,
          this.statistics.qualityMetrics.kpis.moreThanTwoDays
        ];
        this.barChartDataRequestStatus.datasets[0].data = [
          this.statistics.requestStatus.nouveau,
          this.statistics.requestStatus.enCours,
          this.statistics.requestStatus.traitee,
          this.statistics.requestStatus.refusee
        ];
        this.pieChartDataRequestStatus.datasets[0].data = [
          this.statistics.requestStatus.nouveau,
          this.statistics.requestStatus.enCours,
          this.statistics.requestStatus.traitee,
          this.statistics.requestStatus.refusee
        ];
        this.lineChartData.labels = this.statistics.requestTrends.map(t => format(new Date(t.date), 'dd/MM'));
        this.lineChartData.datasets[0].data = this.statistics.requestTrends.map(t => t.count);
        this.ministereChartData.labels = this.statistics.requestsByMinistere.map(m => m.ministereName);
        this.ministereChartData.datasets[0].data = this.statistics.requestsByMinistere.map(m => m.requestCount);
        this.serviceChartData.labels = this.statistics.requestsByService.map(s => s.serviceName);
        this.serviceChartData.datasets[0].data = this.statistics.requestsByService.map(s => s.requestCount);
        this.dayOfWeekChartData.datasets[0].data = this.statistics.dayOfWeekDistribution;
        this.avgProcessingTimeChartData.datasets[0].data = [
          this.statistics.avgProcessingTimePerStatus.enCours,
          this.statistics.avgProcessingTimePerStatus.traitee,
          this.statistics.avgProcessingTimePerStatus.refusee
        ];

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
        this.statistics = data.statistics;
        this.userRoleChartData.datasets[0].data = [
          this.statistics.userRoles.clients,
          this.statistics.userRoles.guichetiers,
          this.statistics.userRoles.technicians,
          this.statistics.userRoles.admins
        ];
        this.clientByMinistereChartData.labels = this.statistics.clientsByMinistere.map(m => m.ministereName);
        this.clientByMinistereChartData.datasets[0].data = this.statistics.clientsByMinistere.map(m => m.clientCount);

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
        this.statistics = data.statistics;
        this.rdvStatusChartData.datasets[0].data = [
          this.statistics.rdvStatus.pending,
          this.statistics.rdvStatus.completed,
          this.statistics.rdvStatus.refused
        ];
        this.technicianWorkloadChartData.labels = this.statistics.technicianWorkload.map(t => t.username);
        this.technicianWorkloadChartData.datasets[0].data = this.statistics.technicianWorkload.map(t => t.rdvCount);

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
        this.statistics = data.statistics;
        this.allProducts = this.statistics.topProducts;
        this.productChartData.labels = this.statistics.topProducts.map(p => p.nom);
        this.productChartData.datasets[0].data = this.statistics.topProducts.map(p => p.requestCount);
        this.productTrendChartData.labels = this.statistics.topProducts.filter(p => p.nom !== 'Any').map(p => p.nom);
        this.productTrendChartData.datasets[0].data = this.statistics.topProducts.filter(p => p.nom !== 'Any').map(p => p.requestCount);

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

  changePage(newPage: number, type: 'requests' | 'rdvs' | 'users'): void {
    if (newPage < 1) return;
    let totalItems: number;
    if (type === 'requests') {
      totalItems = this.totalRequestPages;
    } else if (type === 'rdvs') {
      totalItems = this.totalRdvPages;
    } else if (type === 'users') {
      totalItems = this.allUsers.length; // Assuming total users length as a placeholder; adjust based on your data structure
    } else {
      return;
    }
    if (newPage * this.pageSize > totalItems && totalItems > 0) return;

    this.page = newPage;
    if (type === 'requests') {
      this.filterRequests();
    } else if (type === 'rdvs') {
      this.filterRdvs();
    } else if (type === 'users') {
      this.filterUsers();
    }
  }
}