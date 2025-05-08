import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { RequeteService } from 'src/app/services/requete.service';
import { ObjetService } from 'src/app/services/objet.service';
import { UserInfoService } from 'src/app/services/user-info.service';
import { UserInfo } from 'src/app/models/user-info.model';
import { Requete } from 'src/app/models/requete.model';
import { Objet } from 'src/app/models/objet.model';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-gui-home',
  templateUrl: './gui-home.component.html',
  styleUrls: ['./gui-home.component.css']
})
export class GuiHomeComponent implements OnInit {
  reclamations: Requete[] = [];
  filteredReclamations: Requete[] = [];
  paginatedReclamations: Requete[] = [];
  objets: Objet[] = [];
  objetMap: { [key: number]: Objet } = {};
  techniciens: UserInfo[] = [];
  searchTerm: string = '';
  sortDirection: { [key: string]: boolean } = {};
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  isPopupOpen: boolean = false;
  isTechnicienPopupOpen: boolean = false;
  selectedRequete: Requete | null = null;
  selectedTechnicienId: number | null = null;
  noteRetour: string = '';
  isObjetsLoaded: boolean = false;
  isNightMode: boolean = false;

  constructor(
    private router: Router,
    private requeteService: RequeteService,
    private objetService: ObjetService,
    private userInfoService: UserInfoService
  ) {}

  ngOnInit(): void {
    const guichetierId = this.getGuichetierIdFromToken();
    if (guichetierId) {
      this.loadObjets();
      this.loadReclamations(guichetierId);
      this.loadTechnicians();
    } else {
      alert('Session invalide. Veuillez vous reconnecter.');
      this.router.navigate(['/login']);
    }
  }

  toggleMode(): void {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }

  private getGuichetierIdFromToken(): number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decoded = jwtDecode<{ id: number }>(token);
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

  private loadTechnicians(): void {
    this.userInfoService.getAllTechniciens().subscribe({
      next: (techniciens) => {
        console.log('Techniciens received:', techniciens);
        console.log('Technician IDs:', techniciens.map(t => t.id));
        this.techniciens = techniciens;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading techniciens:', err);
        alert('Impossible de charger la liste des techniciens.');
      }
    });
  }

