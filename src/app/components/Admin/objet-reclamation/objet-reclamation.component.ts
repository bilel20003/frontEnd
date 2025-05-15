import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ObjetType } from 'src/app/services/objet.service';
import { Produit } from 'src/app/models/produit.model';
import { ObjetService } from 'src/app/services/objet.service';
import { ProduitService } from 'src/app/services/produit.service';
import { Objet } from 'src/app/models/objet.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-objet-reclamation',
  templateUrl: './objet-reclamation.component.html',
  styleUrls: ['./objet-reclamation.component.css']
})
export class ObjetReclamationComponent implements OnInit {
  objets: Objet[] = [];
  filteredObjets: Objet[] = [];
  paginatedObjects: Objet[] = [];
  availableProducts: Produit[] = [];
  searchTerm: string = '';
  isLoadingProducts = true;
  itemsPerPage = 5;
  currentPage = 1;
  totalPages = 1;
  showModal = false;
  showViewModal = false;
  editingObject: boolean = false;
  editingObjectId: number | null = null;
  newObject: Omit<Objet, 'id'> = {
    name: '',
    produit: { id: 0 },
    type: ObjetType.RECLAMATION // Default to RECLAMATION since this component manages reclamation objects
  };
  selectedObject?: Objet;
  isNightMode = false;
  sortDirection: { [key: string]: boolean } = { id: false }; // Default to descending for id

  constructor(
    private objetService: ObjetService,
    private produitService: ProduitService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadObjects();
    this.loadProducts();
  }

  loadObjects(): void {
    this.objetService.getAllObjets().subscribe({
      next: (data) => {
        this.objets = data; // Backend excludes archived objects
        this.filteredObjets = [...this.objets];
        this.filteredObjets.sort((a, b) => b.id - a.id);
        console.log('Sorted objets (descending by id):', this.filteredObjets);
        this.updatePagination();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des objets:', err);
        this.showError('Erreur lors du chargement des objets. Veuillez réessayer.');
      }
    });
  }

  loadProducts(): void {
    this.isLoadingProducts = true;
    this.produitService.getAllProduits().subscribe({
      next: (data) => {
        this.availableProducts = data;
        this.isLoadingProducts = false;
        console.log('Produits chargés:', JSON.stringify(this.availableProducts, null, 2));
        if (this.availableProducts.length === 0) {
          console.warn('Aucun produit disponible.');
          this.showError('Aucun produit disponible. Veuillez vérifier l\'endpoint des produits.');
        }
      },
      error: (err) => {
        this.isLoadingProducts = false;
        console.error('Erreur lors du chargement des produits:', err);
        this.showError('Erreur lors du chargement des produits: ' + err.message);
      }
    });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredObjets.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    this.paginate();
  }

