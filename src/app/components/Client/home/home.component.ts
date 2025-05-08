import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Requete } from 'src/app/models/requete.model';
import { Objet } from 'src/app/models/objet.model';
import { Produit } from 'src/app/models/produit.model';
import { UserInfo } from 'src/app/models/user-info.model';
import { RequeteService } from 'src/app/services/requete.service';
import { ObjetService } from 'src/app/services/objet.service';
import { ProduitService } from 'src/app/services/produit.service';
import { AiService } from 'src/app/services/ai.service';
import { UserInfoService } from 'src/app/services/user-info.service';
import { jwtDecode } from 'jwt-decode';
import { Observable, forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  requetes: Requete[] = [];
  filteredRequetes: Requete[] = [];
  paginatedRequetes: Requete[] = [];
  objets: Objet[] = [];
  produits: Produit[] = [];
  objetMap: { [key: number]: Objet } = {};
  produitMap: { [key: number]: Produit } = {};

  searchTerm: string = '';
  sortDirection: { [key: string]: boolean } = { id: false };
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  isNightMode: boolean = false;

  isPopupOpen: boolean = false;
  isCreatePopupOpen: boolean = false;
  selectedRequete: Requete | null = null;

  newRequete: Omit<Requete, 'id'> = this.getEmptyRequete();
  userInfo: { id: number; role: string; produit?: { id: number }; name?: string } | null = null;
  isObjetsLoaded: boolean = false;
  isProduitsLoaded: boolean = false;
  welcomeMessage: string = '';

  isAIPromptVisible: boolean = false;
  aiPrompt: string = '';
  isAILoading: boolean = false;

  constructor(
    private router: Router,
    private requeteService: RequeteService,
    private objetService: ObjetService,
    private produitService: ProduitService,
    private aiService: AiService,
    private userInfoService: UserInfoService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.refreshData();
    const storedMode = localStorage.getItem('mode');
    if (storedMode === 'night') this.enableNightMode();
  }

  private loadUserInfo(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.redirectToLogin();
      return;
    }

    try {
      const decoded = jwtDecode<{ id: number; role: string; produit?: { id: number } }>(token);
      this.userInfoService.getUserById(decoded.id).subscribe({
        next: (user: UserInfo) => {
          this.userInfo = {
            id: decoded.id,
            role: decoded.role,
            produit: decoded.produit,
            name: user.name || 'Client'
          };
          const productName = decoded.produit?.id && this.produitMap[decoded.produit.id]
            ? this.produitMap[decoded.produit.id].nom
            : 'N/A';
          const ministryName = user.service?.ministere?.nomMinistere || 'N/A';
          this.welcomeMessage = `Bienvenue ${this.userInfo.name}, utilisateur du produit ${productName} / ministère ${ministryName}`;
          this.loadRequetes();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error fetching user info:', err.message);
          this.redirectToLogin();
        }
      });
    } catch (e) {
      console.error('Error decoding token:', (e as Error).message);
      this.redirectToLogin();
    }
  }

  private refreshData(): void {
    forkJoin({
      produits: this.produitService.getAllProduits(),
      objets: this.objetService.getAllObjets()
    }).subscribe({
      next: ({ produits, objets }) => {
        this.produits = produits.filter(p => p.id && p.nom);
        this.produitMap = produits.reduce((map, prod) => {
          if (prod.id) map[prod.id] = prod;
          return map;
        }, {} as { [key: number]: Produit });
        this.objets = objets.filter(o => o.id && o.name && o.produit?.id);
        this.objetMap = objets.reduce((map, obj) => {
          if (obj.id && obj.produit?.id && this.produitMap[obj.produit.id]) {
            map[obj.id] = obj;
          }
          return map;
        }, {} as { [key: number]: Objet });
        this.isProduitsLoaded = true;
        this.isObjetsLoaded = true;
        this.loadRequetes();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error refreshing data:', err.message);
        alert('Impossible de rafraîchir les données.');
        this.isProduitsLoaded = true;
        this.isObjetsLoaded = true;
      }
    });
  }

  private loadRequetes(): void {
    if (!this.userInfo) return;

    let observable: Observable<Requete[]>;
    switch (this.userInfo.role) {
      case 'CLIENT':
        observable = this.requeteService.getRequetesByClientId(this.userInfo.id);
        break;
      case 'GUICHETIER':
        observable = this.requeteService.getRequetesByGuichetierId(this.userInfo.id);
        break;
      case 'TECHNICIEN':
        observable = this.requeteService.getRequetesByTechnicienId(this.userInfo.id);
        break;
      case 'ADMIN':
        observable = this.requeteService.getAllRequetes();
        break;
      default:
        this.redirectToLogin();
        return;
    }

    observable.subscribe({
      next: (data) => {
        this.requetes = data.map(req => ({
          ...req,
          client: { id: req.client.id, name: req.client.name || 'Inconnu' }
        }));
        const guichetierRequests = data.map(req =>
          this.userInfoService.getUserById(req.guichetier.id).subscribe({
            next: (user) => {
              req.guichetier.name = user.name || 'Inconnu';
            },
            error: (err) => {
              console.error(`Error fetching guichetier ${req.guichetier.id}:`, err.message);
              req.guichetier.name = 'Inconnu';
            }
          })
        );

        Promise.all(guichetierRequests).then(() => {
          this.filteredRequetes = [...this.requetes];
          this.filteredRequetes.sort((a, b) => b.id - a.id);
          this.updatePagination();
        });
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading requetes:', err.message);
        alert('Impossible de charger les requêtes.');
      }
    });
  }

  private getEmptyRequete(): Omit<Requete, 'id'> {
    return {
      type: '',
      objet: { id: 0 },
      description: '',
      etat: 'NOUVEAU',
      date: new Date(),
      dateTraitement: null,
      client: { id: 0, name: 'Inconnu' },
      guichetier: { id: 0 },
      technicien: null
    };
  }

  private redirectToLogin(): void {
    alert('Session invalide. Veuillez vous reconnecter.');
    this.router.navigate(['/login']);
  }

  filterReclamations(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredRequetes = this.requetes.filter(req => {
      const objet = this.objetMap[req.objet.id];
      return (
        Object.values(req).some(val =>
          (typeof val === 'string' || typeof val === 'number' || val instanceof Date) &&
          val.toString().toLowerCase().includes(term)
        ) ||
        (objet?.name?.toLowerCase()?.includes(term) ?? false) ||
        (req.guichetier.name?.toLowerCase()?.includes(term) ?? false) ||
        (req.client.name.toLowerCase().includes(term) ?? false)
      );
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  sort(column: keyof Requete | 'objetName'): void {
    if (this.sortDirection[column] === undefined) {
      this.sortDirection[column] = column === 'id' ? false : true;
    } else {
      this.sortDirection[column] = !this.sortDirection[column];
    }
    const dir = this.sortDirection[column] ? 1 : -1;

    this.filteredRequetes.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (column === 'id') {
        valA = Number(a.id) || 0;
        valB = Number(b.id) || 0;
        return dir * (valA - valB);
      } else if (column === 'objetName') {
        valA = this.objetMap[a.objet.id]?.name ?? 'N/A';
        valB = this.objetMap[b.objet.id]?.name ?? 'N/A';
        return dir * valA.localeCompare(valB, 'fr', { numeric: true });
      } else if (column === 'date') {
        valA = a.date ? new Date(a.date).getTime() : 0;
        valB = b.date ? new Date(b.date).getTime() : 0;
        return dir * (valA - valB);
      } else if (column === 'dateTraitement') {
        valA = a.dateTraitement ? new Date(a.dateTraitement).getTime() : 0;
        valB = b.dateTraitement ? new Date(b.dateTraitement).getTime() : 0;
        return dir * (valA - valB);
      } else if (column === 'client') {
        valA = a.client.name ?? 'N/A';
        valB = b.client.name ?? 'N/A';
        return dir * valA.localeCompare(valB, 'fr', { numeric: true });
      } else if (column === 'type' || column === 'etat') {
        valA = this.formatDisplayText(a[column as keyof Requete] as string) ?? 'N/A';
        valB = this.formatDisplayText(b[column as keyof Requete] as string) ?? 'N/A';
        return dir * valA.localeCompare(valB, 'fr', { numeric: true });
      } else {
        valA = a[column as keyof Requete] ?? '';
        valB = b[column as keyof Requete] ?? '';
        return dir * valA.toString().localeCompare(valB.toString(), 'fr', { numeric: true });
      }
    });

    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredRequetes.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedRequetes = this.filteredRequetes.slice(start, start + this.itemsPerPage);
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

  openPopup(requete: Requete): void {
    this.selectedRequete = requete;
    this.isPopupOpen = true;
  }

  closePopup(): void {
    this.isPopupOpen = false;
    this.selectedRequete = null;
  }

  openCreateRequetePopup(): void {
    if (this.userInfo?.role !== 'CLIENT') {
      alert('Seuls les clients peuvent créer des requêtes.');
      return;
    }
    if (!this.isObjetsLoaded || !this.isProduitsLoaded) {
      alert('Les objets ou produits sont en cours de chargement. Veuillez réessayer dans un instant.');
      return;
    }
    if (this.objets.length === 0) {
      alert('Aucun objet disponible. Veuillez contacter l\'administrateur.');
      return;
    }
    this.newRequete = this.getEmptyRequete();
    this.newRequete.objet = { id: 0 };
    this.newRequete.type = '';
    this.isAIPromptVisible = false;
    this.aiPrompt = '';
    this.isCreatePopupOpen = true;
  }

  closeCreatePopup(): void {
    this.isCreatePopupOpen = false;
    this.isAIPromptVisible = false;
    this.aiPrompt = '';
    this.newRequete = this.getEmptyRequete();
  }

  toggleAIPrompt(): void {
    this.isAIPromptVisible = !this.isAIPromptVisible;
    this.aiPrompt = '';
  }

  generateAIDescription(): void {
    if (!this.aiPrompt.trim()) {
      alert('Veuillez entrer une description pour l’IA.');
      return;
    }
    this.isAILoading = true;
    this.aiService.generateDescription(this.aiPrompt).subscribe({
      next: (description) => {
        this.newRequete.description = description;
        this.isAILoading = false;
        this.isAIPromptVisible = false;
        this.aiPrompt = '';
      },
      error: (err: HttpErrorResponse) => {
        this.isAILoading = false;
        alert(err.message);
      }
    });
  }

  submitNewRequete(): void {
    if (!this.userInfo) {
      this.redirectToLogin();
      return;
    }

    if (!this.newRequete.description.trim()) {
      alert('La description est requise.');
      return;
    }

    if (this.newRequete.objet.id === 0 || !this.objetMap[this.newRequete.objet.id]) {
      alert('Veuillez sélectionner un objet valide.');
      return;
    }

    if (!this.newRequete.type) {
      alert('Veuillez sélectionner un type de requête.');
      return;
    }

    this.requeteService.getGuichetierWithLeastRequests().subscribe({
      next: (guichetier) => {
        const completeRequete: Omit<Requete, 'id'> = {
          type: this.newRequete.type,
          objet: { id: this.newRequete.objet.id },
          description: this.newRequete.description,
          etat: 'NOUVEAU',
          date: new Date(),
          dateTraitement: null,
          client: { id: this.userInfo!.id, name: this.userInfo!.name || 'Client' },
          guichetier: { id: guichetier.id },
          technicien: null
        };

        this.requeteService.createRequete(completeRequete).subscribe({
          next: () => {
            this.refreshData();
            this.closeCreatePopup();
            alert('Requête créée avec succès !');
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error creating requete:', error.message);
            alert(`Erreur lors de la création de la requête: ${error.message}`);
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error fetching guichetier:', error.message);
        alert('Impossible de récupérer le guichetier.');
      }
    });
  }

  getBadgeClass(etat: string | undefined): string {
    switch (etat?.toUpperCase()) {
      case 'NOUVEAU': return 'badge-primary';
      case 'EN_COURS_DE_TRAITEMENT': return 'badge-warning';
      case 'TRAITEE': return 'badge-success';
      case 'REFUSEE': return 'badge-danger';
      case 'BROUILLON': return 'badge-secondary';
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

    const displayMap: { [key: string]: string } = {
      'DEMANDE_DE_TRAVAUX': 'Demande de travaux',
      'RECLAMATION': 'Réclamation',
      'NOUVEAU': 'Nouveau',
      'EN_COURS_DE_TRAITEMENT': 'En cours de traitement',
      'TRAITEE': 'Traitée',
      'REFUSEE': 'Refusée',
      'BROUILLON': 'Brouillon'
    };

    const upperText = text.toUpperCase();
    if (displayMap[upperText]) {
      return displayMap[upperText];
    }

    return text
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/(^|\s)\w/g, char => char.toUpperCase());
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
}