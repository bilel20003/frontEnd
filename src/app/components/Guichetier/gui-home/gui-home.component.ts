import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RequeteService } from 'src/app/services/requete.service';
import { Requete } from 'src/app/models/requete.model';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-gui-home',
  templateUrl: './gui-home.component.html',
  styleUrls: ['./gui-home.component.css']
})
export class GuiHomeComponent implements OnInit {
  reclamations: Requete[] = [];
  filteredReclamations: Requete[] = [];
  searchTerm: string = '';
  sortDirection: { [key: string]: boolean } = {};
  isPopupOpen: boolean = false; // État de la popup
  selectedRequete: Requete | null = null; // Requête sélectionnée pour la popup
  zoneTexteVisible: boolean = false; // Contrôle l'affichage de la zone de texte
  noteRetour: string = ''; // Note de retour à remplir

  constructor(
    private router: Router,
    private requeteService: RequeteService
  ) {}

  ngOnInit(): void {
    const guichetierId = this.getGuichetierIdFromToken();
    if (guichetierId) {
      this.loadReclamations(guichetierId);
    } else {
      alert('Session invalide. Veuillez vous reconnecter.');
      this.router.navigate(['/login']);
    }
    
  }

  private getGuichetierIdFromToken(): number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decoded = jwtDecode<{ id: number }>(token);
      return decoded.id ?? null;
    } catch (e) {
      console.error('Erreur de décodage du token:', e);
      return null;
    }
  }

  loadReclamations(guichetierId: number): void {
    this.requeteService.getRequetesByGuichetierId(guichetierId).subscribe(
      (data) => {
        this.reclamations = data;
        this.filteredReclamations = [...this.reclamations];
      },
      (error) => {
        console.error('Erreur lors du chargement des réclamations', error);
        alert('Impossible de charger les réclamations.');
      }
    );
  }

  filterReclamations() {
    this.filteredReclamations = this.reclamations.filter(reclamation =>
      Object.values(reclamation).some(value =>
        value && value.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
      )
    );
  }

  refuserReclamation(id: number) {
    const reclamation = this.reclamations.find(r => r.id === id);
    if (reclamation) {
      // Mettre à jour l'état de la requête
      reclamation.etat = 'REFUSEE';
      this.requeteService.updateRequete(id, reclamation).subscribe(
        () => {
          console.log('Réclamation refusée');
          // Rafraîchir les réclamations après la mise à jour
          this.loadReclamations(this.getGuichetierIdFromToken()!);
        },
        (error) => {
          console.error('Erreur lors du refus de la réclamation', error);
          alert('Erreur lors du refus de la réclamation.');
        }
      );
    }
  }

  sort(column: string) {
    this.sortDirection[column] = !this.sortDirection[column];
    const direction = this.sortDirection[column] ? 1 : -1;

    this.filteredReclamations = [...this.reclamations];
    this.filteredReclamations.sort((a, b) => {
      let valA = a[column as keyof Requete];
      let valB = b[column as keyof Requete];

      if (column === 'client' && valA && valB) {
        valA = (valA as { id: number }).id;
        valB = (valB as { id: number }).id;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return direction * (valA - valB);
      } else if (valA instanceof Date && valB instanceof Date) {
        return direction * (valA.getTime() - valB.getTime());
      }
      return direction * valA!.toString().localeCompare(valB!.toString(), 'fr', { numeric: true });
    });
  }

  getBadgeClass(etat: string) {
    switch (etat) {
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

  confirmerTraitement() {
    if (this.noteRetour) {
      // Logique pour mettre à jour l'état de la requête
      if (this.selectedRequete) {
        this.selectedRequete.etat = 'TRAITEE';
        this.selectedRequete.noteRetour = this.noteRetour; // Assurez-vous que le modèle a cette propriété
        this.requeteService.updateRequete(this.selectedRequete.id, this.selectedRequete).subscribe(
          () => {
            console.log('Requête traitée');
            this.loadReclamations(this.getGuichetierIdFromToken()!);
            this.noteRetour = ''; // Réinitialiser la note de retour
            this.zoneTexteVisible = false; // Cacher la zone de texte
            this.closePopup(); // Fermer la popup
          },
          (error) => {
            console.error('Erreur lors du traitement de la requête', error);
            alert('Erreur lors du traitement de la requête.');
          }
        );
      }
    } else {
      alert('Veuillez remplir la note de retour.');
    }
  }
  

  consulterReclamation(id: number): void {
    const reclamation = this.reclamations.find(r => r.id === id);
    if (reclamation) {
      this.selectedRequete = reclamation;
      this.isPopupOpen = true;
  
      // Mettre à jour l'état si nécessaire
      if (reclamation.etat === 'NOUVEAU') {
        reclamation.etat = 'EN_COURS_DE_TRAITEMENT';
        this.requeteService.updateRequete(id, reclamation).subscribe(
          () => {
            console.log('Requête mise à jour');
            // Rafraîchir les réclamations après la mise à jour
            this.loadReclamations(this.getGuichetierIdFromToken()!);
          },
          (error) => {
            console.error('Erreur lors de la mise à jour de la requête', error);
            alert('Erreur lors de la mise à jour de la requête.');
          }
        );
      }
  
      // Charger la note de retour dans la zone de texte
      this.noteRetour = reclamation.noteRetour || ''; // Assurez-vous que la propriété noteRetour existe
    }
  }

  closePopup(): void {
    this.isPopupOpen = false;
    this.selectedRequete = null;
    this.zoneTexteVisible = false; // Réinitialiser l'affichage de la zone de texte
    this.noteRetour = ''; // Réinitialiser la note de retour
  }
}