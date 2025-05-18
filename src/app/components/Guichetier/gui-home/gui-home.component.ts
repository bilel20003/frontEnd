import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { RequeteService } from 'src/app/services/requete.service';
import { ObjetService } from 'src/app/services/objet.service';
import { UserInfoService } from 'src/app/services/user-info.service';
import { UserInfo } from 'src/app/models/user-info.model';
import { Requete } from 'src/app/models/requete.model';
import { Objet } from 'src/app/models/objet.model';
import { jwtDecode } from 'jwt-decode';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface AttachmentPreview {
  nom_fichier: string;
  url: string;
  previewUrl?: string;
  type: string;
}

@Component({
  selector: 'app-gui-home',
  templateUrl: './gui-home.component.html',
  styleUrls: ['./gui-home.component.css']
})
export class GuiHomeComponent implements OnInit {
  reclamations: Requete[] = [];
  filteredReclamations: Requete[] = [];
  paginatedReclamations: Requete[] = [];
  objets: Objet[] = [];
  objetMap: { [key: number]: Objet } = {};
  techniciens: UserInfo[] = [];
  searchTerm: string = '';
  sortDirection: { [key: string]: boolean } = { id: true };
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  isPopupOpen: boolean = false;
  isTechnicienPopupOpen: boolean = false;
  selectedRequete: Requete | null = null;
  selectedTechnicienId: number | null = null;
  noteRetour: string = '';
  isObjetsLoaded: boolean = false;
  isNightMode: boolean = false;
  attachmentPreviews: AttachmentPreview[] = [];

  constructor(
    private router: Router,
    private requeteService: RequeteService,
    private objetService: ObjetService,
    private userInfoService: UserInfoService,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const guichetierId = this.getGuichetierIdFromToken();
    if (guichetierId) {
      this.loadObjets();
      this.loadReclamations(guichetierId);
      this.loadTechnicians();
    } else {
      this.showError('Session invalide. Veuillez vous reconnecter.');
      this.router.navigate(['/login']);
    }
  }

