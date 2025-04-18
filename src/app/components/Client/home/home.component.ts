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
  
  isPopupOpen: boolean = false; // Contrôle l'ouverture de la popup
  selectedRequete: Requete | null = null; // Requête sélectionnée pour la popup

  constructor(
    private router: Router,
    private requeteService: RequeteService
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken: any = jwtDecode(token);
      const clientId = decodedToken.id;
      
      if (clientId) {
        this.requeteService.getRequetesByClientId(clientId).subscribe(data => {
          this.requetes = data;
          this.filteredRequetes = [...this.requetes];
          this.updatePagination();
        }, error => {
          console.error('Erreur lors de la récupération des requêtes:', error);
        });
      } else {
        console.error('ID du client non trouvé dans le token');
      }
    } else {
      console.error('Token non trouvé dans le localStorage');
    }

    const storedMode = localStorage.getItem('mode');
    if (storedMode === 'night') {
        this.enableNightMode();
    }
  }

  filterReclamations(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredRequetes = this.requetes.filter(requete => {
      return Object.values(requete).some(value => {
        if (typeof value === 'string' || typeof value === 'number') {
          return value.toString().toLowerCase().includes(term);
        }
        return false;
      });
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  sort(column: keyof Requete) {
    this.sortDirection[column] = !this.sortDirection[column];
    const direction = this.sortDirection[column] ? 1 : -1;

    this.filteredRequetes.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return direction * (valA - valB);
      }

      const strA = (valA ?? '').toString();
      const strB = (valB ?? '').toString();
      return direction * strA.localeCompare(strB, 'fr', { numeric: true });
    });

    this.updatePagination();
  }

  getBadgeClass(etat: string | undefined): string {
    switch (etat) {
      case 'Nouveau': return 'badge-primary';
      case 'En cours de traitement': return 'badge-warning';
      case 'Traité': return 'badge-success';
      case 'Refusé': return 'badge-danger';
      default: return 'badge-secondary'; // ou une classe par défaut
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
    const target = event.target as HTMLSelectElement;
    this.itemsPerPage = Number(target.value);
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredRequetes.length / this.itemsPerPage);
    this.paginatedRequetes = this.filteredRequetes.slice(
      (this.currentPage - 1) * this.itemsPerPage,
      this.currentPage * this.itemsPerPage
    );
  }

  toggleMode(): void {
    this.isNightMode = !this.isNightMode; // Inverser la valeur de isNightMode
    console.log('Toggle mode:', this.isNightMode); // Vérifiez si cette ligne s'affiche dans la console
    if (this.isNightMode) {
        this.enableNightMode();
    } else {
        this.disableNightMode();
    }
}

enableNightMode(): void {
  document.body.classList.add('night-mode');
  localStorage.setItem('mode', 'night');
  console.log('Mode nuit activé');
}

disableNightMode(): void {
  document.body.classList.remove('night-mode');
  localStorage.setItem('mode', 'day');
  console.log('Mode nuit désactivé');
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
}