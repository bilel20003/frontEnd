import { Component, OnInit } from '@angular/core';
import { MinistereService } from 'src/app/services/ministry.service';
import { Ministere } from 'src/app/models/ministere.model';

@Component({
  selector: 'app-ministere',
  templateUrl: './ministere.component.html',
  styleUrls: ['./ministere.component.css']
})
export class MinistryManagementComponent implements OnInit {
  ministeres: Ministere[] = [];
  searchTerm = '';
  filteredMinistries: Ministere[] = [];
  paginatedMinistries: Ministere[] = [];

  currentPage = 1;
  itemsPerPage = 5;
  isNightMode = false;

  showModal = false;
  modalTitle = '';
  modalButtonText = '';
  ministereName = '';
  currentMinistere: Ministere | null = null;

  constructor(private ministereService: MinistereService) {}

  ngOnInit(): void {
    this.loadMinistere();
  }

  loadMinistere(): void {
    this.ministereService.getAllMinisteres().subscribe({
      next: (data: Ministere[]) => {
        console.log('Ministères reçus:', data);
        this.ministeres = data;
        this.filteredMinistries = [...this.ministeres];
        console.log('Filtered Ministries:', this.filteredMinistries);
        this.updatePaginatedMinistries();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des ministères:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error
        });
        alert('Erreur lors du chargement des ministères. Veuillez vérifier la connexion au serveur.');
      }
    });
  }

  filterMinistries() {
    const term = this.searchTerm.toLowerCase();
    this.filteredMinistries = this.ministeres.filter((ministere) =>
      ministere.nomMinistere.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.updatePaginatedMinistries();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredMinistries.length / this.itemsPerPage);
  }

  updatePaginatedMinistries() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedMinistries = this.filteredMinistries.slice(start, end);
    console.log('Paginated Ministries:', this.paginatedMinistries);
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedMinistries();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedMinistries();
    }
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePaginatedMinistries();
  }

  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }

  openModal(action: string, ministere?: Ministere) {
    this.showModal = true;
    if (action === 'add') {
      this.modalTitle = 'Ajouter un Ministère';
      this.modalButtonText = 'Ajouter';
      this.ministereName = '';
      this.currentMinistere = null;
    } else if (action === 'edit' && ministere) {
      this.modalTitle = `Modifier le ministère : ${ministere.nomMinistere}`;
      this.modalButtonText = 'Modifier';
      this.ministereName = ministere.nomMinistere;
      this.currentMinistere = ministere;
    }
  }

  closeModal() {
    this.showModal = false;
  }

  saveMinistere() {
    if (!this.ministereName.trim()) {
      alert('Le nom du ministère est requis.');
      return;
    }

    const ministereData = { nomMinistere: this.ministereName };

    if (this.currentMinistere) {
      if (this.currentMinistere.id === undefined) {
        alert('Erreur : ID du ministère manquant pour la modification.');
        return;
      }
      this.ministereService.updateMinistere(this.currentMinistere.id, ministereData).subscribe({
        next: () => {
          this.loadMinistere();
          this.closeModal();
        },
        error: (err) => {
          console.error('Erreur lors de la modification:', err);
          alert('Erreur lors de la modification du ministère. Veuillez réessayer.');
        }
      });
    } else {
      this.ministereService.addNewMinistere(ministereData).subscribe({
        next: () => {
          this.loadMinistere();
          this.closeModal();
        },
        error: (err) => {
          console.error('Erreur lors de l\'ajout:', err);
          alert('Erreur lors de l\'ajout du ministère. Veuillez réessayer.');
        }
      });
    }
  }

  deleteMinistere(id: number): void {
    console.log("ID à supprimer :", id); // vérifie ici
  
    this.ministereService.deleteMinistere(id).subscribe({
      next: () => {
        console.log("Suppression réussie");
        this.ministereService.getAllMinisteres(); // ou toute autre action après suppression
      },
      error: (err) => {
        console.error("Erreur suppression :", err);
      }
    });
  }
  
}