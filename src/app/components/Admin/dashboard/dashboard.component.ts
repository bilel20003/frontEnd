import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { DashboardService, DashboardData, DashboardRequete, DashboardRdv, DashboardUserInfo } from '../../../services/dashboard.service';
import { format, subDays } from 'date-fns';

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
  totalRdvs: number = 0; // Single declaration
  technicianWorkload: { id: number; username: string; rdvCount: number }[] = [];
  topProducts: { id: number; nom: string; requestCount: number }[] = [];
  qualityKpis: { sameDay: number; withinTwoDays: number; moreThanTwoDays: number } = { sameDay: 0, withinTwoDays: 0, moreThanTwoDays: 0 };
  displayedUsers: DashboardUserInfo[] = [];
  displayedRequests: DashboardRequete[] = [];
  displayedRdvs: DashboardRdv[] = [];
  displayedProducts: { id: number; nom: string; requestCount: number }[] = [];

  // Chart Configurations
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {},
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
          }
        }
      }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['Nouveau', 'En cours de traitement', 'Traitée', 'Refusée'],
    datasets: [{
      data: [0, 0, 0, 0],
      label: 'Requêtes',
      backgroundColor: ['#007bff', '#ffc107', '#28a745', '#dc3545']
    }]
  };

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: function(context) {
            const dataset = context.dataset;
            const total = (dataset.data as number[])
              .filter((val): val is number => typeof val === 'number' && val !== null)
              .reduce((sum, val) => sum + val, 0);
            const value = typeof context.parsed === 'number' ? context.parsed : 0;
            const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${percentage}%`;
          }
        }
      }
    }
  };
  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartData<'pie'> = {
    labels: ['Clients', 'Guichetiers', 'Techniciens'],
    datasets: [{ data: [0, 0, 0], backgroundColor: ['#ffcc00', '#2a5298', '#1e3c72'] }]
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: {}, y: { beginAtZero: true } },
    plugins: { legend: { display: false } }
  };
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{ data: [], label: 'Requêtes', borderColor: '#2a5298', fill: false }]
  };

  public technicianWorkloadChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'RDV', backgroundColor: '#2a5298' }]
  };

  public productChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#ffcc00', '#2a5298', '#1e3c72', '#ff6b6b', '#34d399'] }]
  };

  public ministereChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#ffcc00', '#2a5298', '#1e3c72', '#ff6b6b', '#34d399'] }]
  };

  public rdvStatusChartData: ChartData<'bar'> = {
    labels: ['En attente', 'Planifié', 'Terminé', 'Refusé'],
    datasets: [{ data: [0, 0, 0, 0], label: 'RDV', backgroundColor: ['#ffcc00', '#2a5298', '#1e3c72', '#ff6b6b'] }]
  };

  public qualityChartData: ChartData<'pie'> = {
    labels: ['Jour Même', '≤ 2 Jours', '> 2 Jours'],
    datasets: [{ data: [0, 0, 0], backgroundColor: ['#28a745', '#ffc107', '#dc3545'] }]
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

  // Utility method to check if chart data has non-zero values
  hasNonZeroData(chartData: ChartData<any>): boolean {
    return chartData?.datasets?.[0]?.data?.some((d: number) => d > 0) ?? false;
  }

  getRequestBadgeClass(etat: string): string {
    switch (etat?.toUpperCase()) {
      case 'NOUVEAU': return 'badge-primary';
      case 'EN_COURS_DE_TRAITEMENT': return 'badge-warning';
      case 'TRAITEE': return 'badge-success';
      case 'REFUSEE': return 'badge-danger';
      case 'BROUILLON': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  getRdvBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'EN_ATTENTE': return 'badge-warning';
      case 'PLANIFIE': return 'badge-info';
      case 'TERMINE': return 'badge-success';
      case 'REFUSE': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  getRoleBadgeClass(role: string): string {
    switch (role?.toUpperCase()) {
      case 'CLIENT': return 'badge-primary';
      case 'TECHNICIEN': return 'badge-warning';
      case 'GUICHETIER': return 'badge-info';
      case 'ADMIN': return 'badge-success';
      default: return 'badge-secondary';
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
    const { start, end } = this.getPeriodDates(this.requestPeriod, this.requestStartDate, this.requestEndDate);
    this.dashboardService.getDashboardData(start, end).subscribe({
      next: (data: DashboardData) => {
        console.log('Request data received:', data);
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

        const totalNonBrouillon = data.requestStatus.nouveau + data.requestStatus.enCours + 
                                 data.requestStatus.traitee + data.requestStatus.refusee;
        this.barChartData.datasets[0].data = totalNonBrouillon ? [
          (data.requestStatus.nouveau / totalNonBrouillon * 100),
          (data.requestStatus.enCours / totalNonBrouillon * 100),
          (data.requestStatus.traitee / totalNonBrouillon * 100),
          (data.requestStatus.refusee / totalNonBrouillon * 100)
        ] : [0, 0, 0, 0];

        this.lineChartData.labels = data.requestTrends.map(t => format(new Date(t.date), 'dd/MM'));
        this.lineChartData.datasets[0].data = data.requestTrends.map(t => t.count);
        this.ministereChartData.labels = data.requestsByMinistere.map(m => m.ministereName);
        this.ministereChartData.datasets[0].data = data.requestsByMinistere.map(m => m.requestCount);

        this.qualityKpis = data.qualityKpis;
        this.qualityChartData.datasets[0].data = [
          data.qualityKpis.sameDay,
          data.qualityKpis.withinTwoDays,
          data.qualityKpis.moreThanTwoDays
        ];

        this.allRequests = data.requests.map(req => ({
          ...req,
          etat: this.translateStatus(req.etat)
        }));
        this.totalRequestPages = this.allRequests.length;
        this.filterRequests();

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching request data:', error);
        this.loading = false;
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
        console.log('User data received:', data);
        this.pieChartData.datasets[0].data = [
          data.userRoles.clients || 0,
          data.userRoles.guichetiers || 0,
          data.userRoles.technicians || 0
        ];
        this.allUsers = data.users ? data.users.map(user => ({
          id: user.id,
          username: user.username,
          role: this.translateRole(user.role)
        })) : [];
        this.filterUsers();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching user data:', error);
      }
    });
  }

  loadRdvData(): void {
    if (this.rdvPeriod === 'custom' && (!this.rdvStartDate || !this.rdvEndDate)) {
      return;
    }
    const { start, end } = this.getPeriodDates(this.rdvPeriod, this.rdvStartDate, this.rdvEndDate);
    this.dashboardService.getDashboardData(start, end).subscribe({
      next: (data: DashboardData) => {
        console.log('RDV data received:', data.rdvs);
        this.totalRdvs = data.rdvs.length;
        this.technicianWorkload = data.technicianWorkload;
        this.technicianWorkloadChartData.labels = data.technicianWorkload.map(t => t.username);
        this.technicianWorkloadChartData.datasets[0].data = data.technicianWorkload.map(t => t.rdvCount);
        this.rdvStatusChartData.datasets[0].data = [
          data.rdvStatus.pending || 0,
          data.rdvStatus.scheduled || 0,
          data.rdvStatus.completed || 0,
          data.rdvStatus.refused || 0
        ];
        this.allRdvs = data.rdvs.map(rdv => ({
          ...rdv,
          status: this.translateStatus(rdv.status)
        }));
        this.totalRdvs = this.allRdvs.length;
        console.log('Processed RDVs:', this.allRdvs);
        this.filterRdvs();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching RDV data:', error);
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
        console.log('Product data received:', data.topProducts);
        this.topProducts = data.topProducts;
        this.productChartData.labels = data.topProducts.map(p => p.nom);
        this.productChartData.datasets[0].data = data.topProducts.map(p => p.requestCount);
        this.allProducts = data.topProducts;
        console.log('Processed products:', this.allProducts);
        this.filterProducts();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching product data:', error);
      }
    });
  }

  filterRequests(): void {
    const search = this.requestSearch.toLowerCase();
    this.displayedRequests = this.allRequests
      .filter(req => 
        req.id.toString().includes(search) ||
        (req.client?.username || '').toLowerCase().includes(search) ||
        req.etat.toLowerCase().includes(search)
      )
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
    this.totalRequestPages = this.allRequests.length;
    this.cdr.detectChanges();
  }

  filterUsers(): void {
    const search = this.userSearch.toLowerCase();
    this.displayedUsers = this.allUsers.filter(user => 
      user.id.toString().includes(search) ||
      user.username.toLowerCase().includes(search) ||
      user.role.toLowerCase().includes(search)
    );
    this.cdr.detectChanges();
  }

  filterRdvs(): void {
    const search = this.rdvSearch.toLowerCase();
    this.displayedRdvs = this.allRdvs
      .filter(rdv => 
        (rdv.id?.toString() || '').includes(search) ||
        (rdv.technicien?.username || '').toLowerCase().includes(search) ||
        (rdv.status || '').toLowerCase().includes(search)
      )
      .slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
    this.totalRdvs = this.allRdvs.length;
    this.cdr.detectChanges();
  }

  filterProducts(): void {
    const search = this.productSearch.toLowerCase();
    this.displayedProducts = this.allProducts.filter(product => 
      product.nom.toLowerCase().includes(search) ||
      product.requestCount.toString().includes(search)
    );
    this.cdr.detectChanges();
  }

  changePage(page: number, type: 'requests' | 'rdvs'): void {
    this.page = page;
    if (type === 'requests') {
      this.filterRequests();
    } else {
      this.filterRdvs();
    }
  }
}