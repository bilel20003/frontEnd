import { Component, OnInit } from '@angular/core';
import { ProduitService } from 'src/app/services/produit.service'; 
import { Produit } from 'src/app/models/produit.model';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductsComponent implements OnInit {

  products: Produit[] = [];
  paginatedProducts: Produit[] = [];
  productForm: Produit = { id: 0, nom: '', description: '', topologie: '' , prix: 0 };
  editingProduct: Produit | null = null;
  isModalOpen: boolean = false;
  searchTerm: string = '';
  itemsPerPage: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  isNightMode: boolean = false;

  constructor(private productService: ProduitService) {}

  ngOnInit() {
    this.getProducts();
  }

  getProducts() {
    this.productService.getAllProduits().subscribe(data => {
      this.products = data;
      this.paginateProducts();
    });
  }

  addProduct() {
    this.productService.addProduit(this.productForm).subscribe(() => {
      this.getProducts();
      this.closeModal();
    });
  }

  updateProduct() {
    if (this.editingProduct) {
      this.productService.updateProduit(this.editingProduct.id, this.productForm).subscribe(() => {
        this.getProducts();
        this.closeModal();
      });
    }
  }

  deleteProduct(id: number) {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      this.productService.deleteProduit(id).subscribe(() => this.getProducts());
    }
  }

  openModal(product: Produit | null = null): void {
    this.isModalOpen = true;
    this.productForm = product ? { ...product } : { id: 0, nom: '', description: '', topologie: '', prix: 0 };
    this.editingProduct = product;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.productForm = { id: 0, nom: '', description: '', topologie: '', prix: 0 };
    this.editingProduct = null;
  }

  filterProducts() {
    const term = this.searchTerm.toLowerCase();
    this.paginatedProducts = this.products.filter(product =>
      product.nom.toLowerCase().includes(term) ||
      (product.description || '').toLowerCase().includes(term) ||
      (product.topologie || '').toLowerCase().includes(term)
    );
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
}