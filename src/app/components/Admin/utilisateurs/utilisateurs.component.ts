import { Component } from '@angular/core';

@Component({
  selector: 'app-utilisateurs',
  templateUrl: './utilisateurs.component.html',
  styleUrls: ['./utilisateurs.component.css']
})
export class UtilisateursComponent {
  utilisateurs = [
    { nom: 'Ali Ben Salah', email: 'ali@example.com', role: 'client', ministere: 'Ministère A', service: 'Service 1' },
    { nom: 'Fatma Trabelsi', email: 'fatma@example.com', role: 'guichetier', ministere: 'Ministère B', service: 'Service 2' },
    // ... d'autres utilisateurs
  ];

  searchTerm = '';
  filteredUtilisateurs = this.utilisateurs;
  currentPage = 1;
  itemsPerPage = 5;
  isNightMode = false;

  get paginatedUtilisateurs() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUtilisateurs.slice(start, start + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredUtilisateurs.length / this.itemsPerPage);
  }

  filterUtilisateurs() {
    this.filteredUtilisateurs = this.utilisateurs.filter(user =>
      user.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.currentPage = 1;
  }

  onItemsPerPageChange(event: any) {
    this.currentPage = 1;
  }

  goToPreviousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  ajouterUtilisateur() {
    // rediriger vers une page ou ouvrir une modal
    alert('Ajouter utilisateur');
  }

  modifierUtilisateur(user: any) {
    alert(`Modifier ${user.nom}`);
  }

  supprimerUtilisateur(user: any) {
    const confirmed = confirm(`Supprimer ${user.nom} ?`);
    if (confirmed) {
      this.utilisateurs = this.utilisateurs.filter(u => u !== user);
      this.filterUtilisateurs();
    }
  }

  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }
}
