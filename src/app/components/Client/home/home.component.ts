import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Requete } from 'src/app/models/requete.model';
import { UserInfo } from 'src/app/models/user-info.model';
import { Produit } from "src/app/models/produit.model";
import { RequeteService } from 'src/app/services/requete.service';
import { ProduitService } from 'src/app/services/produit.service';
import { jwtDecode } from "jwt-decode";
import { Observable } from "rxjs";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  requetes: Requete[] = [];
  filteredRequetes: Requete[] = [];
  paginatedRequetes: Requete[] = [];

  searchTerm: string = '';
  sortDirection: { [key: string]: boolean } = {};
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  isNightMode: boolean = false;

  isPopupOpen: boolean = false;
  isCreatePopupOpen: boolean = false;
  selectedRequete: Requete | null = null;

  newRequete: Omit<Requete, 'id'> = this.getEmptyRequete();
  userInfo: { id: number; role: string; produit?: Produit } | null = null;
  produits: Produit[] = [];
  isProduitsLoaded: boolean = false;

  constructor(
    private router: Router,
    private requeteService: RequeteService,
    private produitService: ProduitService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadProduits();
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
      const decoded = jwtDecode<{ id: number; role: string; produit: Produit }>(token);
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
    if (this.userInfo?.role === 'CLIENT') {
      this.produitService.getAllProduits().subscribe({
        next: (produits) => {
          this.produits = produits.filter(p => p.nom !== 'Any');
          if (this.userInfo?.produit) {
            const userProduit = this.produits.find(p => p.id === this.userInfo!.produit!.id);
            this.newRequete.produit = userProduit || this.produits[0];
          }
          this.isProduitsLoaded = true;
        },
        error: (err) => {
          console.error('Error loading produits:', err);
          alert('Impossible de charger les produits.');
          this.isProduitsLoaded = true; // Allow UI to proceed even if error
        }
      });
    } else {
      this.produits = [{ id: 1, nom: 'Any' }];
      this.isProduitsLoaded = true;
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
        this.requetes = data;
        this.filteredRequetes = [...this.requetes];
        this.updatePagination();
      },
      error: (err) => {
        console.error('Error loading requetes:', err);
        alert('Impossible de charger les requêtes.');
      }
    });
  }

  private getEmptyRequete(): Omit<Requete, 'id'> {
    return {
      type: 'DEMANDE_DE_TRAVAUX',
      objet: 'OBJET_1',
      description: '',
      etat: 'NOUVEAU',
      date: new Date(),
      noteRetour: '',
      client: { id: this.userInfo?.id || 0 },
      guichetier: { id: 0 },
      produit: this.userInfo?.role === 'CLIENT' ? this.userInfo?.produit : { id: 1, nom: 'Any' }
    };
  }

  private redirectToLogin(): void {
    alert('Session invalide. Veuillez vous reconnecter.');
    this.router.navigate(['/login']);
  }

  filterReclamations(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredRequetes = this.requetes.filter(req =>
      Object.values(req).some(val =>
        (typeof val === 'string' || typeof val === 'number') &&
        val.toString().toLowerCase().includes(term)
      ) || (req.produit?.nom?.toLowerCase()?.includes(term) ?? false)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  sort(column: keyof Requete): void {
    this.sortDirection[column] = !this.sortDirection[column];
    const dir = this.sortDirection[column] ? 1 : -1;

    this.filteredRequetes.sort((a, b) => {
      let valA = a[column];
      let valB = b[column];

      if (column === 'produit') {
        valA = a.produit?.nom ?? 'N/A';
        valB = b.produit?.nom ?? 'N/A';
      } else {
        valA = valA ?? '';
        valB = valB ?? '';
      }

      const strA = valA.toString();
      const strB = valB.toString();

      return dir * strA.localeCompare(strB, 'fr', { numeric: true });
    });

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
    if (!this.isProduitsLoaded) {
      alert('Les produits sont en cours de chargement. Veuillez réessayer dans un instant.');
      return;
    }
    if (this.produits.length === 0) {
      alert('Aucun produit disponible. Veuillez contacter l\'administrateur.');
      return;
    }
    this.newRequete = this.getEmptyRequete();
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

    this.requeteService.getGuichetierWithLeastRequests().subscribe({
      next: (guichetier) => {
        const completeRequete: Omit<Requete, 'id'> = {
          ...this.newRequete,
          date: new Date(),
          client: { id: this.userInfo!.id },
          guichetier: { id: guichetier.id },
          produit: this.userInfo!.role === 'CLIENT' ? this.newRequete.produit : { id: 1, nom: 'Any' }
        };

        this.requeteService.createRequete(completeRequete).subscribe({
          next: (response) => {
            this.requetes.push(response);
            this.filteredRequetes = [...this.requetes];
            this.updatePagination();
            this.closeCreatePopup();
            alert('Requête créée avec succès !');
          },
          error: (error) => {
            console.error('Error creating requete:', error);
            alert('Erreur lors de la création de la requête. Veuillez réessayer.');
          }
        });
      },
      error: (error) => {
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