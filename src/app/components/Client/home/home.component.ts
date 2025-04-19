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
  newRequete: Omit<Requete, 'id'> = { // Omit the id field
    type: '' as any,
    objet: '' as any,
    description: '',
    etat: 'NOUVEAU',
    date: new Date(),
    noteRetour: '', // Optional field
    client: { id: 0 }, // Placeholder, will be set in submitNewRequete
    guichetier: { id: 0 } // Placeholder, will be set in submitNewRequete
  };

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
        this.requeteService.getRequetesByClientId(clientId).subscribe({
          next: (data) => {
            this.requetes = data;
            this.filteredRequetes = [...this.requetes];
            this.updatePagination();
          },
          error: (error) => {
            console.error('Erreur lors de la récupération des requêtes:', error);
            alert('Erreur lors du chargement des requêtes.');
          }
        });
      } else {
        console.error('ID du client non trouvé dans le token');
        alert('Session invalide. Veuillez vous reconnecter.');
      }
    } else {
      console.error('Token non trouvé dans le localStorage');
      this.router.navigate(['/login']);
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

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredRequetes.length / this.itemsPerPage);
    this.paginatedRequetes = this.filteredRequetes.slice(
      (this.currentPage - 1) * this.itemsPerPage,
      this.currentPage * this.itemsPerPage
    );
  }

  toggleMode(): void {
    this.isNightMode = !this.isNightMode;
    if (this.isNightMode) {
      this.enableNightMode();
    } else {
      this.disableNightMode();
    }
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
    this.newRequete = {
      type: '' as any,
      objet: '' as any,
      description: '',
      etat: 'NOUVEAU',
      date: new Date(),
      noteRetour: '', // Optional field
      client: { id: 0 }, // Placeholder, will be set in submitNewRequete
      guichetier: { id: 0 } // Placeholder, will be set in submitNewRequete
    };
    this.isCreatePopupOpen = true;
  }

  closeCreatePopup(): void {
    this.isCreatePopupOpen = false;
    this.newRequete = {
      type: '' as any,
      objet: '' as any,
      description: '',
      etat: 'NOUVEAU',
      date: new Date(),
      noteRetour: '', // Optional field
      client: { id: 0 }, // Reset to placeholder
      guichetier: { id: 0 } // Reset to placeholder
    };
  }

  submitNewRequete(): void {
    // Set the current date and default values
    this.newRequete.date = new Date(); // Set current date
    this.newRequete.etat = "NOUVEAU"; // Set default state
    this.newRequete.noteRetour = ""; // Optional field

    // Extract client ID from the token
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken: any = jwtDecode(token);
      const clientId = decodedToken.id;

      // Prepare the complete request body without the id field
      const completeRequete: Omit<Requete, 'id'> = {
        type: this.newRequete.type,
        objet: this.newRequete.objet,
        description: this.newRequete.description,
        etat: this.newRequete.etat,
        noteRetour: this.newRequete.noteRetour,
        date: this.newRequete.date,
        client: { id: clientId }, // Use the client ID from the token
        guichetier: { id: 4 }, // Replace with actual guichetier ID
      };

      // Log the complete request body for debugging
      console.log('Request Body:', completeRequete);

      // Send the request to the backend
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
    } else {
      alert('Token non trouvé. Veuillez vous reconnecter.');
    }
  }

  getBadgeClass(etat: string | undefined): string {
    switch (etat?.toUpperCase()) {
      case 'NOUVEAU':
        return 'badge-primary';
      case 'EN_COURS_DE_TRAITEMENT':
        return 'badge-warning';
      case 'TRAITEE':
        return 'badge-success';
      case 'REFUSEE':
        return 'badge-danger';
      case 'BROUILLON':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
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