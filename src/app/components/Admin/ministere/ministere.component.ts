import { Component } from '@angular/core';

interface Ministry {
  id_ministere: number;
  name: string;
}

@Component({
  selector: 'app-ministere',
  templateUrl: './ministere.component.html',
  styleUrls: ['./ministere.component.css']
})
export class MinistryManagementComponent {

  ministries: Ministry[] = [
    { id_ministere: 1, name: 'Ministère de l\'Informatique' },
    { id_ministere: 2, name: 'Ministère des Ressources Humaines' },
    { id_ministere: 3, name: 'Ministère de la Logistique' },
    { id_ministere: 4, name: 'Ministère des Affaires Juridiques' },
    { id_ministere: 5, name: 'Ministère de la Communication' },
    { id_ministere: 6, name: 'Ministère de la Santé' },
  ];

  searchTerm = '';
  filteredMinistries: Ministry[] = [...this.ministries];
  paginatedMinistries: Ministry[] = [];

  currentPage = 1;
  itemsPerPage = 5;
  isNightMode = false;

  // Modal state
  showModal = false;
  modalTitle = '';
  modalButtonText = '';
  ministryName = '';
  currentMinistry: Ministry | null = null;

  constructor() {
    this.updatePaginatedMinistries();
  }

  // Recherche
  filterMinistries() {
    const term = this.searchTerm.toLowerCase();
    this.filteredMinistries = this.ministries.filter(ministry =>
      ministry.name.toLowerCase().includes(term)
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

  // Modal Logic
  openModal(action: string, ministry?: Ministry) {
    this.showModal = true;
    if (action === 'add') {
      this.modalTitle = 'Ajouter un Ministère';
      this.modalButtonText = 'Ajouter';
      this.ministryName = '';
      this.currentMinistry = null;
    } else if (action === 'edit' && ministry) {
      this.modalTitle = `Modifier le ministère : ${ministry.name}`;
      this.modalButtonText = 'Modifier';
      this.ministryName = ministry.name;
      this.currentMinistry = ministry;
    }
  }

  closeModal() {
    this.showModal = false;
  }

  saveMinistry() {
    if (this.currentMinistry) {
      this.currentMinistry.name = this.ministryName;
    } else {
      const newId = this.ministries.length + 1;
      this.ministries.push({ id_ministere: newId, name: this.ministryName });
    }

    this.closeModal();
    this.filterMinistries(); // Update list after save
  }

  deleteMinistry(id_ministere: number) {
    if (confirm('Voulez-vous vraiment supprimer ce ministère ?')) {
      this.ministries = this.ministries.filter(m => m.id_ministere !== id_ministere);
      this.filterMinistries(); // Mise à jour après suppression
    }
  }
}
