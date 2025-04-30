import { Component, OnInit } from '@angular/core';
import { ProduitService } from 'src/app/services/produit.service';
import { Produit } from 'src/app/models/produit.model';
import { Objet } from 'src/app/models/objet.model';
@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductsComponent implements OnInit {

  products: Produit[] = [];
  paginatedProducts: Produit[] = [];
  productForm: Produit = { id: 0, nom: '', description: '', topologie: '', prix: 0, objets: [] };
  editingProduct: Produit | null = null;
  isModalOpen: boolean = false;
  isViewModalOpen: boolean = false;
  selectedProduct: Produit | null = null;
  searchTerm: string = '';
  itemsPerPage: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  isNightMode: boolean = false;
  allObjets: Objet[] = [];
  selectedObjets: number[] = [];

  constructor(private productService: ProduitService) {}

  ngOnInit() {
    this.getProducts();
    this.getAllObjets();
  }

  getProducts() {
    this.productService.getAllProduits().subscribe({
      next: (data) => {
        this.products = data;
        this.paginateProducts();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits:', error);
      }
    });
  }

  getAllObjets() {
    this.productService.getAllObjets().subscribe({
      next: (data) => {
        console.log('Objets reçus:', data);
        this.allObjets = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des objets:', error);
      }
    });
  }

  addProduct() {
    // Valider les champs obligatoires
    if (!this.productForm.nom || !this.productForm.description || !this.productForm.topologie || this.productForm.prix <= 0) {
      console.error('Formulaire incomplet:', this.productForm);
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    // Construire la liste des objets avec les noms corrects et produit
    const objets: Objet[] = this.selectedObjets.map(id => {
      const objet = this.allObjets.find(o => o.id === id);
      if (!objet) {
        console.error('Objet non trouvé pour ID:', id);
        return { id, name: '', produit: { id: 0 } };
      }
      return { id, name: objet.name, produit: { id: 0 } }; // produit inclus pour TypeScript
    });

    // Créer un objet Produit avec id par défaut
    const produitToSend: Produit = {
      id: 0, // id inclus pour TypeScript, backend devrait l'ignorer
      nom: this.productForm.nom,
      description: this.productForm.description,
      topologie: this.productForm.topologie,
      prix: this.productForm.prix,
      objets: objets
    };

    console.log('Envoi du produit:', produitToSend);
    this.productService.addProduit(produitToSend).subscribe({
      next: (data) => {
        console.log('Produit ajouté:', data);
        this.getProducts();
        this.closeModal();
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout du produit:', error);
        console.error('Statut:', error.status);
        console.error('Message:', error.message);
        console.error('Détails:', error.error);
        alert('Erreur lors de l\'ajout du produit: ' + (error.error || error.message));
      }
    });
  }

  updateProduct() {
    if (this.editingProduct) {
      // Valider les champs obligatoires
      if (!this.productForm.nom || !this.productForm.description || !this.productForm.topologie || this.productForm.prix <= 0) {
        console.error('Formulaire incomplet:', this.productForm);
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
      }

      // Construire la liste des objets avec les noms corrects et produit
      this.productForm.objets = this.selectedObjets.map(id => {
        const objet = this.allObjets.find(o => o.id === id);
        if (!objet) {
          console.error('Objet non trouvé pour ID:', id);
          return { id, name: '', produit: { id: this.productForm.id } };
        }
        return { id, name: objet.name, produit: { id: this.productForm.id } };
      });

      console.log('Envoi du produit pour mise à jour:', this.productForm);
      this.productService.updateProduit(this.editingProduct.id, this.productForm).subscribe({
        next: (data) => {
          console.log('Produit mis à jour:', data);
          this.getProducts();
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du produit:', error);
          console.error('Statut:', error.status);
          console.error('Message:', error.message);
          console.error('Détails:', error.error);
          alert('Erreur lors de la mise à jour du produit: ' + (error.error || error.message));
        }
      });
    }
  }

  deleteProduct(id: number) {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      this.productService.deleteProduit(id).subscribe({
        next: () => {
          this.getProducts();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du produit:', error);
        }
      });
    }
  }

  openModal(product: Produit | null = null): void {
    this.isModalOpen = true;
    if (product) {
      this.productForm = { ...product };
      this.editingProduct = product;
      this.selectedObjets = product.objets.map(objet => objet.id);
    } else {
      this.productForm = { id: 0, nom: '', description: '', topologie: '', prix: 0, objets: [] };
      this.editingProduct = null;
      this.selectedObjets = [];
    }
  }

  openViewModal(product: Produit): void {
    this.isViewModalOpen = true;
    this.selectedProduct = product;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.productForm = { id: 0, nom: '', description: '', topologie: '', prix: 0, objets: [] };
    this.editingProduct = null;
    this.selectedObjets = [];
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedProduct = null;
  }

  filterProducts() {
    const term = this.searchTerm.toLowerCase();
    this.paginatedProducts = this.products.filter(product =>
      product.nom.toLowerCase().includes(term) ||
      (product.description || '').toLowerCase().includes(term) ||
      (product.topologie || '').toLowerCase().includes(term)
    );
    this.paginateProducts();
  }

  paginateProducts() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.products.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.products.length / this.itemsPerPage);
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateProducts();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateProducts();
    }
  }

  onItemsPerPageChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.itemsPerPage = Number(selectElement.value);
    this.currentPage = 1;
    this.paginateProducts();
  }

  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }

  toggleObjetSelection(objetId: number) {
    if (this.selectedObjets.includes(objetId)) {
      this.selectedObjets = this.selectedObjets.filter(id => id !== objetId);
    } else {
      this.selectedObjets.push(objetId);
    }
  }
}