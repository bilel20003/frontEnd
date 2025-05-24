import { Component, OnInit } from '@angular/core';
import { RequeteService } from 'src/app/services/requete.service';
import { Requete } from 'src/app/models/requete.model';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
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
  selector: 'app-requetes-admin',
  templateUrl: './requetes-admin.component.html',
  styleUrls: ['./requetes-admin.component.css']
})
export class RequetesAdminComponent implements OnInit {
  requetes: Requete[] = [];
  filteredRequetes: Requete[] = [];
  paginatedRequetes: Requete[] = [];
  searchTerm: string = '';
  itemsPerPage: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  isNightMode: boolean = false;
  isDetailModalOpen: boolean = false;
  selectedRequete: Requete | null = null;
  sortDirection: { [key: string]: boolean } = { id: false };
  attachmentPreviews: AttachmentPreview[] = [];

  constructor(
    private requeteService: RequeteService,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const storedMode = localStorage.getItem('mode');
    if (storedMode === 'night') {
      this.isNightMode = true;
      document.body.classList.add('night-mode');
    }
    this.loadRequetes();
  }

  loadRequetes() {
    this.requeteService.getAllRequetes().subscribe({
      next: (requetes: Requete[]) => {
        this.requetes = requetes.map(req => ({
          ...req,
          piecesJointes: req.piecesJointes?.map(pj => ({
            ...pj,
            url: pj.url || `http://localhost:8082/api/requetes/download/${pj.id}`,
            nom_fichier: pj.nom_fichier || `fichier_${pj.id}`
          })) || []
        }));
        this.filteredRequetes = [...this.requetes];
        this.filteredRequetes.sort((a, b) => b.id - a.id);
        this.updatePagination();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des requêtes:', error);
        this.showError(`Erreur réseau (statut ${error.status}): Impossible de charger les requêtes.`);
        this.requetes = [];
        this.filteredRequetes = [];
        this.paginatedRequetes = [];
      }
    });
  }

