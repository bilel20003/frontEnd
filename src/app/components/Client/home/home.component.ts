import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Requete } from 'src/app/models/requete.model';
import { RequeteService } from 'src/app/services/requete.service';
import { jwtDecode } from "jwt-decode";

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

  constructor(
    private router: Router,
    private requeteService: RequeteService
  ) {}

  ngOnInit(): void {
    const clientId = this.getClientIdFromToken();

    if (clientId) {
      this.requeteService.getRequetesByClientId(clientId).subscribe({
        next: (data) => {
          this.requetes = data;
          this.filteredRequetes = [...this.requetes];
          this.updatePagination();
        },
        error: (err) => {
          console.error('Erreur de chargement des requêtes:', err);
          alert('Impossible de charger les requêtes.');
        }
      });
    } else {
      alert('Session invalide. Veuillez vous reconnecter.');
      this.router.navigate(['/login']);
    }

    // Appliquer le mode nuit si besoin
    const storedMode = localStorage.getItem('mode');
    if (storedMode === 'night') this.enableNightMode();
  }

  private getClientIdFromToken(): number | null {
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

  private getEmptyRequete(): Omit<Requete, 'id'> {
    return {
      type: '' as any,
      objet: '' as any,
      description: '',
      etat: 'NOUVEAU',
      date: new Date(),
      noteRetour: '',
      client: { id: 0 },
      guichetier: { id: 0 }
    };
  }

  filterReclamations(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredRequetes = this.requetes.filter(req =>
      Object.values(req).some(val =>
        (typeof val === 'string' || typeof val === 'number') &&
        val.toString().toLowerCase().includes(term)
      )
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  sort(column: keyof Requete): void {
    this.sortDirection[column] = !this.sortDirection[column];
    const dir = this.sortDirection[column] ? 1 : -1;

    this.filteredRequetes.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];

      const strA = (valA ?? '').toString();
      const strB = (valB ?? '').toString();
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
  }

  disableNightMode(): void {
    document.body.classList.remove('night-mode');
    localStorage.setItem('mode', 'day');
  }

  goToReclamationPage(): void {
    this.router.navigate(['/reclamation']);
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
    this.newRequete = this.getEmptyRequete();
    this.isCreatePopupOpen = true;
  }

  closeCreatePopup(): void {
    this.isCreatePopupOpen = false;
    this.newRequete = this.getEmptyRequete();
  }

  submitNewRequete(): void {
    const clientId = this.getClientIdFromToken();
    if (!clientId) {
      alert('Token invalide. Veuillez vous reconnecter.');
      return;
    }

    this.requeteService.getGuichetierWithLeastRequests().subscribe({
      next: (guichetier) => {
        const completeRequete: Omit<Requete, 'id'> = {
          ...this.newRequete,
          date: new Date(),
          client: { id: clientId },
          guichetier: { id: (guichetier as any).id }
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
            console.error('Erreur lors de la création de la requête:', error);
            alert('Erreur lors de la création de la requête. Veuillez réessayer.');
          }
        });
      },
      error: (error) => {
        console.error('Erreur récupération guichetier:', error);
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
