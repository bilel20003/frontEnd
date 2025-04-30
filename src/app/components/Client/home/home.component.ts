import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Requete } from 'src/app/models/requete.model';
import { Objet } from 'src/app/models/objet.model';
import { Produit } from 'src/app/models/produit.model';
import { UserInfo } from 'src/app/models/user-info.model';
import { RequeteService } from 'src/app/services/requete.service';
import { ObjetService } from 'src/app/services/objet.service';
import { ProduitService } from 'src/app/services/produit.service';
import { jwtDecode } from 'jwt-decode';
import { Observable } from 'rxjs';
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
  sortDirection: { [key: string]: boolean } = { id: false }; // Default to descending for id
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  isNightMode: boolean = false;

  isPopupOpen: boolean = false;
  isCreatePopupOpen: boolean = false;
  selectedRequete: Requete | null = null;

  newRequete: Omit<Requete, 'id'> = this.getEmptyRequete();
  userInfo: { id: number; role: string; produit?: { id: number } } | null = null;
  isObjetsLoaded: boolean = false;
  isProduitsLoaded: boolean = false;

  constructor(
    private router: Router,
    private requeteService: RequeteService,
    private objetService: ObjetService,
    private produitService: ProduitService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadProduits();
    this.loadObjets();
    this.loadRequetes();

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
      const decoded = jwtDecode<{ id: number; role: string; produit: { id: number } }>(token);
      this.userInfo = {
        id: decoded.id,
        role: decoded.role,
        produit: decoded.produit
      };
    } catch (e) {
      console.error('Error decoding token:', e);
      this.redirectToLogin();
    }
  }

  private loadProduits(): void {
    this.produitService.getAllProduits().subscribe({
      next: (produits) => {
        console.log('Produits received:', produits);
        this.produits = produits;
        this.produitMap = produits.reduce((map, prod) => {
          map[prod.id] = prod;
          return map;
        }, {} as { [key: number]: Produit });
        this.isProduitsLoaded = true;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading produits:', err);
        alert('Impossible de charger les produits.');
        this.isProduitsLoaded = true;
      }
    });
  }

  private loadObjets(): void {
    if (this.userInfo?.role === 'CLIENT') {
      this.objetService.getAllObjets().subscribe({
        next: (objets) => {
          console.log('Objets received:', objets);
          this.objets = objets.filter(o => o.name !== 'Any');
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
    } else {
      this.objets = [{ id: 1, name: 'Any', produit: { id: 1 } }];
      this.objetMap[1] = this.objets[0];
      this.isObjetsLoaded = true;
    }
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
        console.log('Requetes received:', data);
        this.requetes = data;
        this.filteredRequetes = [...this.requetes];
        // Explicitly sort by id in descending order
        this.filteredRequetes.sort((a, b) => b.id - a.id);
        console.log('Sorted requetes (descending by id):', this.filteredRequetes);
        this.updatePagination();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading requetes:', err);
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
      noteRetour: '',
      client: { id: 0 },
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
      const produit = objet ? this.produitMap[objet.produit.id] : null;
      return (
        Object.values(req).some(val =>
          (typeof val === 'string' || typeof val === 'number' || val instanceof Date) &&
          val.toString().toLowerCase().includes(term)
        ) ||
        (objet?.name?.toLowerCase()?.includes(term) ?? false) ||
        (produit?.nom?.toLowerCase()?.includes(term) ?? false)
      );
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  sort(column: keyof Requete | 'objetName' | 'produitName'): void {
    // Initialize sort direction if not set
    if (this.sortDirection[column] === undefined) {
      this.sortDirection[column] = column === 'id' ? false : true; // Descending for id, ascending for others
    } else {
      this.sortDirection[column] = !this.sortDirection[column]; // Toggle direction
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
        const strA = valA.toString();
        const strB = valB.toString();
        return dir * strA.localeCompare(strB, 'fr', { numeric: true });
      } else if (column === 'produitName') {
        const produitA = this.objetMap[a.objet.id] ? this.produitMap[this.objetMap[a.objet.id].produit.id] : null;
        const produitB = this.objetMap[b.objet.id] ? this.produitMap[this.objetMap[b.objet.id].produit.id] : null;
        valA = produitA?.nom ?? 'N/A';
        valB = produitB?.nom ?? 'N/A';
        const strA = valA.toString();
        const strB = valB.toString();
        return dir * strA.localeCompare(strB, 'fr', { numeric: true });
      } else if (column === 'date') {
        valA = a.date ? new Date(a.date).getTime() : 0;
        valB = b.date ? new Date(b.date).getTime() : 0;
        return dir * (valA - valB);
      } else {
        valA = a[column as keyof Requete] ?? '';
        valB = b[column as keyof Requete] ?? '';
        const strA = valA.toString();
        const strB = valB.toString();
        return dir * strA.localeCompare(strB, 'fr', { numeric: true });
      }
    });

    console.log(`Sorted by ${column}, direction: ${this.sortDirection[column] ? 'ascending' : 'descending'}`, this.filteredRequetes);
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredRequetes.length / this.itemsPerPage);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedRequetes = this.filteredRequetes.slice(start, start + this.itemsPerPage);
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
    console.log('Opening create popup, newRequete.objet.id:', this.newRequete.objet.id);
    console.log('Opening create popup, newRequete.type:', this.newRequete.type);
    this.isCreatePopupOpen = true;
  }

  closeCreatePopup(): void {
    this.isCreatePopupOpen = false;
    this.newRequete = this.getEmptyRequete();
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

    console.log('Submitting newRequete.objet.id:', this.newRequete.objet.id);
    console.log('Submitting newRequete.type:', this.newRequete.type);
    console.log('Available objets:', this.objets);

    if (this.newRequete.objet.id === 0) {
      alert('Veuillez sélectionner un objet.');
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
          noteRetour: '',
          client: { id: this.userInfo!.id },
          guichetier: { id: guichetier.id },
          technicien: null
        };

        console.log('Sending requete:', completeRequete);

        this.requeteService.createRequete(completeRequete).subscribe({
          next: (response: any) => {
            console.log('Create requete response:', response);
            console.log('Current objets:', this.objets);
            const selectedObjet = this.objets.find(obj => obj.id === this.newRequete.objet.id);
            if (selectedObjet) {
              this.objetMap[this.newRequete.objet.id] = selectedObjet;
            } else {
              console.warn(`Objet with id ${this.newRequete.objet.id} not found in this.objets`);
            }
            this.loadRequetes();
            this.closeCreatePopup();
            alert('Requête créée avec succès !');
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error creating requete:', error);
            alert(`Erreur lors de la création de la requête: ${error.message}`);
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error fetching guichetier:', error);
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