  filterRequetes(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredRequetes = [...this.requetes];
    } else {
      this.filteredRequetes = this.requetes.filter(requete => {
        return (
          (requete.id?.toString().toLowerCase().includes(term) || false) ||
          (requete.type?.toLowerCase().includes(term) || false) ||
          (requete.objet?.name?.toLowerCase().includes(term) || false) ||
          (requete.description?.toLowerCase().includes(term) || false) ||
          (requete.etat?.toLowerCase().includes(term) || false) ||
          (requete.date ? new Date(requete.date).toISOString().toLowerCase().includes(term) : false) ||
          (requete.client?.name?.toLowerCase().includes(term) || false) ||
          (requete.guichetier?.name?.toLowerCase().includes(term) || false) ||
          (requete.technicien?.name?.toLowerCase().includes(term) || false)
        );
      });
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  sort(column: string): void {
    if (this.sortDirection[column] === undefined) {
      this.sortDirection[column] = column === 'id' ? false : true;
    } else {
      this.sortDirection[column] = !this.sortDirection[column];
    }
    const dir = this.sortDirection[column] ? 1 : -1;

    this.filteredRequetes.sort((a, b) => {
      let valA: any, valB: any;
      switch (column) {
        case 'id':
          valA = a.id;
          valB = b.id;
          return dir * (valA - valB);
        case 'type':
          valA = a.type || '';
          valB = b.type || '';
          break;
        case 'objet':
          valA = a.objet.name || '';
          valB = b.objet.name || '';
          break;
        case 'description':
          valA = a.description || '';
          valB = b.description || '';
          break;
        case 'etat':
          valA = a.etat || '';
          valB = b.etat || '';
          break;
        case 'date':
          valA = new Date(a.date).getTime();
          valB = new Date(b.date).getTime();
          return dir * (valA - valB);
        case 'client':
          valA = a.client.name || '';
          valB = b.client.name || '';
          break;
        case 'guichetier':
          valA = a.guichetier?.name || '';
          valB = b.guichetier?.name || '';
          break;
        case 'technicien':
          valA = a.technicien?.name || '';
          valB = b.technicien?.name || '';
          break;
        default:
          valA = '';
          valB = '';
      }
      return dir * valA.toString().localeCompare(valB.toString(), 'fr', { numeric: true });
    });

    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredRequetes.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedRequetes = this.filteredRequetes.slice(start, start + this.itemsPerPage);
  }

  onItemsPerPageChange(event: Event) {
    this.itemsPerPage = Number((event.target as HTMLSelectElement).value);
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number) {
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

  openDetailModal(requete: Requete) {
    this.selectedRequete = { ...requete };
    this.isDetailModalOpen = true;
    this.loadPieceJointesForRequete();
  }

  closeDetailModal() {
    this.isDetailModalOpen = false;
    this.selectedRequete = null;
    this.attachmentPreviews = [];
  }

  archiveRequete(id: number): void {
    this.requeteService.archiveRequete(id).subscribe({
      next: (updatedRequete: Requete) => {
        const index = this.requetes.findIndex(r => r.id === id);
        if (index !== -1) {
          this.requetes[index] = { ...this.requetes[index], isArchived: true };
          this.filteredRequetes = [...this.requetes];
          this.updatePagination();
          this.showSuccess('Requête archivée avec succès !');
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors de l\'archivage de la requête:', error);
        this.showError('Erreur lors de l\'archivage de la requête.');
      }
    });
  }

  getTypeBadgeClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'DEMANDE_DE_TRAVAUX':
        return 'badge-info';
      case 'RECLAMATION':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  }

  getEtatBadgeClass(etat: string): string {
    switch (etat?.toUpperCase()) {
      case 'NOUVEAU':
      case 'PENDING':
        return 'badge-primary';
      case 'EN_COURS_DE_TRAITEMENT':
      case 'IN_PROGRESS':
        return 'badge-warning';
      case 'TRAITEE':
      case 'COMPLETED':
        return 'badge-success';
      case 'REFUSEE':
        return 'badge-danger';
      case 'BROUILLON':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  }

  formatDisplayText(text: string): string {
    if (!text) return '';

    const displayMap: { [key: string]: string } = {
      'DEMANDE_DE_TRAVAUX': 'Demande de travaux',
      'RECLAMATION': 'Réclamation',
      'NOUVEAU': 'Nouveau',
      'PENDING': 'Nouveau',
      'EN_COURS_DE_TRAITEMENT': 'En cours de traitement',
      'IN_PROGRESS': 'En cours de traitement',
      'TRAITEE': 'Traitée',
      'COMPLETED': 'Traitée',
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

  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
    localStorage.setItem('mode', this.isNightMode ? 'night' : 'day');
  }

  private loadPieceJointesForRequete(): void {
    if (!this.selectedRequete || !this.selectedRequete.piecesJointes || this.selectedRequete.piecesJointes.length === 0) {
      this.attachmentPreviews = [];
      return;
    }

    const pieceJointeCalls = this.selectedRequete.piecesJointes.map(pj =>
      this.requeteService.getPieceJointeParId(pj.id!).pipe(
        catchError(err => {
          console.error(`Erreur lors du chargement de la pièce jointe ${pj.id}:`, err.message);
          return of({ id: pj.id, nomFichier: pj.nom_fichier || `fichier_${pj.id}`, url: pj.url || `http://localhost:8082/api/requetes/download/${pj.id}`, typeFichier: 'application/octet-stream' });
        })
      )
    );

    forkJoin(pieceJointeCalls).subscribe({
      next: (results) => {
        if (this.selectedRequete) {
          this.selectedRequete.piecesJointes = results.map((pj: any) => ({
            id: pj.id,
            nom_fichier: pj.nomFichier || `fichier_${pj.id}`,
            url: pj.url || `http://localhost:8082/api/requetes/download/${pj.id}`,
            typeFichier: pj.typeFichier
          }));
          this.generateAttachmentPreviews();
        }
      },
      error: (err) => {
        console.error('Erreur globale lors du chargement des pièces jointes:', err.message);
        this.attachmentPreviews = [];
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
      const previewObj: AttachmentPreview = {
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

  previewAttachment(attachment: AttachmentPreview): void {
    if (!attachment.url) {
      this.showError('URL de la pièce jointe non disponible.');
      return;
    }

    this.http.get(attachment.url, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const objectUrl = window.URL.createObjectURL(blob);
        const previewWindow = window.open(objectUrl, '_blank');
        if (previewWindow) {
          previewWindow.document.title = attachment.nom_fichier;
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

  downloadAttachment(attachment: AttachmentPreview): void {
    if (!attachment.url) {
      this.showError('URL de la pièce jointe non disponible.');
      return;
    }

    this.http.get(attachment.url, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = attachment.nom_fichier;
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

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 10000,
      panelClass: ['custom-error-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['custom-success-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }
}