import { Component, OnInit } from '@angular/core';
import { RendezvousService, Rendezvous } from 'src/app/services/rendez-vous.service';

@Component({
  selector: 'app-gerer-rdv',
  templateUrl: './gerer-rdv.component.html',
  styleUrls: ['./gerer-rdv.component.css']
})
export class GererRdvComponent implements OnInit {
  rendezvous: Rendezvous[] = [];
  rendezvousForm: Rendezvous = { id: 0, client: { nom: '', prenom: '' }, dateEnvoi: new Date(), typeProbleme: '', description: '', etat: 'En attente' };
  searchTerm: string = '';
  itemsPerPage: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  paginatedRendezvous: Rendezvous[] = [];
  isModalOpen: boolean = false;
  isEditMode: boolean = false;

  constructor(private rendezvousService: RendezvousService) {}

  ngOnInit() {
    this.getRendezvous();
  }

  getRendezvous() {
    this.rendezvous = this.rendezvousService.getRendezvous();
    this.paginateRendezvous();
  }

  paginateRendezvous() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedRendezvous = this.rendezvous.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.rendezvous.length / this.itemsPerPage);
  }

  openModal(): void {
    this.isModalOpen = true;
    this.isEditMode = false;
    this.rendezvousForm = { id: 0, client: { nom: '', prenom: '' }, dateEnvoi: new Date(), typeProbleme: '', description: '', etat: 'En attente' };
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.rendezvousForm = { id: 0, client: { nom: '', prenom: '' }, dateEnvoi: new Date(), typeProbleme: '', description: '', etat: 'En attente' };
  }

  addRendezvous() {
    if (this.rendezvousForm.client.nom && this.rendezvousForm.client.prenom && this.rendezvousForm.typeProbleme && this.rendezvousForm.description) {
      this.rendezvousService.addRendezvous(this.rendezvousForm);
      this.getRendezvous();
      this.closeModal();
    } else {
      alert('Veuillez remplir tous les champs');
    }
  }

  openEditModal(rendezvous: Rendezvous) {
    this.isModalOpen = true;
    this.isEditMode = true;
    this.rendezvousForm = { ...rendezvous }; // Copie de l'objet pour l'édition
  }

  updateRendezvous() {
    if (this.rendezvousForm.client.nom && this.rendezvousForm.client.prenom && this.rendezvousForm.typeProbleme && this.rendezvousForm.description) {
      const index = this.rendezvous.findIndex(rdv => rdv.id === this.rendezvousForm.id);
      if (index !== -1) {
        this.rendezvousService.updateRendezvous(index, this.rendezvousForm);
        this.getRendezvous();
        this.closeModal();
      }
    } else {
      alert('Veuillez remplir tous les champs');
    }
  }

  deleteRendezvous(id: number) {
    const index = this.rendezvous.findIndex(rdv => rdv.id === id);
    if (index !== -1) {
      this.rendezvousService.deleteRendezvous(index);
      this.getRendezvous();
    }
  }

  filterRendezvous() {
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      this.rendezvous = this.rendezvousService.getRendezvous().filter(rdv =>
        rdv.client.nom.toLowerCase().includes(term) ||
        rdv.client.prenom.toLowerCase().includes(term) ||
        rdv.typeProbleme.toLowerCase().includes(term) ||
        rdv.description.toLowerCase().includes(term) ||
        rdv.etat.toLowerCase().includes(term)
      );
    } else {
      this.getRendezvous();
    }
    this.paginateRendezvous();
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateRendezvous();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateRendezvous();
    }
  }

  onItemsPerPageChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.itemsPerPage = Number(selectElement.value);
    this.currentPage = 1;
    this.paginateRendezvous();
  }
}