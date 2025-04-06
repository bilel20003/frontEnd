import { Component, OnInit } from '@angular/core';
import { MinistryService } from 'src/app/services/ministry.service';  // Assure-toi d'avoir un service pour récupérer les ministères
import { Observable } from 'rxjs';

// Définition des interfaces
interface Service {
  name: string;
}

interface Ministry {
  id: number;
  name: string;
  services: Service[];
}

@Component({
  selector: 'app-ministere',
  templateUrl: './ministere.component.html',
  styleUrls: ['./ministere.component.css']
})
export class MinistryManagementComponent implements OnInit {

  ministries: Ministry[] = [];  // Liste de tous les ministères avec les services
  paginatedMinistries: Ministry[] = [];  // Ministères paginés
  searchTerm = '';  // Terme de recherche pour filtrer les ministères
  currentPage = 1;  // Page courante pour la pagination
  totalPages = 1;  // Nombre total de pages pour la pagination
  itemsPerPage = 5;  // Nombre de ministères par page
  isNightMode = false;  // Variable pour gérer le mode nuit

  constructor(private ministryService: MinistryService) { }

  ngOnInit(): void {
    this.loadMinistries();
  }

  // Fonction pour charger les ministères depuis le service
  loadMinistries(): void {
    this.ministryService.getAllMinistries().subscribe(data => {
      this.ministries = data;
      this.totalPages = Math.ceil(this.ministries.length / this.itemsPerPage);
      this.paginateMinistries();
    });
  }

  // Fonction de filtrage des ministères
  filterMinistries(): void {
    const filtered = this.ministries.filter(ministry => 
      ministry.name.toLowerCase().includes(this.searchTerm.toLowerCase()));
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.paginateMinistries(filtered);
  }

  // Fonction de pagination des ministères
  paginateMinistries(filteredMinistries: Ministry[] = this.ministries): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedMinistries = filteredMinistries.slice(start, end);
  }

  // Ajouter un ministère
  addMinistry(): void {
    // Logique pour ajouter un ministère (peut-être ouvrir un formulaire modal)
    console.log('Ajouter un ministère');
  }

  // Modifier un ministère
  editMinistry(ministry: Ministry): void {
    // Logique pour modifier un ministère (peut-être ouvrir un formulaire modal)
    console.log('Modifier le ministère', ministry);
  }

  // Supprimer un ministère
  deleteMinistry(ministryId: number): void {
    // Logique pour supprimer un ministère
    this.ministryService.deleteMinistry(ministryId).subscribe(() => {
      this.loadMinistries();  // Recharge les ministères après suppression
    });
  }

  // Ajouter un service à un ministère
  addService(ministryId: number): void {
    // Logique pour ajouter un service à un ministère
    console.log('Ajouter un service au ministère avec id:', ministryId);
  }

  // Aller à la page suivante
  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateMinistries();
    }
  }

  // Aller à la page précédente
  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateMinistries();
    }
  }

  // Changer le nombre de ministères par page
  onItemsPerPageChange(): void {
    this.totalPages = Math.ceil(this.ministries.length / this.itemsPerPage);
    this.paginateMinistries();
  }

  // Changer le mode nuit
  toggleMode(): void {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }
}
