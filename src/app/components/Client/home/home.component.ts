import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Requete } from 'src/app/models/requete.model';
import { ObjetType } from 'src/app/services/objet.service';
import { Objet } from 'src/app/models/objet.model';
import { Produit } from 'src/app/models/produit.model';
import { UserInfo } from 'src/app/models/user-info.model';
import { RequeteService } from 'src/app/services/requete.service';
import { ObjetService } from 'src/app/services/objet.service';
import { ProduitService } from 'src/app/services/produit.service';
import { AiService } from 'src/app/services/ai.service';
import { UserInfoService } from 'src/app/services/user-info.service';
import { jwtDecode } from 'jwt-decode';
import { Observable, forkJoin } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  requetes: Requete[] = [];
  filteredRequetes: Requete[] = [];
  paginatedRequetes: Requete[] = [];
  objets: Objet[] = [];
  popupObjets: Objet[] = [];
  produits: Produit[] = [];
  objetMap: { [key: number]: Objet } = {};
  produitMap: { [key: number]: Produit } = {};

  searchTerm: string = '';
  sortDirection: { [key: string]: boolean } = { id: false };
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  isNightMode: boolean = false;

  isPopupOpen: boolean = false;
  isCreatePopupOpen: boolean = false;
  selectedRequete: Requete | null = null;

  newRequete: Omit<Requete, 'id'> = this.getEmptyRequete();
  userInfo: { id: number; role: string; produit?: { id: number }; name?: string } | null = null;
  clientProduitId: number | null = null;
  isObjetsLoaded: boolean = false;
  isProduitsLoaded: boolean = false;
  welcomeMessage: string = '';

  isAIPromptVisible: boolean = false;
  aiPrompt: string = '';
  isAILoading: boolean = false;
  isLoadingPopupObjets: boolean = false;

  files: File[] = [];
  filePreviews: { file: File; previewUrl?: string; type: string }[] = [];
  attachmentPreviews: { name: string; url: string; previewUrl?: string; type: string }[] = [];
  fileError: string | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private apiUrl = 'http://localhost:8082/api/requetes';

  constructor(
    private router: Router,
    private requeteService: RequeteService,
    private objetService: ObjetService,
    private produitService: ProduitService,
    private aiService: AiService,
    private userInfoService: UserInfoService,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadUserInfo().then(() => {
      this.refreshData();
      this.loadRequetes();
    });
    const storedMode = localStorage.getItem('mode');
    if (storedMode === 'night') this.enableNightMode();
  }

  private loadUserInfo(): Promise<void> {
    return new Promise((resolve) => {
      const token = localStorage.getItem('token');
      if (!token) {
        this.showError('Session invalide. Veuillez vous reconnecter.');
        this.redirectToLogin();
        resolve();
        return;
      }

      try {
        const decoded = jwtDecode<{ id: number; role: string }>(token);
        this.userInfoService.getUserById(decoded.id).subscribe({
          next: (user: UserInfo) => {
            this.userInfo = {
              id: decoded.id,
              role: decoded.role,
              produit: user.produit,
              name: user.name || 'Client'
            };
            this.clientProduitId = this.userInfo.produit?.id || null;
            const productName = this.clientProduitId && this.produitMap[this.clientProduitId]
              ? this.produitMap[this.clientProduitId].nom
              : 'N/A';
            const ministryName = user.service?.ministere?.nomMinistere || 'N/A';
            this.welcomeMessage = `Bienvenue ${this.userInfo.name}, utilisateur du produit ${productName} / ministère ${ministryName}`;
            console.log('Loaded user info:', this.userInfo, 'Client Product ID:', this.clientProduitId);
            resolve();
          },
          error: (err: HttpErrorResponse) => {
            console.error('Error fetching user info:', err.message);
            this.showError('Erreur lors de la récupération des informations utilisateur.');
            this.redirectToLogin();
            resolve();
          }
        });
      } catch (e) {
        console.error('Error decoding token:', (e as Error).message);
        this.showError('Erreur lors de la lecture du token.');
        this.redirectToLogin();
        resolve();
      }
    });
  }

  private refreshData(): void {
    if (!this.clientProduitId) {
      console.warn('Client product ID is not available, skipping object filtering.');
      this.objets = [];
      this.isObjetsLoaded = true;
      return;
    }

    forkJoin({
      produits: this.produitService.getAllProduits(),
      objets: this.objetService.getAllObjets()
    }).subscribe({
      next: ({ produits, objets }) => {
        this.produits = produits.filter(p => p.id && p.nom);
        this.produitMap = produits.reduce((map, prod) => {
          if (prod.id) map[prod.id] = prod;
          return map;
        }, {} as { [key: number]: Produit });
        this.objets = objets.filter(o => o.id && o.name && o.produit?.id === this.clientProduitId);
        this.objetMap = this.objets.reduce((map, obj) => {
          if (obj.id) map[obj.id] = obj;
          return map;
        }, {} as { [key: number]: Objet });
        this.isProduitsLoaded = true;
        this.isObjetsLoaded = true;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error refreshing data:', err.message);
        this.showError('Impossible de rafraîchir les données.');
        this.isProduitsLoaded = true;
        this.isObjetsLoaded = true;
      }
    });
  }

  private loadRequetes(): void {
    if (!this.userInfo) {
      console.warn('User info not available, skipping requetes loading.');
      this.requetes = [];
      return;
    }

    let observable: Observable<Requete[]>;
    switch (this.userInfo.role) {
      case 'CLIENT':
        observable = this.requeteService.getRequetesByClientId(this.userInfo.id);
        break;
      case 'GUICHETIER':
        observable = this.requeteService.getRequetesByGuichetierId(this.userInfo.id);
        break;
      case 'TECHNICIEN':
        observable = this.requeteService.getRequetesByTechnicienId(this.userInfo.id);
        break;
      case 'ADMIN':
        observable = this.requeteService.getAllRequetes();
        break;
      default:
        this.redirectToLogin();
        return;
    }

    observable.subscribe({
      next: (data) => {
        console.log('All requetes from API:', data);
        this.requetes = data.map(req => ({
          ...req,
          client: { id: req.client.id, name: req.client.name || 'Inconnu' },
          piecesJointes: req.piecesJointes?.map(pj => ({
            ...pj,
            url: pj.url || `${this.apiUrl}/download/${pj.id}`,
            name: pj.name || this.getFileNameFromUrl(pj.url || `${this.apiUrl}/download/${pj.id}`)
          })) || []
        }));
        if (this.clientProduitId) {
          this.requetes = this.requetes.filter(req => req.objet.produit?.id === this.clientProduitId);
        }
        console.log('Loaded requetes for client ID:', this.userInfo?.id, this.requetes);
        const guichetierRequests = data.map(req =>
          this.userInfoService.getUserById(req.guichetier.id).subscribe({
            next: (user) => {
              req.guichetier.name = user.name || 'Inconnu';
            },
            error: (err) => {
              console.error(`Error fetching guichetier ${req.guichetier.id}:`, err.message);
              req.guichetier.name = 'Inconnu';
            }
          })
        );

        Promise.all(guichetierRequests).then(() => {
          this.filteredRequetes = [...this.requetes];
          this.filteredRequetes.sort((a, b) => b.id - a.id);
          this.updatePagination();
        });
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading requetes:', err.message);
        this.showError('Impossible de charger les requêtes.');
      }
    });
  }

  private getEmptyRequete(): Omit<Requete, 'id'> {
    return {
      type: '',
      objet: { id: 0 },
      description: '',
      etat: 'NOUVEAU',
      date: new Date(),
      dateTraitement: null,
      client: { id: 0, name: 'Inconnu' },
      guichetier: { id: 0 },
      technicien: null
    };
  }

  private redirectToLogin(): void {
    this.router.navigate(['/login']);
  }

  filterReclamations(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredRequetes = this.requetes.filter(req => {
      const objet = this.objetMap[req.objet.id] || { name: 'N/A' };
      return (
        Object.values(req).some(val =>
          (typeof val === 'string' || typeof val === 'number' || val instanceof Date) &&
          val.toString().toLowerCase().includes(term)
        ) ||
        (objet.name.toLowerCase().includes(term) ?? false) ||
        (req.guichetier.name?.toLowerCase().includes(term) ?? false) ||
        (req.client.name.toLowerCase().includes(term) ?? false)
      );
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  sort(column: keyof Requete | 'objetName'): void {
    if (this.sortDirection[column] === undefined) {
      this.sortDirection[column] = column === 'id' ? false : true;
    } else {
      this.sortDirection[column] = !this.sortDirection[column];
    }
    const dir = this.sortDirection[column] ? 1 : -1;

    this.filteredRequetes.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (column === 'id') {
        valA = Number(a.id) || 0;
        valB = Number(b.id) || 0;
        return dir * (valA - valB);
      } else if (column === 'objetName') {
        valA = (this.objetMap[a.objet.id] || { name: 'N/A' }).name;
        valB = (this.objetMap[b.objet.id] || { name: 'N/A' }).name;
        return dir * valA.localeCompare(valB, 'fr', { numeric: true });
      } else if (column === 'date') {
        valA = a.date ? new Date(a.date).getTime() : 0;
        valB = b.date ? new Date(b.date).getTime() : 0;
        return dir * (valA - valB);
      } else if (column === 'dateTraitement') {
        valA = a.dateTraitement ? new Date(a.dateTraitement).getTime() : 0;
        valB = b.dateTraitement ? new Date(b.dateTraitement).getTime() : 0;
        return dir * (valA - valB);
      } else if (column === 'client') {
        valA = a.client.name ?? 'N/A';
        valB = b.client.name ?? 'N/A';
        return dir * valA.localeCompare(valB, 'fr', { numeric: true });
      } else if (column === 'type' || column === 'etat') {
        valA = this.formatDisplayText(a[column as keyof Requete] as string) ?? 'N/A';
        valB = this.formatDisplayText(b[column as keyof Requete] as string) ?? 'N/A';
        return dir * valA.localeCompare(valB, 'fr', { numeric: true });
      } else {
        valA = a[column as keyof Requete] ?? '';
        valB = b[column as keyof Requete] ?? '';
        return dir * valA.toString().localeCompare(valB.toString(), 'fr', { numeric: true });
      }
    });

    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredRequetes.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedRequetes = this.filteredRequetes.slice(start, start + this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  toggleMode(): void {
    this.isNightMode = !this.isNightMode;
    this.isNightMode ? this.enableNightMode() : this.disableNightMode();
  }

  enableNightMode(): void {
    document.body.classList.add('night-mode');
    localStorage.setItem('mode', 'night');
    this.isNightMode = true;
  }

  disableNightMode(): void {
    document.body.classList.remove('night-mode');
    localStorage.setItem('mode', 'day');
    this.isNightMode = false;
  }

  openPopup(requete: Requete): void {
    this.selectedRequete = requete;
    this.generateAttachmentPreviews();
    this.isPopupOpen = true;
  }

  closePopup(): void {
    this.isPopupOpen = false;
    this.selectedRequete = null;
    this.attachmentPreviews = [];
  }

  openCreateRequetePopup(): void {
    if (this.userInfo?.role !== 'CLIENT') {
      this.showError('Seuls les clients peuvent créer des requêtes.');
      return;
    }
    if (!this.isObjetsLoaded || !this.isProduitsLoaded) {
      this.showError('Les objets ou produits sont en cours de chargement. Veuillez réessayer dans un instant.');
      return;
    }
    this.newRequete = this.getEmptyRequete();
    this.newRequete.type = '';
    this.newRequete.objet.id = 0;
    this.popupObjets = [];
    this.isAIPromptVisible = false;
    this.aiPrompt = '';
    this.files = [];
    this.filePreviews = [];
    this.fileError = null;
    this.isCreatePopupOpen = true;
  }

  closeCreatePopup(): void {
    this.isCreatePopupOpen = false;
    this.isAIPromptVisible = false;
    this.aiPrompt = '';
    this.popupObjets = [];
    this.newRequete = this.getEmptyRequete();
    this.files = [];
    this.filePreviews = [];
    this.fileError = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  loadPopupObjets(): void {
    if (!this.newRequete.type || !this.clientProduitId) {
      this.popupObjets = [];
      this.newRequete.objet.id = 0;
      console.log('loadPopupObjets: No type or clientProduitId, resetting objet.id to 0');
      return;
    }

    let objetType: ObjetType;
    switch (this.newRequete.type) {
      case 'RECLAMATION':
        objetType = ObjetType.RECLAMATION;
        break;
      case 'DEMANDE_DE_TRAVAUX':
        objetType = ObjetType.DEMANDE_TRAVAUX;
        break;
      default:
        this.popupObjets = [];
        this.newRequete.objet.id = 0;
        console.log('loadPopupObjets: Invalid type, resetting objet.id to 0');
        return;
    }

    this.isLoadingPopupObjets = true;
    console.log('loadPopupObjets: Fetching objects for type', this.newRequete.type, 'and productId', this.clientProduitId);
    this.objetService.getObjetsByProduitIdAndType(this.clientProduitId, objetType).subscribe({
      next: (objets) => {
        this.popupObjets = objets;
        console.log('loadPopupObjets: Fetched objets', objets);
        if (objets.length > 0) {
          this.newRequete.objet.id = 0;
        } else {
          this.newRequete.objet.id = 0;
          console.log('loadPopupObjets: No objects available, resetting objet.id to 0');
        }
        this.isLoadingPopupObjets = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('loadPopupObjets: Error fetching objects:', err.message);
        this.showError('Erreur lors du chargement des objets.');
        this.popupObjets = [];
        this.newRequete.objet.id = 0;
        this.isLoadingPopupObjets = false;
      }
    });
  }

  toggleAIPrompt(): void {
    this.isAIPromptVisible = !this.isAIPromptVisible;
    this.aiPrompt = '';
  }

  generateAIDescription(): void {
    if (!this.aiPrompt.trim()) {
      this.showError('Veuillez entrer une description pour l’IA.');
      return;
    }
    this.isAILoading = true;
    this.aiService.generateDescription(this.aiPrompt).subscribe({
      next: (description) => {
        this.newRequete.description = description;
        this.isAILoading = false;
        this.isAIPromptVisible = false;
        this.aiPrompt = '';
      },
      error: (err: HttpErrorResponse) => {
        this.isAILoading = false;
        this.showError(err.message);
      }
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.files = Array.from(input.files);
      this.validateFiles();
      this.generateFilePreviews();
    }
  }

  private validateFiles(): void {
    const maxSize = 10 * 1024 * 1024; // 10 MB
    this.fileError = null;

    for (const file of this.files) {
      if (file.size > maxSize) {
        this.fileError = `Le fichier ${file.name} dépasse la limite de 10 Mo.`;
        return;
      }
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        this.fileError = `Type de fichier non supporté pour ${file.name}. Types autorisés : PDF, JPEG, PNG, DOC, DOCX.`;
        return;
      }
    }
  }

  private generateFilePreviews(): void {
    this.filePreviews = [];
    const imageTypes = ['image/jpeg', 'image/png'];

    this.files.forEach(file => {
      const previewObj = { file, previewUrl: '', type: file.type };

      if (imageTypes.includes(file.type)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewObj.previewUrl = e.target?.result as string;
          this.filePreviews = [...this.filePreviews, previewObj];
        };
        reader.readAsDataURL(file);
      } else {
        this.filePreviews = [...this.filePreviews, previewObj];
      }
    });
  }

  private generateAttachmentPreviews(): void {
    if (!this.selectedRequete?.piecesJointes) {
      this.attachmentPreviews = [];
      return;
    }

    this.attachmentPreviews = [];
    const imageTypes = ['image/jpeg', 'image/png'];

    this.selectedRequete.piecesJointes.forEach(attachment => {
      const type = this.getFileType(attachment.name);
      const previewObj = { name: attachment.name, url: attachment.url, previewUrl: '', type };

      if (imageTypes.includes(type)) {
        this.http.get(attachment.url, { responseType: 'blob' }).subscribe({
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

  private getFileType(name: string): string {
    const extension = name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'pdf':
        return 'application/pdf';
      case 'doc':
      case 'docx':
        return 'application/msword';
      default:
        return 'application/octet-stream';
    }
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
    this.filePreviews.splice(index, 1);
    this.validateFiles();
    if (this.files.length === 0 && this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  isImageFile(name: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png'];
    const extension = name.split('.').pop()?.toLowerCase();
    return extension ? imageExtensions.includes(extension) : false;
  }

  getFileIcon(name: string): string {
    const extension = name.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'fas fa-file-pdf';
    if (extension === 'doc' || extension === 'docx') return 'fas fa-file-word';
    return 'fas fa-file-alt';
  }

  private getFileNameFromUrl(url: string): string {
    const urlParts = url.split('/');
    const filePart = urlParts[urlParts.length - 1];
    return filePart.includes('?') ? filePart.split('?')[0] : filePart || 'document';
  }

  previewAttachment(attachment: { name: string; url: string }): void {
    if (!attachment.url) {
      this.showError('URL de la pièce jointe non disponible.');
      return;
    }

    this.http.get(attachment.url, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const previewWindow = window.open(url, '_blank');
        if (previewWindow) {
          previewWindow.document.title = attachment.name || this.getFileNameFromUrl(attachment.url);
        } else {
          this.showError('Impossible d’ouvrir la prévisualisation. Vérifiez les paramètres de votre navigateur.');
        }
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors de la prévisualisation de la pièce jointe:', err.message);
        this.showError('Impossible de prévisualiser la pièce jointe.');
      }
    });
  }

  downloadAttachment(attachment: { name: string; url: string }): void {
    if (!attachment.url) {
      this.showError('URL de la pièce jointe non disponible.');
      return;
    }

    this.http.get(attachment.url, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.name || this.getFileNameFromUrl(attachment.url);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors du téléchargement de la pièce jointe:', err.message);
        this.showError('Impossible de télécharger la pièce jointe.');
      }
    });
  }

  submitNewRequete(): void {
    if (!this.userInfo) {
      this.redirectToLogin();
      return;
    }

    if (!this.newRequete.description.trim()) {
      this.showError('La description est requise.');
      return;
    }

    if (!this.newRequete.type) {
      this.showError('Veuillez sélectionner un type de requête.');
      return;
    }

    console.log('submitNewRequete: newRequete.objet.id', this.newRequete.objet.id, 'popupObjets', this.popupObjets);
    if (this.newRequete.objet.id === 0 || !this.popupObjets.find(obj => obj.id === this.newRequete.objet.id)) {
      this.showError('Veuillez sélectionner un objet valide.');
      return;
    }

    if (this.fileError) {
      this.showError(this.fileError);
      return;
    }

    this.requeteService.getGuichetierWithLeastRequests().subscribe({
      next: (guichetier) => {
        const completeRequete: Omit<Requete, 'id'> = {
          type: this.newRequete.type,
          objet: { id: this.newRequete.objet.id },
          description: this.newRequete.description,
          etat: 'NOUVEAU',
          date: new Date(),
          dateTraitement: null,
          client: { id: this.userInfo!.id, name: this.userInfo!.name || 'Client' },
          guichetier: { id: guichetier.id },
          technicien: null
        };

        this.requeteService.createRequete(completeRequete, this.files).subscribe({
          next: () => {
            this.refreshData();
            this.loadRequetes();
            this.closeCreatePopup();
            this.showSuccess('Requête créée avec succès !');
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error creating requete:', error.message);
            this.showError(`Erreur lors de la création de la requête: ${error.message}`);
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error fetching guichetier:', error.message);
        this.showError('Impossible de récupérer le guichetier.');
      }
    });
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

  getBadgeClass(etat: string | undefined): string {
    switch (etat?.toUpperCase()) {
      case 'NOUVEAU': return 'badge-primary';
      case 'EN_COURS_DE_TRAITEMENT': return 'badge-warning';
      case 'TRAITEE': return 'badge-success';
      case 'REFUSEE': return 'badge-danger';
      case 'BROUILLON': return 'badge-secondary';
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
}