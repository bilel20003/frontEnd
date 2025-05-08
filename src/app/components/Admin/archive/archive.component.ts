import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ArchiveService } from 'src/app/services/archive.service';
import { UserInfoService } from 'src/app/services/user-info.service';
import { HttpErrorResponse } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.css']
})
export class ArchiveComponent implements OnInit {
  tabs = [
    { name: 'ministeres', label: 'Ministères', fields: ['id', 'nomMinistere'] },
    { name: 'services', label: 'Services', fields: ['id', 'nomService', 'ministere.nomMinistere'] },
    { name: 'users', label: 'Utilisateurs', fields: ['id', 'name', 'email', 'role.name'] },
    { name: 'produits', label: 'Produits', fields: ['id', 'nom', 'prix'] },
    { name: 'objets', label: 'Objets', fields: ['id', 'name', 'produit.nom'] },
    { name: 'requetes', label: 'Requêtes', fields: ['id', 'type', 'etat', 'client.name'] },
    { name: 'rdvs', label: 'RDVs', fields: ['id', 'date', 'status', 'client.name'] }
  ];

  activeTab: string = this.tabs[0].name;
  currentTabFields: string[] = this.tabs[0].fields;
  data: any[] = [];
  filteredData: any[] = [];
  paginatedData: any[] = [];
  searchTerm: string = '';
  sortDirection: { [key: string]: boolean } = {};
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  isNightMode: boolean = false;

  constructor(
    private archiveService: ArchiveService,
    private userInfoService: UserInfoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkAdminAccess();
    const storedMode = localStorage.getItem('mode');
    if (storedMode === 'night') this.enableNightMode();
    this.loadData();
  }

  private checkAdminAccess(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.redirectToLogin();
      return;
    }

    try {
      const decoded = jwtDecode<{ id: number; role: string }>(token);
      if (decoded.role !== 'ADMIN') {
        alert('Accès réservé aux administrateurs.');
        this.router.navigate(['/home']);
        return;
      }
      this.userInfoService.getUserById(decoded.id).subscribe({
        next: (user) => {
          console.log('User info:', JSON.stringify(user, null, 2));
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error fetching user info:', err);
          this.redirectToLogin();
        }
      });
    } catch (e) {
      console.error('Error decoding token:', e);
      this.redirectToLogin();
    }
  }

  private redirectToLogin(): void {
    alert('Session invalide. Veuillez vous reconnecter.');
    this.router.navigate(['/login']);
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
    this.currentTabFields = this.tabs.find(t => t.name === tabName)?.fields || [];
    this.searchTerm = '';
    this.currentPage = 1;
    this.sortDirection = {};
    this.loadData();
  }

  loadData(): void {
    this.archiveService.getArchivedEntities(this.activeTab).subscribe({
      next: (data) => {
        console.log(`Archived ${this.activeTab} received:`, JSON.stringify(data, null, 2));
        this.data = data;
        this.filteredData = [...data];
        this.updatePagination();
      },
      error: (err: Error) => {
        console.error(`Error loading ${this.activeTab}:`, err.message);
        alert(err.message);
      }
    });
  }

  filterData(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredData = this.data.filter(item =>
      this.currentTabFields.some(field => {
        const value = this.getFieldValue(item, field);
        return value?.toString().toLowerCase().includes(term);
      })
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  getFieldValue(item: any, field: string): string {
    const parts = field.split('.');
    let value = item;
    for (const part of parts) {
      value = value?.[part];
      if (!value) break;
    }
    if (field === 'date' && value) {
      return new Date(value).toLocaleDateString('fr-FR');
    }
    return value?.toString() || 'N/A';
  }

  sort(field: string): void {
    if (this.sortDirection[field] === undefined) {
      this.sortDirection[field] = true;
    } else {
      this.sortDirection[field] = !this.sortDirection[field];
    }
    const dir = this.sortDirection[field] ? 1 : -1;

    this.filteredData.sort((a, b) => {
      const valA: any = this.getFieldValue(a, field);
      const valB: any = this.getFieldValue(b, field);

      if (field === 'id' || field.includes('prix')) {
        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        return dir * (numA - numB);
      } else if (field === 'date') {
        const dateA = new Date(a[field])?.getTime() || 0;
        const dateB = new Date(b[field])?.getTime() || 0;
        return dir * (dateA - dateB);
      } else {
        return dir * valA.localeCompare(valB, 'fr', { numeric: true });
      }
    });

    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedData = this.filteredData.slice(start, start + this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  onItemsPerPageChange(event: Event): void {
    this.itemsPerPage = Number((event.target as HTMLSelectElement).value);
    this.currentPage = 1;
    this.updatePagination();
  }

  toggleMode(): void {
    this.isNightMode = !this.isNightMode;
    this.isNightMode ? this.enableNightMode() : this.disableNightMode();
  }

  enableNightMode(): void {
    document.body.classList.add('night-mode');
    localStorage.setItem('mode', 'night');
    this.isNightMode = true;
  }

  disableNightMode(): void {
    document.body.classList.remove('night-mode');
    localStorage.setItem('mode', 'day');
    this.isNightMode = false;
  }

  unarchive(id: number): void {
    this.archiveService.unarchiveEntity(this.activeTab, id).subscribe({
      next: () => {
        console.log(`Unarchived ${this.activeTab} with ID ${id}`);
        this.data = this.data.filter(item => item.id !== id);
        this.filteredData = [...this.data];
        this.updatePagination();
        alert('Instance désarchivée avec succès.');
      },
      error: (err: Error) => {
        console.error(`Error unarchiving ${this.activeTab} with ID ${id}:`, err.message);
        alert(err.message);
      }
    });
  }
}