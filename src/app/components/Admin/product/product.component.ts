import { Component, OnInit } from '@angular/core';
import { ProductService } from 'C:/Users/pc_asus/Documents/frontEnd/src/app/services/product.service';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductsComponent implements OnInit {

  products: Product[] = [];  // Liste des produits
  newProduct: Product = { id: 0, name: '', description: '', price: 0, stock: 0 };  // Produit à ajouter
  editingProduct: Product | null = null;  // Produit en cours d'édition
  searchTerm: string = '';  // Variable de recherche pour filtrer les produits
  itemsPerPage: number = 5;  // Nombre de produits par page
  currentPage: number = 1;  // Page actuelle de la pagination
  totalPages: number = 1;  // Total de pages pour la pagination
  paginatedProducts: Product[] = [];  // Produits de la page actuelle
  isNightMode: boolean = false;  // Mode nuit activé ou non

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.getProducts();
  }

  getProducts() {
    this.products = this.productService.getProducts();  // Obtient la liste des produits
    this.paginateProducts();
  }

  paginateProducts() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.products.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.products.length / this.itemsPerPage);
  }

  addProduct() {
    if (this.newProduct.name && this.newProduct.description && this.newProduct.price && this.newProduct.stock) {
      this.productService.addProduct(this.newProduct);
      this.getProducts();
      this.newProduct = { id: 0, name: '', description: '', price: 0, stock: 0 };  // Réinitialise le formulaire
    } else {
      alert('Veuillez remplir tous les champs');
    }
  }

  editProduct(product: Product) {
    this.editingProduct = { ...product };  // Clone pour éviter la référence directe
  }

  updateProduct() {
    if (this.editingProduct && this.editingProduct.name && this.editingProduct.description && this.editingProduct.price && this.editingProduct.stock) {
      this.productService.updateProduct(this.editingProduct.id, this.editingProduct);
      this.getProducts();
      this.editingProduct = null;  // Réinitialise le formulaire
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
    // Filtre les produits en fonction du terme de recherche
    if (this.searchTerm) {
      this.products = this.productService.getProducts().filter(product => 
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.getProducts();  // Restaure tous les produits si la recherche est vide
    }
    this.paginateProducts();  // Recalcule la pagination après le filtrage
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
    this.itemsPerPage = Number(selectElement.value); // Mettre à jour le nombre d'éléments par page
    this.currentPage = 1;  // Réinitialise à la première page lorsque l'on change le nombre d'éléments par page
    this.paginateProducts();  // Recalcule la pagination
  }

  // Fonction pour basculer le mode nuit
  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }

  // Fonction d'ajout de produit
  ajouterProduit() {
    this.newProduct = { id: 0, name: '', description: '', price: 0, stock: 0 }; // Initialisation du formulaire d'ajout
  }

  // Fonction pour modifier un produit
  modifierProduit(product: Product) {
    this.editingProduct = { ...product };
  }

  // Fonction pour supprimer un produit
  supprimerProduit(product: Product) {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      this.deleteProduct(product.id);
    }
  }
}
