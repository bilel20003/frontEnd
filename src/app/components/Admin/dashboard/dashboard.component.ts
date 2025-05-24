import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DashboardService, DashboardData, DashboardRequete, DashboardRdv, DashboardUserInfo } from '../../../services/dashboard.service';
import { Statistics } from '../../../models/statistics.model';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Observable } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  statistics: Statistics | null = null;
  displayedUsers: DashboardUserInfo[] = [];
  displayedRequests: DashboardRequete[] = [];
  displayedRdvs: DashboardRdv[] = [];
  displayedProducts: { id: number; nom: string; requestCount: number }[] = [];
  private allRequests: DashboardRequete[] = [];
  private allUsers: DashboardUserInfo[] = [];
  private allRdvs: DashboardRdv[] = [];
  private allProducts: { id: number; nom: string; requestCount: number }[] = [];

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
  compareMonthRange: number = 6;

  requestSearch: string = '';
  userSearch: string = '';
  rdvSearch: string = '';
  productSearch: string = '';

  page: number = 1;
  pageSize: number = 5;
  totalRequestPages: number = 0;
  totalUserPages: number = 0;
  totalRdvPages: number = 0;
  totalProductPages: number = 0;
  loading: boolean = true;

  userRole: string | null = null;

  private modernColors = [
    '#6B7280', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#FBBF24', '#14B8A6', '#F87171'
  ];

  private modernHoverColors = [
    '#4B5563', '#2563EB', '#059669', '#D97706', '#DC2626',
    '#7C3AED', '#DB2777', '#F59E0B', '#0D9488', '#EF4444'
  ];

  @ViewChild('qualityChart') qualityChart!: ElementRef;
  @ViewChild('requestStatusBarChart') requestStatusBarChart!: ElementRef;
  @ViewChild('requestStatusPieChart') requestStatusPieChart!: ElementRef;
  @ViewChild('ministereChart') ministereChart!: ElementRef;
  @ViewChild('serviceChart') serviceChart!: ElementRef;
  @ViewChild('lineChart') lineChart!: ElementRef;
  @ViewChild('dayOfWeekChart') dayOfWeekChart!: ElementRef;
  @ViewChild('avgProcessingTimeChart') avgProcessingTimeChart!: ElementRef;
  @ViewChild('userRoleChart') userRoleChart!: ElementRef;
  @ViewChild('clientByMinistereChart') clientByMinistereChart!: ElementRef;
  @ViewChild('rdvStatusChart') rdvStatusChart!: ElementRef;
  @ViewChild('technicianWorkloadChart') technicianWorkloadChart!: ElementRef;
  @ViewChild('productChart') productChart!: ElementRef;
  @ViewChild('productTrendChart') productTrendChart!: ElementRef;
  @ViewChild('monthlyTrendChart') monthlyTrendChart!: ElementRef;

  private charts: { [key: string]: Chart | null } = {};

  public qualityPieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#1F2937', font: { size: 12, family: 'Inter' } } },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const total = (context.dataset.data as number[]).reduce((sum: number, val: number) => sum + val, 0);
            const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#FFFFFF',
        font: { size: 12, weight: 'bold', family: 'Inter' },
        formatter: (value: number) => value > 0 ? value.toString() : '',
        anchor: 'end',
        align: 'end',
        offset: 10
      }
    },
    onClick: (event, elements) => this.onChartClick(event, elements, 'quality')
  };
  public qualityPieChartType: ChartType = 'pie';
  public pieChartData: ChartData<'pie'> = {
    labels: ['Même Jour', '≤ 2 Jours', '> 2 Jours'],
    datasets: [{
      data: [],
      backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
      hoverBackgroundColor: ['#16a34a', '#d97706', '#dc2626'],
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
        color: '#000000',
        font: { size: 12, weight: 'bold', family: 'Inter' },
        formatter: (value: number, context) => {
          const dataset = context.dataset;
          const total = (dataset.data as number[]).reduce((sum: number, val: number) => sum + val, 0);
          const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
          return percentage !== '0.0' ? `${percentage}%` : '';
        },
        anchor: 'center',
        align: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
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
    },
    onClick: (event, elements) => this.onChartClick(event, elements, 'pie')
  };
  public pieChartType: ChartType = 'pie';

  public pieChartDataRequestStatus: ChartData<'pie'> = {
    labels: ['Nouveau', 'En cours', 'Traitée', 'Refusée'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#EF4444'],
      hoverBackgroundColor: ['#2563EB', '#D97706', '#059669', '#DC2626']
    }]
  };

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { 
      x: { ticks: { color: '#6B7280' }, title: { display: true, text: 'Catégories', color: '#1F2937', font: { size: 14, family: 'Inter', weight: 600 } } },
      y: { beginAtZero: true, ticks: { color: '#6B7280', stepSize: 1 }, title: { display: true, text: 'Nombre', color: '#1F2937', font: { size: 14, family: 'Inter', weight: 600 } } }
    },
    plugins: { 
      legend: { display: true, labels: { color: '#1F2937', font: { size: 12, family: 'Inter' } } },
      tooltip: { 
        backgroundColor: '#1F2937',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        callbacks: { label: context => `${context.dataset.label}: ${context.parsed.y as number}` } 
      },
      datalabels: {
        color: '#FFFFFF',
        font: { size: 12, weight: 'bold', family: 'Inter' },
        formatter: (value: number) => value > 0 ? value.toString() : '',
        anchor: 'end',
        align: 'end',
        offset: 10
      }
    },
    onClick: (event, elements) => this.onChartClick(event, elements, 'bar')
  };
  public barChartType: ChartType = 'bar';

  public avgProcessingTimeChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { 
        title: { display: true, text: 'Statut', color: '#1F2937', font: { size: 14, family: 'Inter', weight: 600 } },
        ticks: { color: '#6B7280' }
      },
      y: { 
        beginAtZero: true,
        title: { display: true, text: 'Temps (minutes)', color: '#1F2937', font: { size: 14, family: 'Inter', weight: 600 } },
        ticks: { color: '#6B7280', stepSize: 1 }
      }
    },
    plugins: { 
      legend: { display: false },
      tooltip: { 
        backgroundColor: '#1F2937',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        callbacks: { label: context => `${context.parsed.y as number} minutes` } 
      },
      datalabels: {
        color: '#FFFFFF',
        font: { size: 12, weight: 'bold', family: 'Inter' },
        formatter: (value: number) => value > 0 ? value.toString() : '',
        anchor: 'end',
        align: 'end',
        offset: 10
      }
    },
    onClick: (event, elements) => this.onChartClick(event, elements, 'avgProcessingTime')
  };
  public avgProcessingTimeChartType: ChartType = 'bar';
  public avgProcessingTimeChartData: ChartData<'bar'> = {
    labels: ['Traitée', 'Refusée'],
    datasets: [{
      data: [0, 0],
      label: 'Temps Moyen (minutes)',
      backgroundColor: ['#10B981', '#EF4444'],
      hoverBackgroundColor: ['#059669', '#DC2626'],
      barThickness: 50,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#FFFFFF'
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
      x: { ticks: { color: '#6B7280' }, title: { display: true, text: 'Date', color: '#1F2937', font: { size: 14, family: 'Inter', weight: 600 } } },
      y: { beginAtZero: true, ticks: { color: '#6B7280', stepSize: 1 }, title: { display: true, text: 'Nombre de Requêtes', color: '#1F2937', font: { size: 14, family: 'Inter', weight: 600 } } }
    },
    plugins: { 
      legend: { display: false },
      tooltip: { 
        backgroundColor: '#1F2937',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF'
      },
      datalabels: {
        color: '#FFFFFF',
        font: { size: 12, weight: 'bold', family: 'Inter' },
        formatter: (value: number) => value > 0 ? value.toString() : '',
        anchor: 'end',
        align: 'end',
        offset: 10
      }
    },
    onClick: (event, elements) => this.onChartClick(event, elements, 'line')
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
        backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#EF4444'],
        hoverBackgroundColor: ['#2563EB', '#D97706', '#059669', '#DC2626'],
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

  public monthlyTrendChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      { label: 'Requêtes', data: [], borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6 },
      { label: 'RDVs', data: [], borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.2)', fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6 }
    ]
  };

  public monthlyTrendChartOptions: ChartConfiguration['options'] & { scales: { x: any; y: any } } = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { 
      x: { 
        ticks: { color: '#6B7280' }, 
        title: { display: true, text: 'Mois', color: '#1F2937', font: { size: 14, family: 'Inter', weight: 600 } } 
      },
      y: { 
        beginAtZero: true, 
        ticks: { color: '#6B7280', stepSize: 1 }, 
        title: { display: true, text: 'Nombre', color: '#1F2937', font: { size: 14, family: 'Inter', weight: 600 } },
        min: 0,
        max: undefined
      }
    },
    plugins: { 
      legend: { display: true, labels: { color: '#1F2937', font: { size: 12, family: 'Inter' } } },
      tooltip: { 
        backgroundColor: '#1F2937',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        callbacks: { label: context => `${context.dataset.label}: ${context.parsed.y as number}` } 
      },
      datalabels: {
        color: '#FFFFFF',
        font: { size: 12, weight: 'bold', family: 'Inter' },
        formatter: (value: number) => value > 0 ? value.toString() : '',
        anchor: 'end',
        align: 'end',
        offset: 10
      }
    },
    onClick: (event, elements) => this.onChartClick(event, elements, 'monthlyTrend')
  };
  public monthlyTrendChartType: ChartType = 'line';

  constructor(
  private dashboardService: DashboardService,
  private cdr: ChangeDetectorRef,
  private authService: AuthService
) {}

  ngOnInit(): void {
  this.loading = true;
  this.userRole = this.authService.getRole();
  this.initializeCharts();
  this.loadAllData();
}

  ngAfterViewInit(): void {
    this.createCharts();
  }

  initializeCharts(): void {
    this.charts = {
      quality: null,
      pie: null,
      bar: null,
      avgProcessingTime: null,
      line: null,
      userRole: null,
      clientByMinistere: null,
      rdvStatus: null,
      technicianWorkload: null,
      product: null,
      productTrend: null,
      ministere: null,
      service: null,
      monthlyTrend: null
    };
  }

  createCharts(): void {
    if (this.qualityChart?.nativeElement) {
      this.charts['quality'] = new Chart(this.qualityChart.nativeElement, { type: this.qualityPieChartType, data: this.pieChartData, options: this.qualityPieChartOptions });
    }
    if (this.requestStatusBarChart?.nativeElement) {
      this.charts['bar'] = new Chart(this.requestStatusBarChart.nativeElement, { type: this.barChartType, data: this.barChartDataRequestStatus, options: this.barChartOptions });
    }
    if (this.requestStatusPieChart?.nativeElement) {
      this.charts['pie'] = new Chart(this.requestStatusPieChart.nativeElement, { type: this.pieChartType, data: this.pieChartDataRequestStatus, options: this.pieChartOptions });
    }
    if (this.avgProcessingTimeChart?.nativeElement) {
      this.charts['avgProcessingTime'] = new Chart(this.avgProcessingTimeChart.nativeElement, { type: this.avgProcessingTimeChartType, data: this.avgProcessingTimeChartData, options: this.avgProcessingTimeChartOptions });
    }
    if (this.lineChart?.nativeElement) {
      this.charts['line'] = new Chart(this.lineChart.nativeElement, { type: this.lineChartType, data: this.lineChartData, options: this.lineChartOptions });
    }
    if (this.dayOfWeekChart?.nativeElement) {
      this.charts['dayOfWeek'] = new Chart(this.dayOfWeekChart.nativeElement, { type: this.pieChartType, data: this.dayOfWeekChartData, options: this.pieChartOptions });
    }
    if (this.userRoleChart?.nativeElement) {
      this.charts['userRole'] = new Chart(this.userRoleChart.nativeElement, { type: this.pieChartType, data: this.userRoleChartData, options: this.pieChartOptions });
    }
    if (this.clientByMinistereChart?.nativeElement) {
      this.charts['clientByMinistere'] = new Chart(this.clientByMinistereChart.nativeElement, { type: this.pieChartType, data: this.clientByMinistereChartData, options: this.pieChartOptions });
    }
    if (this.rdvStatusChart?.nativeElement) {
      this.charts['rdvStatus'] = new Chart(this.rdvStatusChart.nativeElement, { type: this.barChartType, data: this.rdvStatusChartData, options: this.barChartOptions });
    }
    if (this.technicianWorkloadChart?.nativeElement) {
      this.charts['technicianWorkload'] = new Chart(this.technicianWorkloadChart.nativeElement, { type: this.barChartType, data: this.technicianWorkloadChartData, options: this.barChartOptions });
    }
    if (this.productChart?.nativeElement) {
      this.charts['product'] = new Chart(this.productChart.nativeElement, { type: this.pieChartType, data: this.productChartData, options: this.pieChartOptions });
    }
    if (this.productTrendChart?.nativeElement) {
      this.charts['productTrend'] = new Chart(this.productTrendChart.nativeElement, { type: this.barChartType, data: this.productTrendChartData, options: this.barChartOptions });
    }
    if (this.ministereChart?.nativeElement) {
      this.charts['ministere'] = new Chart(this.ministereChart.nativeElement, { type: this.pieChartType, data: this.ministereChartData, options: this.pieChartOptions });
    }
    if (this.serviceChart?.nativeElement) {
      this.charts['service'] = new Chart(this.serviceChart.nativeElement, { type: this.pieChartType, data: this.serviceChartData, options: this.pieChartOptions });
    }
    if (this.monthlyTrendChart?.nativeElement) {
      this.charts['monthlyTrend'] = new Chart(this.monthlyTrendChart.nativeElement, { type: this.monthlyTrendChartType, data: this.monthlyTrendChartData, options: this.monthlyTrendChartOptions });
    }
  }

  onChartClick(event: any, elements: any[], chartType: string): void {
    if (elements.length > 0) {
      const chart = this.charts[chartType];
      if (chart) {
        const index = elements[0].index;
        const label = chart.data.labels ? chart.data.labels[index] : 'Inconnu';
        const value = chart.data.datasets[0].data[index];
        alert(`Clic sur ${label} avec la valeur ${value}`);
      }
    }
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
    this.loadCompareData();
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
        this.handleRequestData(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données des requêtes:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private handleRequestData(data: DashboardData): void {
    this.statistics = data.statistics || null;
    this.allRequests = data.requests || [];
    this.totalRequestPages = this.allRequests.length;

    if (this.statistics) {
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
      this.lineChartData.labels = this.statistics.requestTrends.map(t => format(new Date(t.date), 'dd/MM', { locale: fr }));
      this.lineChartData.datasets[0].data = this.statistics.requestTrends.map(t => t.count);
      this.ministereChartData.labels = this.statistics.requestsByMinistere.map(m => m.ministereName);
      this.ministereChartData.datasets[0].data = this.statistics.requestsByMinistere.map(m => m.requestCount);
      this.serviceChartData.labels = this.statistics.requestsByService.map(s => s.serviceName);
      this.serviceChartData.datasets[0].data = this.statistics.requestsByService.map(s => s.requestCount);
      this.dayOfWeekChartData.datasets[0].data = this.statistics.dayOfWeekDistribution;
      this.avgProcessingTimeChartData.datasets[0].data = [
        this.statistics.avgProcessingTimePerStatus.traitee,
        this.statistics.avgProcessingTimePerStatus.refusee
      ];
    }

    this.filterRequests();
    this.updateCharts();
    this.loading = false;
    this.cdr.detectChanges();
  }

  loadUserData(): void {
    if (this.userPeriod === 'custom' && (!this.userStartDate || !this.userEndDate)) {
      return;
    }
    const { start, end } = this.getPeriodDates(this.userPeriod, this.userStartDate, this.userEndDate);
    this.dashboardService.getDashboardData(start, end).subscribe({
      next: (data: DashboardData) => {
        this.handleUserData(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données des utilisateurs:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private handleUserData(data: DashboardData): void {
    this.statistics = data.statistics || null;
    if (this.statistics) {
      this.userRoleChartData.datasets[0].data = [
        this.statistics.userRoles.clients,
        this.statistics.userRoles.guichetiers,
        this.statistics.userRoles.technicians,
        this.statistics.userRoles.admins
      ];
      this.clientByMinistereChartData.labels = this.statistics.clientsByMinistere.map(m => m.ministereName);
      this.clientByMinistereChartData.datasets[0].data = this.statistics.clientsByMinistere.map(m => m.clientCount);
    }

    this.allUsers = data.users || [];
    this.totalUserPages = this.allUsers.length;
    this.filterUsers();
    this.updateCharts();
    this.loading = false;
    this.cdr.detectChanges();
  }

  loadRdvData(): void {
    if (this.rdvPeriod === 'custom' && (!this.rdvStartDate || !this.rdvEndDate)) {
      return;
    }
    this.loading = true;
    const { start, end } = this.getPeriodDates(this.rdvPeriod, this.rdvStartDate, this.rdvEndDate);
    this.dashboardService.getDashboardData(start, end).subscribe({
      next: (data: DashboardData) => {
        this.handleRdvData(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données des RDVs:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private handleRdvData(data: DashboardData): void {
    this.statistics = data.statistics || null;
    if (this.statistics) {
      this.rdvStatusChartData.datasets[0].data = [
        this.statistics.rdvStatus.pending,
        this.statistics.rdvStatus.completed,
        this.statistics.rdvStatus.refused
      ];
      this.technicianWorkloadChartData.labels = this.statistics.technicianWorkload.map(t => t.username);
      this.technicianWorkloadChartData.datasets[0].data = this.statistics.technicianWorkload.map(t => t.rdvCount);
    }

    this.allRdvs = data.rdvs || [];
    this.totalRdvPages = this.allRdvs.length;
    this.filterRdvs();
    this.updateCharts();
    this.loading = false;
    this.cdr.detectChanges();
  }

  loadProductData(): void {
    if (this.productPeriod === 'custom' && (!this.productStartDate || !this.productEndDate)) {
      return;
    }
    const { start, end } = this.getPeriodDates(this.productPeriod, this.productStartDate, this.productEndDate);
    this.dashboardService.getDashboardData(start, end).subscribe({
      next: (data: DashboardData) => {
        this.handleProductData(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données des produits:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private handleProductData(data: DashboardData): void {
    this.statistics = data.statistics || null;
    if (this.statistics) {
      this.allProducts = this.statistics.topProducts || [];
      this.totalProductPages = this.allProducts.length;
      this.productChartData.labels = this.statistics.topProducts.map(p => p.nom);
      this.productChartData.datasets[0].data = this.statistics.topProducts.map(p => p.requestCount);
      this.productTrendChartData.labels = this.statistics.topProducts.filter(p => p.nom !== 'Any').map(p => p.nom);
      this.productTrendChartData.datasets[0].data = this.statistics.topProducts.filter(p => p.nom !== 'Any').map(p => p.requestCount);
    }

    this.filterProducts();
    this.updateCharts();
    this.loading = false;
    this.cdr.detectChanges();
  }

  loadCompareData(): void {
    const endDate = new Date();
    const startDate = subMonths(endDate, this.compareMonthRange);
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    const requestsData: number[] = new Array(months.length).fill(0);
    const rdvsData: number[] = new Array(months.length).fill(0);

    const fetchObservables: Observable<void>[] = months.map((month, index) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      return new Observable<void>(observer => {
        this.dashboardService.getDashboardData(monthStart, monthEnd).subscribe({
          next: (data: DashboardData) => {
            requestsData[index] = data.requests?.length || 0;
            rdvsData[index] = data.statistics?.kpiMetrics.totalRdvs || 0;
            observer.next();
            observer.complete();
          },
          error: (err) => {
            console.error(`Erreur lors du chargement des données pour ${format(month, 'MMMM yyyy', { locale: fr })}:`, err);
            observer.next();
            observer.complete();
          }
        });
      });
    });

    Promise.all(fetchObservables.map(obs => new Promise<void>((resolve) => obs.subscribe({ complete: () => resolve() })))).then(() => {
      // Mettre à jour les données du graphique
      this.monthlyTrendChartData.labels = months.map(month => format(month, 'MMM yyyy', { locale: fr }));
      this.monthlyTrendChartData.datasets[0].data = requestsData;
      this.monthlyTrendChartData.datasets[1].data = rdvsData;

      // Calculer la valeur maximale pour l'échelle Y
      const allData = [...requestsData, ...rdvsData];
      const maxValue = Math.max(...allData, 0);
      const newMax = maxValue > 0 ? Math.ceil(maxValue * 1.1) : 10;

      // Créer une nouvelle copie des options pour forcer la mise à jour
      this.monthlyTrendChartOptions = {
        ...this.monthlyTrendChartOptions,
        scales: {
          ...this.monthlyTrendChartOptions.scales,
          y: {
            ...this.monthlyTrendChartOptions.scales.y,
            max: newMax
          }
        }
      };

      // Réassigner les données et options au graphique
      const chart = this.charts['monthlyTrend'];
      if (chart) {
        chart.data = this.monthlyTrendChartData;
        chart.options = this.monthlyTrendChartOptions;
        chart.update();
      }

      this.cdr.detectChanges();
    }).catch(err => {
      console.error('Erreur lors du chargement des données de comparaison mensuelle:', err);
      this.cdr.detectChanges();
    });
  }
  
  updateCharts(): void {
    Object.entries(this.charts).forEach(([key, chart]) => {
      if (chart) {
        const chartData = this.getChartData(key);
        if (this.hasNonZeroData(chartData)) {
          chart.data = chartData;
          chart.update();
        }
      }
    });
  }

  private getChartData(key: string): ChartData<any> {
    switch (key) {
      case 'quality': return this.pieChartData;
      case 'pie': return this.pieChartDataRequestStatus;
      case 'bar': return this.barChartDataRequestStatus;
      case 'avgProcessingTime': return this.avgProcessingTimeChartData;
      case 'line': return this.lineChartData;
      case 'dayOfWeek': return this.dayOfWeekChartData;
      case 'userRole': return this.userRoleChartData;
      case 'clientByMinistere': return this.clientByMinistereChartData;
      case 'rdvStatus': return this.rdvStatusChartData;
      case 'technicianWorkload': return this.technicianWorkloadChartData;
      case 'product': return this.productChartData;
      case 'productTrend': return this.productTrendChartData;
      case 'ministere': return this.ministereChartData;
      case 'service': return this.serviceChartData;
      case 'monthlyTrend': return this.monthlyTrendChartData;
      default: return { labels: [], datasets: [] };
    }
  }

  filterRequests(): void {
    const search = this.requestSearch.toLowerCase();
    this.displayedRequests = this.allRequests
      .filter(req => 
        req.id.toString().includes(search) ||
        req.client?.username?.toLowerCase().includes(search) ||
        req.etat.toLowerCase().includes(search) ||
        (req.date && format(new Date(req.date), 'dd/MM/yyyy', { locale: fr }).includes(search))
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
        rdv.id?.toString().includes(search) ||
        rdv.technicien?.username?.toLowerCase().includes(search) ||
        (rdv.dateSouhaitee && format(new Date(rdv.dateSouhaitee), 'dd/MM/yyyy', { locale: fr }).includes(search)) ||
        rdv.status?.toLowerCase().includes(search)
      )
      .slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
  }

  filterProducts(): void {
    const search = this.productSearch.toLowerCase();
    this.displayedProducts = this.allProducts
      .filter(product => 
        product.id.toString().includes(search) ||
        product.nom.toLowerCase().includes(search) ||
        product.requestCount.toString().includes(search)
      )
      .slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
  }

  changePage(newPage: number, type: string): void {
    this.page = newPage;
    switch (type) {
      case 'requests': this.filterRequests(); break;
      case 'users': this.filterUsers(); break;
      case 'rdvs': this.filterRdvs(); break;
      case 'products': this.filterProducts(); break;
    }
  }
}