import { Component, OnInit } from '@angular/core';
import { UserInfo } from 'src/app/services/user-info';  // Assure-toi que le chemin est correct

// Définir le modèle Client directement dans ce fichier
export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  services: string[];  // Liste des services associés
}

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.css']
})
export class ClientManagementComponent implements OnInit {

  clients: Client[] = [];  // Liste de tous les clients
  paginatedClients: Client[] = [];  // Clients paginés
  searchTerm: string = '';
  currentPage: number = 1;
  totalPages: number = 1;
  itemsPerPage: number = 5;
  isNightMode = false;

  constructor(private UserInfo: UserInfo) { }

  ngOnInit(): void {
    this.loadClients();
  }

  // Charger les clients depuis le service
  loadClients(): void {
    
  }

  // Filtrer les clients
  filterClients(): void {
    const filtered = this.clients.filter(client =>
      client.name.toLowerCase().includes(this.searchTerm.toLowerCase()));
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.paginateClients(filtered);
  }

  // Pagination des clients
  paginateClients(filteredClients: Client[] = this.clients): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedClients = filteredClients.slice(start, end);
  }

  // Ajouter un client
  addClient(): void {
    
  }

  // Modifier un client
  editClient(client: Client): void {
    
    
  }

  // Supprimer un client
  deleteClient(clientId: number): void {
    
  }

  // Aller à la page suivante
  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateClients();
    }
  }

  // Aller à la page précédente
  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateClients();
    }
  }

  // Changer le nombre de clients par page
  onItemsPerPageChange(): void {
    this.totalPages = Math.ceil(this.clients.length / this.itemsPerPage);
    this.paginateClients();
  }

  // Changer le mode nuit
  toggleMode(): void {
    document.body.classList.toggle('night-mode');
  }
}
