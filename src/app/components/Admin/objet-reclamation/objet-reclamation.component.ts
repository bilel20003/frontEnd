import { Component, OnInit } from '@angular/core';
import { Objet } from 'src/app/models/objet.model';
import { Produit } from 'src/app/models/produit.model';
import { ObjetService } from 'src/app/services/objet.service';
import { ProduitService } from 'src/app/services/produit.service';

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
    produit: { id: 0 }
  };
  selectedObject?: Objet;
  isNightMode = false;
  sortDirection: { [key: string]: boolean } = { id: false }; // Default to descending for id

  constructor(
    private objetService: ObjetService,
    private produitService: ProduitService
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
        // Sort by id in descending order
        this.filteredObjets.sort((a, b) => b.id - a.id);
        console.log('Sorted objets (descending by id):', this.filteredObjets);
        this.updatePagination();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des objets:', err);
        alert('Erreur lors du chargement des objets. Veuillez réessayer.');
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
          alert('Aucun produit disponible. Veuillez vérifier l\'endpoint des produits.');
        }
      },
      error: (err) => {
        this.isLoadingProducts = false;
        console.error('Erreur lors du chargement des produits:', err);
        alert('Erreur lors du chargement des produits: ' + err.message);
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
      const strA = valA.toString();
      const strB = valB.toString();
      return dir * strA.localeCompare(strB, 'fr', { numeric: true });
    });
    console.log(`Sorted by ${column}, direction: ${this.sortDirection[column] ? 'ascending' : 'descending'}`, this.filteredObjets);
    this.updatePagination();
  }

  toggleMode(): void {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('dark-mode', this.isNightMode);
  }

  addObject(): void {
    if (this.isLoadingProducts) {
      alert('Les produits sont encore en cours de chargement. Veuillez attendre.');
      return;
    }
    if (this.availableProducts.length === 0) {
      alert('Aucun produit disponible. Veuillez vérifier les produits.');
      return;
    }
    this.editingObject = false;
    this.editingObjectId = null;
    const defaultProduitId = this.availableProducts[0].id;
    this.newObject = {
      name: '',
      produit: { id: defaultProduitId }
    };
    this.showModal = true;
  }

  editObject(objet: Objet): void {
    this.editingObject = true;
    this.editingObjectId = objet.id;
    this.newObject = {
      name: objet.name,
      produit: { id: objet.produit.id }
    };
    this.showModal = true;
  }

  saveObject(): void {
    if (this.editingObject) {
      if (!this.editingObjectId) {
        alert('Erreur: ID de l\'objet à modifier manquant.');
        return;
      }
      const objetToUpdate: Objet = {
        id: this.editingObjectId,
        name: this.newObject.name,
        produit: this.newObject.produit
      };
      this.objetService.updateObjet(objetToUpdate.id, objetToUpdate).subscribe({
        next: () => {
          this.loadObjects();
          this.closeModal();
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour:', err);
          alert('Erreur lors de la mise à jour de l\'objet: ' + err.message);
        }
      });
    } else {
      if (!this.newObject.name || !this.newObject.produit.id) {
        alert('Veuillez entrer un nom et sélectionner un produit valide.');
        return;
      }
      const selectedProductId = Number(this.newObject.produit.id);
      const isValidProduit = this.availableProducts.some(p => p.id === selectedProductId);
      if (!isValidProduit) {
        alert('Le produit sélectionné est invalide ou n\'existe pas.');
        return;
      }
      this.objetService.addObjet(this.newObject).subscribe({
        next: (created) => {
          // Update objets list
          this.objets = [created, ...this.objets]; // Add to start for newest first
          // Update filteredObjets, respecting search term
          this.filteredObjets = this.objets.filter(objet =>
            objet.name.toLowerCase().includes(this.searchTerm.toLowerCase())
          );
          // Reapply sorting (descending by id)
          this.filteredObjets.sort((a, b) => b.id - a.id);
          console.log('New objet added, sorted filteredObjets:', this.filteredObjets);
          // Go to first page to show newest object
          this.currentPage = 1;
          this.updatePagination();
          this.closeModal();
        },
        error: (err) => {
          console.error('Erreur lors de l\'ajout:', err);
          alert('Erreur lors de l\'ajout de l\'objet: ' + err.message);
        }
      });
    }
  }

  archiveObject(id: number): void {
    if (confirm('Voulez-vous vraiment archiver cet objet ? Il ne sera plus visible dans la liste active.')) {
      this.objetService.archiveObjet(id).subscribe({
        next: () => {
          console.log('Objet archivé avec succès');
          this.loadObjects();
        },
        error: (err) => {
          console.error('Erreur lors de l\'archivage:', err);
          alert('Erreur lors de l\'archivage de l\'objet: ' + err.message);
        }
      });
    }
  }

  viewObject(objet: Objet): void {
    this.selectedObject = objet;
    this.showViewModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingObjectId = null;
  }

  closeViewModal(): void {
    this.showViewModal = false;
  }
}