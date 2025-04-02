import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

interface Requete {
  ref: number;
  objet: string;
  typeRequete: string;
  description: string;
  etat: string;
  [key: string]: string | number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  requetes: Requete[] = [
    { ref: 101, objet: 'Panne serveur', typeRequete: 'Réclamation', description: 'Le serveur principal est hors ligne.', etat: 'Nouveau' },
    { ref: 102, objet: 'Maintenance réseau', typeRequete: 'Demande de travaux', description: 'Besoin de maintenance sur le réseau.', etat: 'En cours de traitement' },
    { ref: 103, objet: 'Accès refusé', typeRequete: 'Réclamation', description: 'Problème d’accès à l’application.', etat: 'Traité' },
    { ref: 104, objet: 'Installation antivirus', typeRequete: 'Demande de travaux', description: 'Installation d’un antivirus sur les postes.', etat: 'Nouveau' },
    { ref: 105, objet: 'Problème de connexion VPN', typeRequete: 'Réclamation', description: 'Impossible de se connecter au VPN de l’entreprise.', etat: 'Nouveau' },
    { ref: 106, objet: 'Erreur d’impression', typeRequete: 'Demande de travaux', description: 'L’imprimante ne fonctionne plus correctement.', etat: 'En cours de traitement' },
    { ref: 107, objet: 'Rétablissement de l’accès à l’application', typeRequete: 'Réclamation', description: 'L’accès à l’application est bloqué pour tous les utilisateurs.', etat: 'Traité' },
    { ref: 108, objet: 'Mise à jour de sécurité', typeRequete: 'Demande de travaux', description: 'Demande de mise à jour des logiciels de sécurité.', etat: 'Nouveau' }
   , { ref: 109, objet: 'Problème avec le réseau Wi-Fi', typeRequete: 'Réclamation', description: 'Le réseau Wi-Fi est lent et instable.', etat: 'En cours de traitement' },
    { ref: 110, objet: 'Problème de stockage de données', typeRequete: 'Demande de travaux', description: 'Le serveur de stockage est plein.', etat: 'Traité' },
    { ref: 111, objet: 'Accès aux fichiers partagés', typeRequete: 'Réclamation', description: 'Les utilisateurs ne peuvent pas accéder aux fichiers partagés.', etat: 'Nouveau' },
    { ref: 112, objet: 'Erreur de synchronisation de la messagerie', typeRequete: 'Demande de travaux', description: 'Les emails ne se synchronisent plus sur les appareils.', etat: 'En cours de traitement' },
    { ref: 113, objet: 'Problème d’authentification', typeRequete: 'Réclamation', description: 'Impossible de se connecter à l’outil de gestion.', etat: 'Traité' },
    { ref: 114, objet: 'Mise en place d’un nouveau serveur', typeRequete: 'Demande de travaux', description: 'Demande pour l’installation d’un nouveau serveur de production.', etat: 'Nouveau' },
    { ref: 115, objet: 'Réinstallation du système', typeRequete: 'Réclamation', description: 'Le système d’exploitation est corrompu et nécessite une réinstallation complète.', etat: 'En cours de traitement' },
    { ref: 116, objet: 'Problème avec le pare-feu', typeRequete: 'Demande de travaux', description: 'Le pare-feu bloque certaines connexions essentielles.', etat: 'Traité' },
    { ref: 117, objet: 'Réinitialisation du mot de passe', typeRequete: 'Réclamation', description: 'Un utilisateur a oublié son mot de passe et demande une réinitialisation.', etat: 'Nouveau' },
    { ref: 118, objet: 'Mise à jour de l’application', typeRequete: 'Demande de travaux', description: 'Demande de mise à jour de l’application interne.', etat: 'En cours de traitement' },
    { ref: 119, objet: 'Problème d’affichage', typeRequete: 'Réclamation', description: 'Les écrans de travail ne s’affichent pas correctement.', etat: 'Traité' },
    { ref: 120, objet: 'Configuration du nouvel équipement', typeRequete: 'Demande de travaux', description: 'Demande de configuration pour le nouvel équipement réseau.', etat: 'Nouveau' },
    { ref: 121, objet: 'Erreur de sauvegarde', typeRequete: 'Réclamation', description: 'La sauvegarde automatique échoue sur certains systèmes.', etat: 'En cours de traitement' }
   
  ];

  filteredRequetes: Requete[] = [];
  paginatedRequetes: Requete[] = [];
  searchTerm: string = '';
  sortDirection: { [key: string]: boolean } = {};
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  isNightMode: boolean = false;

  constructor(private router: Router) {}
  ngOnInit(): void {
    this.filteredRequetes = [...this.requetes];
    this.updatePagination();

    // Vérification du mode stocké dans localStorage
    const storedMode = localStorage.getItem('mode');
    if (storedMode === 'night') {
      this.isNightMode = true;
      document.body.classList.add('night-mode'); // Ajouter la classe pour le mode nuit
    } else {
      this.isNightMode = false;
    }
  }
  
  
  
  
  

  // 🔍 Filtrer les réclamations
  filterReclamations() {
    this.filteredRequetes = this.requetes.filter(requete =>
      Object.values(requete).some(value =>
        value.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
      )
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  // ⏬ Trier les requêtes
  sort(column: string) {
    this.sortDirection[column] = !this.sortDirection[column];
    const direction = this.sortDirection[column] ? 1 : -1;
    
    this.filteredRequetes.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return direction * (valA - valB);
      }
      return direction * valA.toString().localeCompare(valB.toString(), 'fr', { numeric: true });
    });
    this.updatePagination();
  }

  // 🎨 Badge en fonction de l'état
  getBadgeClass(etat: string) {
    switch (etat) {
      case 'Nouveau': return 'badge-primary';
      case 'En cours de traitement': return 'badge-warning';
      case 'Traité': return 'badge-success';
      case 'Refusé': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  // 🔄 Pagination : page précédente
  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  // 🔄 Pagination : page suivante
  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  onItemsPerPageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.itemsPerPage = Number(target.value); // Récupérer la nouvelle valeur
    this.currentPage = 1; // Revenir à la première page
    this.updatePagination(); // Mettre à jour la pagination
  }

  // ✅ Mise à jour de la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredRequetes.length / this.itemsPerPage);
    this.paginatedRequetes = this.filteredRequetes.slice(
      (this.currentPage - 1) * this.itemsPerPage,
      this.currentPage * this.itemsPerPage
    );
  }
  toggleMode(): void {
    this.isNightMode = !this.isNightMode;
    if (this.isNightMode) {
      document.body.classList.add('night-mode'); // Ajouter la classe pour le mode nuit
      localStorage.setItem('mode', 'night'); // Sauvegarder l'état du mode
    } else {
      document.body.classList.remove('night-mode'); // Supprimer la classe pour le mode nuit
      localStorage.setItem('mode', 'day'); // Sauvegarder l'état du mode
    }
  }
  
  
  
  enableNightMode(): void {
    document.body.classList.add("night-mode");
    localStorage.setItem("mode", "night");
  }
  
  disableNightMode(): void {
    document.body.classList.remove("night-mode");
    localStorage.setItem("mode", "day");
  }
  

  // 🔄 Navigation vers la page de réclamation
  goToReclamationPage() {
    this.router.navigate(['/reclamation']);
  }
}
