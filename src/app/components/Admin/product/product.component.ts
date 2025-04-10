import { Component, OnInit } from '@angular/core';
import { ProductService } from 'src/app/services/product.service';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  topologie: string; // ✅ Nouveau champ ajouté
}

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductsComponent implements OnInit {

  products: Product[] = [];
  newProduct: Product = { id: 0, name: '', description: '', price: 0, stock: 0, topologie: '' };
  editingProduct: Product | null = null;
  searchTerm: string = '';
  itemsPerPage: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  paginatedProducts: Product[] = [];
  isNightMode: boolean = false;
  isModalOpen: boolean = false; // Contrôle l'ouverture de la modale
  productForm: Product = { id: 0, name: '', description: '', price: 0, stock: 0, topologie: '' }; // Contient les données du produit

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.getProducts();
  }

  getProducts() {
    this.products = this.productService.getProducts();
    this.paginateProducts();
  }

  paginateProducts() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.products.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.products.length / this.itemsPerPage);
  }

  // Ouvre la modale avec un produit à modifier ou un formulaire vide pour un nouveau produit
  openModal(product: Product | null = null): void {
    this.isModalOpen = true;
    if (product) {
      this.editingProduct = { ...product };
      this.productForm = { ...product }; // Pré-remplir le formulaire avec les données du produit
    } else {
      this.editingProduct = null;
      this.productForm = { id: 0, name: '', description: '', price: 0, stock: 0, topologie: '' }; // Formulaire vide
    }
  }

  // Ferme la modale
  closeModal(): void {
    this.isModalOpen = false;
    this.productForm = { id: 0, name: '', description: '', price: 0, stock: 0, topologie: '' };
  }

  addProduct() {
    if (this.productForm.name && this.productForm.description && this.productForm.price && this.productForm.stock && this.productForm.topologie) {
      this.productService.addProduct(this.productForm);
      this.getProducts();
      this.closeModal();
    } else {
      alert('Veuillez remplir tous les champs');
    }
  }

  updateProduct() {
    if (this.productForm && this.productForm.name && this.productForm.description && this.productForm.price && this.productForm.stock && this.productForm.topologie) {
      this.productService.updateProduct(this.productForm.id, this.productForm);
      this.getProducts();
      this.closeModal();
    } else {
      alert('Veuillez remplir tous les champs');
    }
  }

  deleteProduct(productId: number) {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      this.productService.deleteProduct(productId);
      this.getProducts();
    }
  }

  filterProducts() {
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      this.products = this.productService.getProducts().filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.topologie.toLowerCase().includes(term)
      );
    } else {
      this.getProducts();
    }
    this.paginateProducts();
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

  // Actions de gestion des produits
  ajouterProduit() {
    this.openModal(); // Ouvre une modale vide pour ajouter un produit
  }

  modifierProduit(product: Product) {
    this.openModal(product); // Ouvre la modale avec les informations du produit à modifier
  }

  supprimerProduit(product: Product) {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      this.deleteProduct(product.id);
    }
  }

  cancelEdit() {
    this.closeModal();
  }
}