  toggleMode(): void {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
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

  private loadObjets(): void {
    this.objetService.getAllObjets().subscribe({
      next: (objets) => {
        console.log('Objets received:', objets);
        this.objets = objets;
        this.objetMap = objets.reduce((map, obj) => {
          map[obj.id] = obj;
          return map;
        }, {} as { [key: number]: Objet });
        this.isObjetsLoaded = true;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading objets:', err);
        this.showError('Impossible de charger les objets.');
        this.isObjetsLoaded = true;
      }
    });
  }

  private loadTechnicians(): void {
    this.userInfoService.getAllTechniciens().subscribe({
      next: (techniciens) => {
        console.log('Techniciens received:', techniciens);
        console.log('Technician IDs:', techniciens.map(t => t.id));
        this.techniciens = techniciens;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading techniciens:', err);
        this.showError('Impossible de charger la liste des techniciens.');
      }
    });
  }

  loadReclamations(guichetierId: number): void {
    this.requeteService.getRequetesByGuichetierId(guichetierId).subscribe({
      next: (data) => {
        console.log('Reclamations received:', data);
        this.reclamations = data.map(req => ({
          ...req,
          piecesJointes: req.piecesJointes?.map(pj => ({
            ...pj,
            url: pj.url || `http://localhost:8082/api/requetes/download/${pj.id}`,
            nom_fichier: pj.nom_fichier || this.getFileNameFromUrl(pj.url || `http://localhost:8082/api/requetes/download/${pj.id}`)
          })) || []
        }));
        this.filteredReclamations = [...this.reclamations];
        console.log('IDs before sorting:', this.filteredReclamations.map(r => r.id));
        this.filteredReclamations.sort((a, b) => b.id - a.id);
        console.log('IDs after sorting:', this.filteredReclamations.map(r => r.id));
        this.updatePagination();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des réclamations', error);
        this.showError('Impossible de charger les réclamations.');
      }
    });
  }

  filterReclamations(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredReclamations = this.reclamations.filter(reclamation => {
      const objet = this.objetMap[reclamation.objet.id];
      return (
        Object.values(reclamation).some(val =>
          (typeof val === 'string' || typeof val === 'number' || val instanceof Date) &&
          val.toString().toLowerCase().includes(term)
        ) ||
        (objet?.name?.toLowerCase()?.includes(term) ?? false) ||
        (reclamation.client.name.toLowerCase().includes(term) ?? false) ||
        (reclamation.client.service?.ministere?.nomMinistere?.toLowerCase()?.includes(term) ?? false) ||
        (reclamation.client.service?.nomService?.toLowerCase()?.includes(term) ?? false) ||
        (reclamation.objet.produit?.nom?.toLowerCase()?.includes(term) ?? false)
      );
    });
    console.log('IDs before sorting (after filtering):', this.filteredReclamations.map(r => r.id));
    this.filteredReclamations.sort((a, b) => b.id - a.id);
    console.log('IDs after sorting (after filtering):', this.filteredReclamations.map(r => r.id));
    this.currentPage = 1;
    this.updatePagination();
  }

  sort(column: string): void {
    if (!this.sortDirection[column]) {
      this.sortDirection = { [column]: true };
    } else {
      this.sortDirection[column] = !this.sortDirection[column];
    }
    const direction = this.sortDirection[column] ? -1 : 1;

    this.filteredReclamations.sort((a, b) => {
      let valA: any = a[column as keyof Requete];
      let valB: any = b[column as keyof Requete];

      if (column === 'client') {
        valA = a.client.name ?? 'N/A';
        valB = b.client.name ?? 'N/A';
      } else if (column === 'objet') {
        valA = this.objetMap[a.objet.id]?.name ?? 'N/A';
        valB = this.objetMap[b.objet.id]?.name ?? 'N/A';
      } else if (column === 'date') {
        valA = a.date ? new Date(a.date).getTime() : 0;
        valB = b.date ? new Date(b.date).getTime() : 0;
      } else if (column === 'ministere') {
        valA = a.client.service?.ministere?.nomMinistere ?? 'N/A';
        valB = b.client.service?.ministere?.nomMinistere ?? 'N/A';
      } else if (column === 'service') {
        valA = a.client.service?.nomService ?? 'N/A';
        valB = b.client.service?.nomService ?? 'N/A';
      } else if (column === 'produit') {
        valA = a.objet.produit?.nom ?? 'N/A';
        valB = b.objet.produit?.nom ?? 'N/A';
      } else if (column === 'type' || column === 'etat') {
        valA = this.formatDisplayText(valA) ?? 'N/A';
        valB = this.formatDisplayText(valB) ?? 'N/A';
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return direction * (valA - valB);
      } else if (valA instanceof Date && valB instanceof Date) {
        return direction * (valA.getTime() - valB.getTime());
      }
      return direction * valA.toString().localeCompare(valB.toString(), 'fr', { numeric: true });
    });

    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredReclamations.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedReclamations = this.filteredReclamations.slice(start, start + this.itemsPerPage);
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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const maxPagesToShow = 5;
    const pages: number[] = [];
    let startPage: number, endPage: number;

    if (this.totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = this.totalPages;
    } else {
      const half = Math.floor(maxPagesToShow / 2);
      startPage = Math.max(1, this.currentPage - half);
      endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = endPage - maxPagesToShow + 1;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  getBadgeClass(etat: string): string {
    switch (etat.toUpperCase()) {
      case 'NOUVEAU': return 'badge-primary';
      case 'EN_COURS_DE_TRAITEMENT': return 'badge-warning';
      case 'TRAITEE': return 'badge-success';
      case 'REFUSEE': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type.toUpperCase()) {
      case 'DEMANDE_DE_TRAVAUX': return 'badge-info';
      case 'RECLAMATION': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  formatDisplayText(text: string): string {
    if (!text) return '';

    const displayMap: { [key: string]: string } = {
      'DEMANDE_DE_TRAVAUX': 'Demande de travaux',
      'RECLAMATION': 'Réclamation',
      'NOUVEAU': 'Nouveau',
      'EN_COURS_DE_TRAITEMENT': 'En cours de traitement',
      'TRAITEE': 'Traitée',
      'REFUSEE': 'Refusée',
      'BROUILLON': 'Brouillon'
    };

    const upperText = text.toUpperCase();
    if (displayMap[upperText]) {
      return displayMap[upperText];
    }

    return text
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/(^|\s)\w/g, char => char.toUpperCase());
  }

  consulterReclamation(id: number): void {
    const reclamation = this.reclamations.find(r => r.id === id);
    if (reclamation) {
      this.selectedRequete = { ...reclamation };
      this.isPopupOpen = true;

      if (reclamation.etat === 'NOUVEAU') {
        const updatedRequete = { ...reclamation, etat: 'EN_COURS_DE_TRAITEMENT', dateTraitement: new Date() };
        this.requeteService.updateRequete(id, updatedRequete).subscribe({
          next: () => {
            console.log('Requête mise à jour avec succès');
            this.loadReclamations(this.getGuichetierIdFromToken()!);
            this.showSuccess('Requête mise à jour avec succès !');
            this.loadPieceJointesForRequete();
            this.generateAttachmentPreviews();
          },
          error: (error: HttpErrorResponse) => {
            console.error('Erreur lors de la mise à jour de la requête', error);
            this.showError('Erreur lors de la mise à jour de la requête.');
          }
        });
      } else {
        this.loadPieceJointesForRequete();
        this.generateAttachmentPreviews();
      }

      this.noteRetour = reclamation.noteRetour || '';
      this.selectedTechnicienId = reclamation.technicien?.id || null;
    }
  }

  private loadPieceJointesForRequete(): void {
    if (!this.selectedRequete || !this.selectedRequete.piecesJointes || this.selectedRequete.piecesJointes.length === 0) {
      if (this.selectedRequete) {
        this.selectedRequete = { ...this.selectedRequete, piecesJointes: [] };
      }
      return;
    }

    const pieceJointeCalls = this.selectedRequete.piecesJointes.map(pj =>
      this.requeteService.getPieceJointeParId(pj.id!).pipe(
        catchError(err => {
          console.error(`Erreur lors du chargement de la pièce jointe ${pj.id}:`, err.message);
          return of({ id: pj.id, nomFichier: `fichier_${pj.id}`, url: `http://localhost:8082/api/requetes/download/${pj.id}`, typeFichier: 'application/octet-stream' });
        })
      )
    );

    forkJoin(pieceJointeCalls).subscribe({
      next: (results) => {
        if (this.selectedRequete) {
          this.selectedRequete = {
            ...this.selectedRequete,
            piecesJointes: results.map((pj: any) => ({
              id: pj.id,
              nom_fichier: pj.nomFichier,
              url: pj.url || `http://localhost:8082/api/requetes/download/${pj.id}`,
              typeFichier: pj.typeFichier
            }))
          };
          this.generateAttachmentPreviews();
        }
      },
      error: (err) => {
        console.error('Erreur globale lors du chargement des pièces jointes:', err.message);
        if (this.selectedRequete) {
          this.selectedRequete = { ...this.selectedRequete, piecesJointes: [] };
        }
      }
    });
  }

  private generateAttachmentPreviews(): void {
    this.attachmentPreviews = [];
    if (!this.selectedRequete?.piecesJointes || this.selectedRequete.piecesJointes.length === 0) {
      console.warn('No pieces jointes found for requete ID:', this.selectedRequete?.id);
      return;
    }

    const imageTypes = ['image/jpeg', 'image/png'];
    this.selectedRequete.piecesJointes.forEach(attachment => {
      const type = this.getFileType(attachment.nom_fichier || '');
      const previewObj = {
        nom_fichier: attachment.nom_fichier || `fichier_${attachment.id}`,
        url: attachment.url || `http://localhost:8082/api/requetes/download/${attachment.id}`,
        previewUrl: '',
        type
      };

      if (imageTypes.includes(type)) {
        this.http.get(attachment.url || `http://localhost:8082/api/requetes/download/${attachment.id}`, { responseType: 'blob' }).subscribe({
          next: (blob: Blob) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              previewObj.previewUrl = e.target?.result as string;
              this.attachmentPreviews = [...this.attachmentPreviews, previewObj];
            };
            reader.readAsDataURL(blob);
          },
          error: (err: HttpErrorResponse) => {
            console.error('Erreur lors de la récupération de la pièce jointe pour prévisualisation:', err.message);
            this.attachmentPreviews = [...this.attachmentPreviews, previewObj];
          }
        });
      } else {
        this.attachmentPreviews = [...this.attachmentPreviews, previewObj];
      }
    });
  }

  previewAttachment(attachment: { url: string; nom_fichier: string }): void {
    if (!attachment.url) {
      this.showError('URL de la pièce jointe non disponible.');
      return;
    }

    this.http.get(attachment.url, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const objectUrl = window.URL.createObjectURL(blob);
        const previewWindow = window.open(objectUrl, '_blank');
        if (previewWindow) {
          previewWindow.document.title = attachment.nom_fichier || this.getFileNameFromUrl(attachment.url);
        } else {
          this.showError('Impossible d’ouvrir la prévisualisation. Vérifiez les paramètres de votre navigateur.');
        }
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors de la prévisualisation de la pièce jointe:', err.message);
        this.showError('Impossible de prévisualiser la pièce jointe.');
      }
    });
  }

