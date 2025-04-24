import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { RequeteService } from 'src/app/services/requete.service';
import { ObjetService } from 'src/app/services/objet.service';
import { Requete } from 'src/app/models/requete.model';
import { Objet } from 'src/app/models/objet.model';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-tech-home',
  templateUrl: './tech-home.component.html',
  styleUrls: ['./tech-home.component.css']
})
export class TechHomeComponent implements OnInit {
  reclamations: Requete[] = [];
  filteredReclamations: Requete[] = [];
  paginatedReclamations: Requete[] = [];
  objets: Objet[] = [];
  objetMap: { [key: number]: Objet } = {};
  searchTerm: string = '';
  sortDirection: { [key: string]: boolean } = {};
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  popupOpen: boolean = false;
  selectedReclamation: Requete | null = null;
  noteRetour: string = '';
  isNightMode: boolean = false;
  isObjetsLoaded: boolean = false;

  constructor(
    private router: Router,
    private requeteService: RequeteService,
    private objetService: ObjetService
  ) {}

  ngOnInit(): void {
    const technicienId = this.getTechnicienIdFromToken();
    console.log('Technician ID from token:', technicienId);
    if (technicienId) {
      this.loadObjets();
      this.loadReclamations(technicienId);
    } else {
      console.error('No technician ID found in token');
      alert('Session invalide. Veuillez vous reconnecter.');
      this.router.navigate(['/login']);
    }
  }

  private getTechnicienIdFromToken(): number | null {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return null;
    }

    try {
      const decoded = jwtDecode<{ id: number, role: string }>(token);
      console.log('Decoded token:', decoded);
      return decoded.id ?? null;
    } catch (e) {
      console.error('Erreur de décodage du token:', e);
      return null;
    }
  }

  private loadObjets(): void {
    this.objetService.getAllObjets().subscribe({
      next: (objets) => {
        console.log('Objets received:', objets);
        this.objets = objets;
        this.objetMap = objets.reduce((map, obj) => {
          map[obj.id] = obj;
          return map;
        }, {} as { [key: number]: Objet });
        this.isObjetsLoaded = true;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading objets:', err);
        alert('Impossible de charger les objets.');
        this.isObjetsLoaded = true;
      }
    });
  }

  loadReclamations(technicienId: number): void {
    console.log('Loading reclamations for technician ID:', technicienId);
    this.requeteService.getRequetesByTechnicienId(technicienId).subscribe({
      next: (data) => {
        console.log('Reclamations received:', data);
        this.reclamations = data;
        this.filteredReclamations = [...this.reclamations];
        this.updatePagination();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des réclamations:', error);
        alert('Impossible de charger les réclamations. Vérifiez votre connexion ou reconnectez-vous.');
      }
    });
  }

  filterReclamations(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredReclamations = this.reclamations.filter(reclamation => {
      const objet = this.objetMap[reclamation.objet.id];
      return (
        Object.values(reclamation).some(val =>
          (typeof val === 'string' || typeof val === 'number' || val instanceof Date) &&
          val.toString().toLowerCase().includes(term)
        ) ||
        (objet?.name?.toLowerCase()?.includes(term) ?? false) ||
        (reclamation.client?.id?.toString().includes(term) ?? false)
      );
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  sort(column: string): void {
    this.sortDirection[column] = !this.sortDirection[column];
    const direction = this.sortDirection[column] ? 1 : -1;

    this.filteredReclamations.sort((a, b) => {
      let valA: any = a[column as keyof Requete];
      let valB: any = b[column as keyof Requete];

      if (column === 'client') {
        valA = a.client?.id ?? 0;
        valB = b.client?.id ?? 0;
      } else if (column === 'objet') {
        valA = this.objetMap[a.objet.id]?.name ?? 'N/A';
        valB = this.objetMap[b.objet.id]?.name ?? 'N/A';
      } else if (column === 'date') {
        valA = a.date ? new Date(a.date).getTime() : 0;
        valB = b.date ? new Date(b.date).getTime() : 0;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return direction * (valA - valB);
      } else if (valA instanceof Date && valB instanceof Date) {
        return direction * (valA.getTime() - valB.getTime());
      }
      return direction * valA.toString().localeCompare(valB.toString(), 'fr', { numeric: true });
    });

    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredReclamations.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedReclamations = this.filteredReclamations.slice(start, start + this.itemsPerPage);
  }

  onItemsPerPageChange(event: Event): void {
    this.itemsPerPage = Number((event.target as HTMLSelectElement).value);
    this.currentPage = 1;
    this.updatePagination();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const maxPagesToShow = 5;
    const pages: number[] = [];
    let startPage: number, endPage: number;

    if (this.totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = this.totalPages;
    } else {
      const half = Math.floor(maxPagesToShow / 2);
      startPage = Math.max(1, this.currentPage - half);
      endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = endPage - maxPagesToShow + 1;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  getBadgeClass(etat: string): string {
    switch (etat.toUpperCase()) {
      case 'NOUVEAU': return 'badge-primary';
      case 'EN_COURS_DE_TRAITEMENT': return 'badge-warning';
      case 'TRAITEE': return 'badge-success';
      case 'REFUSEE': return 'badge-danger';
      case 'BROUILLON': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  openPopup(reclamation: Requete): void {
    this.selectedReclamation = reclamation;
    this.noteRetour = reclamation.noteRetour || '';
    this.popupOpen = true;
  }

  closePopup(): void {
    this.popupOpen = false;
    this.selectedReclamation = null;
    this.noteRetour = '';
  }

  confirmerTraitement(): void {
    if (!this.noteRetour) {
      alert('Veuillez remplir la note de retour.');
      return;
    }

    if (this.selectedReclamation) {
      this.selectedReclamation.etat = 'TRAITEE';
      this.selectedReclamation.noteRetour = this.noteRetour;
      this.requeteService.updateRequete(this.selectedReclamation.id, this.selectedReclamation).subscribe({
        next: () => {
          console.log('Requête traitée');
          this.loadReclamations(this.getTechnicienIdFromToken()!);
          this.closePopup();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur lors du traitement de la requête', error);
          alert('Erreur lors du traitement de la requête.');
        }
      });
    }
  }

  refuserReclamation(id: number): void {
    const reclamation = this.reclamations.find(r => r.id === id);
    if (reclamation) {
      reclamation.etat = 'REFUSEE';
      this.requeteService.updateRequete(id, reclamation).subscribe({
        next: () => {
          console.log('Réclamation refusée');
          this.loadReclamations(this.getTechnicienIdFromToken()!);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur lors du refus de la réclamation', error);
          alert('Erreur lors du refus de la réclamation.');
        }
      });
    }
  }

  toggleMode(): void {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }
}