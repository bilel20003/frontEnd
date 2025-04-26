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

  constructor(
    private objetService: ObjetService,
    private produitService: ProduitService
  ) {
    console.log('Constructor: showModal initial:', this.showModal);
  }

  ngOnInit(): void {
    this.loadObjects();
    this.loadProducts();
  }

  loadObjects(): void {
    this.objetService.getAllObjets().subscribe({
      next: (data) => {
        this.objets = data;
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
          console.warn('Aucun produit disponible. Vérifiez l\'endpoint des produits.');
          alert('Aucun produit disponible. Veuillez vérifier l\'endpoint des produits.');
        } else {
          console.log('IDs des produits disponibles:', this.availableProducts.map(p => p.id));
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
    this.totalPages = Math.ceil(this.objets.length / this.itemsPerPage);
    this.paginate();
  }

  paginate(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedObjects = this.objets.slice(start, end);
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
    const filtered = this.objets.filter(objet =>
      objet.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.paginatedObjects = filtered.slice(0, this.itemsPerPage);
  }

  toggleMode(): void {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('dark-mode', this.isNightMode);
  }

  addObject(): void {
    console.log('addObject appelé, isLoadingProducts:', this.isLoadingProducts, 'availableProducts:', JSON.stringify(this.availableProducts, null, 2));
    this.editingObject = false;
    this.editingObjectId = null;
    if (this.isLoadingProducts) {
      console.warn('Les produits sont encore en cours de chargement.');
      alert('Les produits sont encore en cours de chargement. Veuillez attendre.');
      return;
    }
    if (this.availableProducts.length === 0) {
      console.warn('Aucun produit disponible.');
      alert('Aucun produit disponible. Veuillez vérifier les produits.');
      return;
    }
    const defaultProduitId = this.availableProducts[0].id;
    this.newObject = {
      name: '',
      produit: { id: defaultProduitId }
    };
    this.showModal = true;
    console.log('showModal défini à true, newObject:', JSON.stringify(this.newObject, null, 2));
  }

  editObject(objet: Objet): void {
    console.log('editObject appelé pour objet:', JSON.stringify(objet, null, 2));
    this.editingObject = true;
    this.editingObjectId = objet.id;
    this.newObject = {
      name: objet.name,
      produit: { id: objet.produit.id }
    };
    this.showModal = true;
    console.log('showModal défini à true, newObject:', JSON.stringify(this.newObject, null, 2));
  }

  saveObject(): void {
    console.log('saveObject appelé, editingObject:', this.editingObject);
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
      console.log('Payload à envoyer:', JSON.stringify(this.newObject, null, 2));
      if (!this.newObject.name || !this.newObject.produit.id) {
        alert('Veuillez entrer un nom et sélectionner un produit valide.');
        return;
      }
      // Convertir l'ID en nombre pour la comparaison
      const selectedProductId = Number(this.newObject.produit.id);
      console.log('availableProducts:', JSON.stringify(this.availableProducts, null, 2));
      console.log('selectedProductId:', selectedProductId);
      const isValidProduit = this.availableProducts.some(p => p.id === selectedProductId);
      if (!isValidProduit) {
        console.error('Produit invalide. ID sélectionné:', selectedProductId, 'availableProducts:', this.availableProducts);
        alert('Le produit sélectionné est invalide ou n\'existe pas.');
        return;
      }
      this.objetService.addObjet(this.newObject).subscribe({
        next: (created) => {
          this.objets.push(created);
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

  deleteObject(id: number): void {
    this.objetService.deleteObjet(id).subscribe({
      next: () => {
        this.objets = this.objets.filter(o => o.id !== id);
        this.updatePagination();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        alert('Erreur lors de la suppression de l\'objet: ' + err.message);
      }
    });
  }

  viewObject(objet: Objet): void {
    this.selectedObject = objet;
    this.showViewModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingObjectId = null;
    console.log('closeModal appelé, showModal:', this.showModal);
  }

  closeViewModal(): void {
    this.showViewModal = false;
  }
}