  loadReclamations(guichetierId: number): void {
    this.requeteService.getRequetesByGuichetierId(guichetierId).subscribe({
      next: (data) => {
        console.log('Reclamations received:', data);
        this.reclamations = data;
        this.filteredReclamations = [...this.reclamations];
        this.updatePagination();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des réclamations', error);
        alert('Impossible de charger les réclamations.');
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
        (reclamation.client.name.toLowerCase().includes(term) ?? false) ||
        (reclamation.client.service?.ministere?.nomMinistere?.toLowerCase()?.includes(term) ?? false) ||
        (reclamation.client.service?.nomService?.toLowerCase()?.includes(term) ?? false) ||
        (reclamation.objet.produit?.nom?.toLowerCase()?.includes(term) ?? false)
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
        valA = a.client.name ?? 'N/A';
        valB = b.client.name ?? 'N/A';
      } else if (column === 'objet') {
        valA = this.objetMap[a.objet.id]?.name ?? 'N/A';
        valB = this.objetMap[b.objet.id]?.name ?? 'N/A';
      } else if (column === 'date') {
        valA = a.date ? new Date(a.date).getTime() : 0;
        valB = b.date ? new Date(b.date).getTime() : 0;
      } else if (column === 'ministere') {
        valA = a.client.service?.ministere?.nomMinistere ?? 'N/A';
        valB = b.client.service?.ministere?.nomMinistere ?? 'N/A';
      } else if (column === 'service') {
        valA = a.client.service?.nomService ?? 'N/A';
        valB = b.client.service?.nomService ?? 'N/A';
      } else if (column === 'produit') {
        valA = a.objet.produit?.nom ?? 'N/A';
        valB = b.objet.produit?.nom ?? 'N/A';
      } else if (column === 'type' || column === 'etat') {
        valA = this.formatDisplayText(valA) ?? 'N/A';
        valB = this.formatDisplayText(valB) ?? 'N/A';
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
      
      default: return 'badge-secondary';
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type.toUpperCase()) {
      case 'DEMANDE_DE_TRAVAUX': return 'badge-info';
      case 'RECLAMATION': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  formatDisplayText(text: string): string {
    if (!text) return '';

    // Map database values to French display text
    const displayMap: { [key: string]: string } = {
      'DEMANDE_TRAVAUX': 'Demande de travaux',
      'RECLAMATION': 'Réclamation',
      'NOUVEAU': 'Nouveau',
      'EN_COURS_DE_TRAITEMENT': 'En cours de traitement',
      'TRAITEE': 'Traitée',
      'REFUSEE': 'Refusée',
      'BROUILLON': 'Brouillon'
    };

    // Return mapped value if exists
    const upperText = text.toUpperCase();
    if (displayMap[upperText]) {
      return displayMap[upperText];
    }

    // Fallback: Replace underscores and format to title case
    return text
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/(^|\s)\w/g, char => char.toUpperCase());
  }

  consulterReclamation(id: number): void {
    const reclamation = this.reclamations.find(r => r.id === id);
    if (reclamation) {
      this.selectedRequete = reclamation;
      this.isPopupOpen = true;

      if (reclamation.etat === 'NOUVEAU') {
        reclamation.etat = 'EN_COURS_DE_TRAITEMENT';
        this.requeteService.updateRequete(id, reclamation).subscribe({
          next: () => {
            console.log('Requête mise à jour');
            this.loadReclamations(this.getGuichetierIdFromToken()!);
          },
          error: (error: HttpErrorResponse) => {
            console.error('Erreur lors de la mise à jour de la requête', error);
            alert('Erreur lors de la mise à jour de la requête.');
          }
        });
      }

      this.noteRetour = reclamation.noteRetour || '';
      this.selectedTechnicienId = reclamation.technicien?.id || null;
    }
  }

  openTechnicienPopup(): void {
    if (this.selectedRequete && !this.selectedRequete.technicien) {
      this.userInfoService.getAllTechniciens().subscribe({
        next: (techniciens) => {
          this.techniciens = techniciens;
          console.log('Opening technician popup. Technicians:', techniciens);
          console.log('Available Technician IDs:', techniciens.map(t => t.id));
          this.isTechnicienPopupOpen = true;
          this.selectedTechnicienId = null;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error refreshing technicians:', err);
          alert('Erreur lors du chargement des techniciens.');
        }
      });
    }
  }

  assignTechnicien(): void {
    if (!this.selectedRequete || !this.selectedTechnicienId) {
      alert('Veuillez sélectionner un technicien.');
      return;
    }

    console.log('Assigning technician. Selected ID:', this.selectedTechnicienId);
    console.log('Selected ID type:', typeof this.selectedTechnicienId);
    console.log('Technicians list:', this.techniciens);
    console.log('Technician IDs:', this.techniciens.map(t => t.id));
    console.log('Technician ID types:', this.techniciens.map(t => typeof t.id));

    const techId = +this.selectedTechnicienId;

    if (!this.techniciens.some(t => t.id === techId)) {
      alert('ID de technicien invalide. Veuillez sélectionner un technicien valide.');
      console.error('Invalid technician ID:', techId);
      return;
    }

    const selectedTechnicien = this.techniciens.find(t => t.id === techId);
    if (!selectedTechnicien) {
      alert('Technicien non trouvé. Veuillez réessayer.');
      console.error('Technician not found for ID:', techId);
      return;
    }

    this.selectedRequete.technicien = { id: techId, name: selectedTechnicien.name };
    console.log('Updating requete with payload:', this.selectedRequete);

    this.requeteService.updateRequete(this.selectedRequete.id, this.selectedRequete).subscribe({
      next: (response) => {
        console.log('Technicien affecté avec succès:', response);
        this.loadReclamations(this.getGuichetierIdFromToken()!);
        this.closePopup();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors de l\'affectation du technicien:', error);
        alert('Erreur lors de l\'affectation du technicien: ' + (error.error?.message || error.message));
      }
    });
  }

  confirmerTraitement(): void {
    if (!this.noteRetour) {
      alert('Veuillez remplir la note de retour.');
      return;
    }

    if (this.selectedRequete) {
      this.selectedRequete.etat = 'TRAITEE';
      this.selectedRequete.noteRetour = this.noteRetour;
      this.selectedRequete.dateTraitement = new Date();
      this.requeteService.updateRequete(this.selectedRequete.id, this.selectedRequete).subscribe({
        next: (response: any) => {
          console.log('Requête traitée', response);
          this.loadReclamations(this.getGuichetierIdFromToken()!);
          this.noteRetour = '';
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
      reclamation.dateTraitement = new Date();
      this.requeteService.updateRequete(id, reclamation).subscribe({
        next: () => {
          console.log('Réclamation refusée');
          this.loadReclamations(this.getGuichetierIdFromToken()!);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur lors du refus de la réclamation', error);
          alert('Erreur lors du refus de la réclamation.');
        }
      });
    }
  }

  closePopup(): void {
    this.isPopupOpen = false;
    this.isTechnicienPopupOpen = false;
    this.selectedRequete = null;
    this.selectedTechnicienId = null;
    this.noteRetour = '';
  }
}