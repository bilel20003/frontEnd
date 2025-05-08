import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ProduitService } from 'src/app/services/produit.service';
import { UserInfoService } from 'src/app/services/user-info.service';
import { Produit, CreateProduit } from 'src/app/models/produit.model';
import { HttpErrorResponse } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';

interface FormErrors {
  nom?: string;
  description?: string;
  topologie?: string;
  prix?: string;
}

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductsComponent implements OnInit {
  products: Produit[] = [];
  filteredProducts: Produit[] = [];
  paginatedProducts: Produit[] = [];
  productForm: Produit = { id: 0, nom: '', description: '', topologie: '', prix: 0 };
  formErrors: FormErrors = {};
  editingProduct: Produit | null = null;
  isModalOpen: boolean = false;
  searchTerm: string = '';
  sortDirection: { [key: string]: boolean } = { id: false }; // Default to descending for id
  itemsPerPage: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  isNightMode: boolean = false;

  constructor(
    private productService: ProduitService,
    private userInfoService: UserInfoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkAdminAccess();
    const storedMode = localStorage.getItem('mode');
    if (storedMode === 'night') this.enableNightMode();
    this.getProducts();
  }

  private checkAdminAccess(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.redirectToLogin();
      return;
    }

    try {
      const decoded = jwtDecode<{ id: number; role: string; exp: number }>(token);
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        localStorage.removeItem('token');
        this.redirectToLogin();
        return;
      }
      if (decoded.role !== 'ADMIN') {
        alert('Accès réservé aux administrateurs.');
        this.router.navigate(['/home']);
        return;
      }
      this.userInfoService.getUserById(decoded.id).subscribe({
        error: (err: HttpErrorResponse) => {
          console.error('Error fetching user info:', err.message);
          this.redirectToLogin();
        }
      });
    } catch (e) {
      console.error('Error decoding token:', (e as Error).message);
      this.redirectToLogin();
    }
  }

  private redirectToLogin(): void {
    alert('Session invalide. Veuillez vous reconnecter.');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  getProducts(): void {
    this.productService.getAllProduits().subscribe({
      next: (data) => {
        this.products = data;
        this.filteredProducts = [...data];
        this.filteredProducts.sort((a, b) => b.id - a.id); // Sort by id descending
        this.updatePagination();
      },
      error: (err: Error) => {
        console.error('Error loading products:', err.message);
        alert(err.message);
      }
    });
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.productForm.nom) {
      this.formErrors.nom = 'Le nom est requis.';
    }
    if (!this.productForm.description) {
      this.formErrors.description = 'La description est requise.';
    }
    if (!this.productForm.topologie) {
      this.formErrors.topologie = 'La topologie est requise.';
    }
    if (this.productForm.prix === null || this.productForm.prix <= 0) {
      this.formErrors.prix = 'Le prix doit être supérieur à 0.';
    }

    this.cdr.detectChanges(); // Avoid NG0100
    return Object.keys(this.formErrors).length === 0;
  }

  isFormValid(): boolean {
    return Object.keys(this.formErrors).length === 0 &&
           this.productForm.nom !== '' &&
           this.productForm.description !== '' &&
           this.productForm.topologie !== '' &&
           this.productForm.prix > 0;
  }

  updateFormErrors(): void {
    this.validateForm();
  }

  addProduct(): void {
    if (!this.validateForm()) return;

    const createProduit: CreateProduit = {
      nom: this.productForm.nom,
      description: this.productForm.description,
      topologie: this.productForm.topologie,
      prix: this.productForm.prix
    };

    this.productService.addProduit(createProduit).subscribe({
      next: () => {
        this.getProducts();
        this.closeModal();
        alert('Produit ajouté avec succès.');
      },
      error: (err: Error) => {
        console.error('Error adding product:', err.message);
        alert(err.message);
      }
    });
  }

  updateProduct(): void {
    if (!this.validateForm() || !this.editingProduct) return;

    this.productService.updateProduit(this.editingProduct.id, this.productForm).subscribe({
      next: () => {
        this.getProducts();
        this.closeModal();
        alert('Produit mis à jour avec succès.');
      },
      error: (err: Error) => {
        console.error('Error updating product:', err.message);
        alert(err.message);
      }
    });
  }

  archiveProduct(id: number): void {
    if (!confirm('Voulez-vous vraiment archiver ce produit ?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      this.redirectToLogin();
      return;
    }

    this.productService.archiveProduit(id).subscribe({
      next: () => {
        this.getProducts();
        alert('Produit archivé avec succès.');
      },
      error: (err: Error) => {
        console.error('Error archiving product:', err.message);
        alert(err.message);
      }
    });
  }

  openModal(product: Produit | null = null): void {
    this.isModalOpen = true;
    this.productForm = product ? { ...product } : { id: 0, nom: '', description: '', topologie: '', prix: 0 };
    this.editingProduct = product;
    this.formErrors = {};
    this.validateForm(); // Set initial errors
    this.cdr.detectChanges(); // Avoid NG0100
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.productForm = { id: 0, nom: '', description: '', topologie: '', prix: 0 };
    this.editingProduct = null;
    this.formErrors = {};
  }

  closeModalOnOutsideClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  filterProducts(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(product =>
      product.nom.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term) ||
      product.topologie.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  sort(field: string): void {
    if (this.sortDirection[field] === undefined) {
      this.sortDirection[field] = field === 'id' ? false : true; // id defaults to descending
    } else {
      this.sortDirection[field] = !this.sortDirection[field];
    }
    const dir = this.sortDirection[field] ? 1 : -1;

    this.filteredProducts.sort((a, b) => {
      let valA: any = a[field as keyof Produit];
      let valB: any = b[field as keyof Produit];

      if (field === 'prix' || field === 'id') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
        return dir * (valA - valB);
      } else {
        valA = valA?.toString() || '';
        valB = valB?.toString() || '';
        return dir * valA.localeCompare(valB, 'fr', { numeric: true });
      }
    });

    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(start, start + this.itemsPerPage);
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

  onItemsPerPageChange(event: Event): void {
    this.itemsPerPage = Number((event.target as HTMLSelectElement).value);
    this.currentPage = 1;
    this.updatePagination();
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
}