  paginate(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedObjects = this.filteredObjets.slice(start, end);
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginate();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginate();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.paginate();
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

  filterObjects(): void {
    this.filteredObjets = this.objets.filter(objet =>
      objet.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  sort(column: keyof Objet): void {
    if (this.sortDirection[column] === undefined) {
      this.sortDirection[column] = column === 'id' ? false : true;
    } else {
      this.sortDirection[column] = !this.sortDirection[column];
    }
    const dir = this.sortDirection[column] ? 1 : -1;
    this.filteredObjets.sort((a, b) => {
      let valA: any = a[column] ?? '';
      let valB: any = b[column] ?? '';
      if (column === 'id') {
        valA = Number(a.id) || 0;
        valB = Number(b.id) || 0;
        return dir * (valA - valB);
      }
      if (column === 'produit') {
        valA = this.getProduitName(a.produit.id) || 'N/A';
        valB = this.getProduitName(b.produit.id) || 'N/A';
      }
      const strA = valA.toString();
      const strB = valB.toString();
      return dir * strA.localeCompare(strB, 'fr', { numeric: true });
    });
    console.log(`Sorted by ${column}, direction: ${this.sortDirection[column] ? 'ascending' : 'descending'}`, this.filteredObjets);
    this.updatePagination();
  }

  toggleMode(): void {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }

  addObject(): void {
    if (this.isLoadingProducts) {
      this.showError('Les produits sont encore en cours de chargement. Veuillez attendre.');
      return;
    }
    if (this.availableProducts.length === 0) {
      this.showError('Aucun produit disponible. Veuillez vérifier les produits.');
      return;
    }
    this.editingObject = false;
    this.editingObjectId = null;
    const defaultProduitId = this.availableProducts[0].id;
    this.newObject = {
      name: '',
      produit: { id: defaultProduitId },
      type: ObjetType.RECLAMATION
    };
    this.showModal = true;
  }

  editObject(objet: Objet): void {
    this.editingObject = true;
    this.editingObjectId = objet.id;
    this.newObject = {
      name: objet.name,
      produit: { id: objet.produit.id },
      type: objet.type as ObjetType
    };
    this.showModal = true;
  }

  saveObject(): void {
    if (this.editingObject) {
      if (!this.editingObjectId) {
        this.showError('Erreur: ID de l\'objet à modifier manquant.');
        return;
      }
      const objetToUpdate: Objet = {
        id: this.editingObjectId,
        name: this.newObject.name,
        produit: this.newObject.produit,
        type: this.newObject.type
      };
      this.objetService.updateObjet(objetToUpdate.id, objetToUpdate).subscribe({
        next: () => {
          this.loadObjects();
          this.closeModal();
          this.showSuccess('Objet mis à jour avec succès !');
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour:', err);
          this.showError('Erreur lors de la mise à jour de l\'objet: ' + err.message);
        }
      });
    } else {
      if (!this.newObject.name || !this.newObject.produit.id || !this.newObject.type) {
        this.showError('Veuillez entrer un nom, sélectionner un produit valide et spécifier un type.');
        return;
      }
      const selectedProductId = Number(this.newObject.produit.id);
      const isValidProduit = this.availableProducts.some(p => p.id === selectedProductId);
      if (!isValidProduit) {
        this.showError('Le produit sélectionné est invalide ou n\'existe pas.');
        return;
      }
      this.objetService.addObjet(this.newObject).subscribe({
        next: (created) => {
          this.objets = [created, ...this.objets];
          this.filteredObjets = this.objets.filter(objet =>
            objet.name.toLowerCase().includes(this.searchTerm.toLowerCase())
          );
          this.filteredObjets.sort((a, b) => b.id - a.id);
          console.log('New objet added, sorted filteredObjets:', this.filteredObjets);
          this.currentPage = 1;
          this.updatePagination();
          this.closeModal();
          this.showSuccess('Objet ajouté avec succès !');
        },
        error: (err) => {
          console.error('Erreur lors de l\'ajout:', err);
          this.showError('Erreur lors de l\'ajout de l\'objet: ' + err.message);
        }
      });
    }
  }

  archiveObject(id: number): void {
    const snackBarRef = this.snackBar.open(
      'Voulez-vous vraiment archiver cet objet ? Il ne sera plus visible dans la liste active.',
      'Confirmer',
      {
        duration: 10000,
        panelClass: ['custom-error-snackbar'],
        verticalPosition: 'top',
        horizontalPosition: 'center'
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.objetService.archiveObjet(id).subscribe({
        next: () => {
          console.log('Objet archivé avec succès');
          this.loadObjects();
          this.showSuccess('Objet archivé avec succès !');
        },
        error: (err) => {
          console.error('Erreur lors de l\'archivage:', err);
          this.showError('Erreur lors de l\'archivage de l\'objet: ' + err.message);
        }
      });
    });
  }

  consulterObject(objet: Objet): void {
    this.selectedObject = objet;
    this.showViewModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingObjectId = null;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedObject = undefined;
  }

  formatDisplayText(text: string | undefined): string {
    if (!text) return 'Non spécifié';

    const displayMap: { [key: string]: string } = {
      'RENDEZVOUS': 'Rendez-vous',
      'RECLAMATION': 'Réclamation',
      'DEMANDE_TRAVAUX': 'Demande de travaux'
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

  getProduitName(produitId: number): string {
    const produit = this.availableProducts.find(p => p.id === produitId);
    return produit ? produit.nom : 'N/A';
  }

  getSelectedProduitName(): string {
    if (!this.selectedObject || !this.selectedObject.produit || !this.selectedObject.produit.id) {
      return 'Non spécifié';
    }
    return this.getProduitName(this.selectedObject.produit.id);
  }

  private showSuccess(message: string): void {
    console.log('Showing success snackbar:', message);
    this.snackBar.open(message, 'Fermer', {
      duration: 10000,
      panelClass: ['custom-success-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
    this.cdr.detectChanges();
  }

  private showError(message: string): void {
    console.log('Showing error snackbar:', message);
    this.snackBar.open(message, 'Fermer', {
      duration: 10000,
      panelClass: ['custom-error-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
    this.cdr.detectChanges();
  }
}