  downloadAttachment(attachment: { url: string; nom_fichier: string }): void {
    if (!attachment.url) {
      this.showError('URL de la pièce jointe non disponible.');
      return;
    }

    this.http.get(attachment.url, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = attachment.nom_fichier || this.getFileNameFromUrl(attachment.url);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(objectUrl);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors du téléchargement de la pièce jointe:', err.message);
        this.showError('Impossible de télécharger la pièce jointe.');
      }
    });
  }

  private getFileType(nom_fichier: string): string {
    const extension = nom_fichier.split('.').pop()?.toLowerCase() || '';
    const typeMap: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return typeMap[extension] || 'application/octet-stream';
  }

  private getFileNameFromUrl(url: string): string {
    const urlParts = url.split('/');
    const filePart = urlParts[urlParts.length - 1];
    return filePart.includes('?') ? filePart.split('?')[0] : filePart || 'document';
  }

   getFileIcon(nom_fichier: string): string {
    const extension = nom_fichier.split('.').pop()?.toLowerCase() || '';
    const iconMap: { [key: string]: string } = {
      'jpg': 'far fa-image',
      'jpeg': 'far fa-image',
      'png': 'far fa-image',
      'pdf': 'far fa-file-pdf',
      'doc': 'far fa-file-word',
      'docx': 'far fa-file-word'
    };
    return iconMap[extension] || 'far fa-file';
  }

  openTechnicienPopup(): void {
    if (this.selectedRequete && !this.selectedRequete.technicien && this.selectedRequete.etat !== 'TRAITEE' && this.selectedRequete.etat !== 'REFUSEE') {
      this.userInfoService.getAllTechniciens().subscribe({
        next: (techniciens) => {
          this.techniciens = techniciens;
          console.log('Opening technician popup. Technicians:', techniciens);
          console.log('Available Technician IDs:', techniciens.map(t => t.id));
          this.isTechnicienPopupOpen = true;
          this.selectedTechnicienId = null;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error refreshing technicians:', err);
          this.showError('Erreur lors du chargement des techniciens.');
        }
      });
    }
  }

  assignTechnicien(): void {
    if (!this.selectedRequete || !this.selectedTechnicienId) {
      this.showWarning('Veuillez sélectionner un technicien.');
      return;
    }

    const techId = +this.selectedTechnicienId;

    if (!this.techniciens.some(t => t.id === techId)) {
      this.showWarning('ID de technicien invalide. Veuillez sélectionner un technicien valide.');
      console.error('Invalid technician ID:', techId);
      return;
    }

    const selectedTechnicien = this.techniciens.find(t => t.id === techId);
    if (!selectedTechnicien) {
      this.showWarning('Technicien non trouvé. Veuillez réessayer.');
      console.error('Technician not found for ID:', techId);
      return;
    }

    this.selectedRequete.technicien = { id: techId, name: selectedTechnicien.name };
    console.log('Updating requete with payload:', this.selectedRequete);

    this.requeteService.updateRequete(this.selectedRequete.id, this.selectedRequete).subscribe({
      next: (response) => {
        console.log('Technicien affecté avec succès:', response);
        this.loadReclamations(this.getGuichetierIdFromToken()!);
        this.closePopup();
        this.showSuccess('Technicien affecté avec succès !');
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors de l\'affectation du technicien:', error);
        this.showError('Erreur lors de l\'affectation du technicien: ' + (error.error?.message || error.message));
      }
    });
  }

  confirmerTraitement(): void {
    if (!this.noteRetour) {
      this.showWarning('Veuillez remplir la note de retour.');
      return;
    }

    if (this.selectedRequete) {
      this.selectedRequete.etat = 'TRAITEE';
      this.selectedRequete.noteRetour = this.noteRetour;
      this.selectedRequete.dateTraitement = new Date();
      this.requeteService.updateRequete(this.selectedRequete.id, this.selectedRequete).subscribe({
        next: (response: any) => {
          console.log('Requête traitée', response);
          this.loadReclamations(this.getGuichetierIdFromToken()!);
          this.noteRetour = '';
          this.closePopup();
          this.showSuccess('Requête traitée avec succès !');
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur lors du traitement de la requête', error);
          this.showError('Erreur lors du traitement de la requête.');
        }
      });
    }
  }

  refuserReclamation(id: number): void {
    const reclamation = this.reclamations.find(r => r.id === id);
    if (reclamation) {
      reclamation.etat = 'REFUSEE';
      reclamation.dateTraitement = new Date();
      this.requeteService.updateRequete(id, reclamation).subscribe({
        next: () => {
          console.log('Réclamation refusée');
          this.loadReclamations(this.getGuichetierIdFromToken()!);
          this.showSuccess('Réclamation refusée avec succès !');
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur lors du refus de la réclamation', error);
          this.showError('Erreur lors du refus de la réclamation.');
        }
      });
    }
  }

  closePopup(): void {
    this.isPopupOpen = false;
    this.isTechnicienPopupOpen = false;
    this.selectedRequete = null;
    this.selectedTechnicienId = null;
    this.noteRetour = '';
    this.attachmentPreviews = [];
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 10000,
      panelClass: ['custom-success-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 10000,
      panelClass: ['custom-error-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }

  private showWarning(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 10000,
      panelClass: ['custom-warning-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }
}