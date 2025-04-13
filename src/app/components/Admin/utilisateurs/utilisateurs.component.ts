import { Component, OnInit } from '@angular/core';
import { UtilisateurService } from 'src/app/services/utilisateur.service'; 

interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  role: string;
  ministere: string;
  service: string;
}

@Component({
  selector: 'app-utilisateurs',
  templateUrl: './utilisateurs.component.html',
  styleUrls: ['./utilisateurs.component.css']
})
export class UtilisateursComponent implements OnInit {

  utilisateurs: Utilisateur[] = [];
  newUtilisateur: Utilisateur = { id: 0, nom: '', email: '', role: '', ministere: '', service: '' };
  editingUtilisateur: Utilisateur | null = null;
  searchTerm: string = '';
  itemsPerPage: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  paginatedUtilisateurs: Utilisateur[] = [];
  isNightMode: boolean = false;
  isModalOpen: boolean = false; // Contrôle l'ouverture de la modale
  utilisateurForm: Utilisateur = { id: 0, nom: '', email: '', role: '', ministere: '', service: '' }; // Contient les données de l'utilisateur

  constructor(private utilisateurService: UtilisateurService) {}

  ngOnInit() {
    this.getUtilisateurs();
  }

  getUtilisateurs() {
    this.utilisateurs = this.utilisateurService.getUtilisateurs();
    this.paginateUtilisateurs();
  }

  paginateUtilisateurs() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedUtilisateurs = this.utilisateurs.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.utilisateurs.length / this.itemsPerPage);
  }

  // Ouvre la modale avec un utilisateur à modifier ou un formulaire vide pour un nouvel utilisateur
  openModal(utilisateur: Utilisateur | null = null): void {
    this.isModalOpen = true;
    if (utilisateur) {
      this.editingUtilisateur = { ...utilisateur };
      this.utilisateurForm = { ...utilisateur }; // Pré-remplir le formulaire avec les données de l'utilisateur
    } else {
      this.editingUtilisateur = null;
      this.utilisateurForm = { id: 0, nom: '', email: '', role: '', ministere: '', service: '' }; // Formulaire vide
    }
  }

  // Ferme la modale
  closeModal(): void {
    this.isModalOpen = false;
    this.utilisateurForm = { id: 0, nom: '', email: '', role: '', ministere: '', service: '' };
  }

  addUtilisateur() {
    if (this.utilisateurForm.nom && this.utilisateurForm.email && this.utilisateurForm.role && this.utilisateurForm.ministere && this.utilisateurForm.service) {
      this.utilisateurService.addUtilisateur(this.utilisateurForm);
      this.getUtilisateurs();
      this.closeModal();
    } else {
      alert('Veuillez remplir tous les champs');
    }
  }

  updateUtilisateur() {
    if (this.utilisateurForm && this.utilisateurForm.nom && this.utilisateurForm.email && this.utilisateurForm.role && this.utilisateurForm.ministere && this.utilisateurForm.service) {
      this.utilisateurService.updateUtilisateur(this.utilisateurForm.id, this.utilisateurForm);
      this.getUtilisateurs();
      this.closeModal();
    } else {
      alert('Veuillez remplir tous les champs');
    }
  }

  deleteUtilisateur(utilisateurId: number) {
    if (confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      this.utilisateurService.deleteUtilisateur(utilisateurId);
      this.getUtilisateurs();
    }
  }

  filterUtilisateurs() {
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      this.utilisateurs = this.utilisateurService.getUtilisateurs().filter(utilisateur =>
        utilisateur.nom.toLowerCase().includes(term) ||
        utilisateur.email.toLowerCase().includes(term) ||
        utilisateur.role.toLowerCase().includes(term) ||
        utilisateur.ministere.toLowerCase().includes(term) ||
        utilisateur.service.toLowerCase().includes(term)
      );
    } else {
      this.getUtilisateurs();
    }
    this.paginateUtilisateurs();
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateUtilisateurs();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateUtilisateurs();
    }
  }

  onItemsPerPageChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.itemsPerPage = Number(selectElement.value);
    this.currentPage = 1;
    this.paginateUtilisateurs();
  }

  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }

  // Actions de gestion des utilisateurs
  ajouterUtilisateur() {
    this.openModal(); // Ouvre une modale vide pour ajouter un utilisateur
  }

  modifierUtilisateur(utilisateur: Utilisateur) {
    this.openModal(utilisateur); // Ouvre la modale avec les informations de l'utilisateur à modifier
  }

  supprimerUtilisateur(utilisateur: Utilisateur) {
    if (confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      this.deleteUtilisateur(utilisateur.id);
    }
  }

  cancelEdit() {
    this.closeModal();
  }
}
