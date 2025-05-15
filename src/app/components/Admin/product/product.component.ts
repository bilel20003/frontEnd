import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ProduitService } from 'src/app/services/produit.service';
import { UserInfoService } from 'src/app/services/user-info.service';
import { Produit, CreateProduit } from 'src/app/models/produit.model';
import { HttpErrorResponse } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { NgForm } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  sortDirection: { [key: string]: boolean } = { id: false };
  itemsPerPage: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  isNightMode: boolean = false;
  isSubmitted: boolean = false;

  @ViewChild('productFormElement') productFormElement!: NgForm;

  constructor(
    private productService: ProduitService,
    private userInfoService: UserInfoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
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
    alert('Votre session a expiré. Veuillez vous reconnecter.');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  getProducts(): void {
    this.productService.getAllProduits().subscribe({
      next: (data) => {
        this.products = data;
        this.filteredProducts = [...data];
        this.filteredProducts.sort((a, b) => b.id - a.id);
        this.updatePagination();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des produits :', err.message);
        this.showError('Erreur: Impossible de charger les produits. Vérifiez votre connexion.');
      }
    });
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.productForm.nom) {
      this.formErrors.nom = 'Veuillez entrer un nom de produit.';
    }
    if (!this.productForm.description) {
      this.formErrors.description = 'Veuillez fournir une description.';
    }
    if (!this.productForm.topologie) {
      this.formErrors.topologie = 'Veuillez sélectionner une topologie.';
    }
    if (this.productForm.prix === null || this.productForm.prix <= 0) {
      this.formErrors.prix = 'Le prix doit être supérieur à 0 DT.';
    }

    this.cdr.detectChanges();
    return Object.keys(this.formErrors).length === 0;
  }

  isFormValid(): boolean {
    return Object.keys(this.formErrors).length === 0 &&
           this.productForm.nom.trim() !== '' &&
           this.productForm.description.trim() !== '' &&
           this.productForm.topologie.trim() !== '' &&
           this.productForm.prix > 0;
  }

  updateFormErrors(): void {
    this.validateForm();
  }

  addProduct(): void {
    this.isSubmitted = true;
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
        this.showSuccess('Produit ajouté avec succès !');
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors de l\'ajout du produit :', err.message);
        this.showError('Erreur: Échec de l\'ajout du produit. Veuillez réessayer.');
      }
    });
  }

  updateProduct(): void {
    this.isSubmitted = true;
    if (!this.validateForm() || !this.editingProduct) return;

    this.productService.updateProduit(this.editingProduct.id, this.productForm).subscribe({
      next: () => {
        this.getProducts();
        this.closeModal();
        this.showSuccess('Produit mis à jour avec succès !');
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors de la mise à jour du produit :', err.message);
        this.showError('Erreur: Échec de la mise à jour du produit. Veuillez réessayer.');
      }
    });
  }

  archiveProduct(id: number): void {
    const snackBarRef = this.snackBar.open(
      'Voulez-vous vraiment archiver ce produit ? Cette action est irréversible.',
      'Confirmer',
      {
        duration: 10000,
        panelClass: ['custom-error-snackbar'],
        verticalPosition: 'top',
        horizontalPosition: 'center'
      }
    );

    snackBarRef.onAction().subscribe(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        this.redirectToLogin();
        return;
      }

      this.productService.archiveProduit(id).subscribe({
        next: () => {
          this.getProducts();
          this.showSuccess('Produit archivé avec succès !');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur lors de l\'archivage du produit :', err.message);
          this.showError('Erreur: Échec de l\'archivage du produit. Veuillez réessayer.');
        }
      });
    });
  }

  openModal(product: Produit | null = null): void {
    this.isModalOpen = true;
    this.isSubmitted = false;
    this.productForm = product ? { ...product } : { id: 0, nom: '', description: '', topologie: '', prix: 0 };
    this.editingProduct = product;
    this.formErrors = {};
    this.validateForm();
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isSubmitted = false;
    this.productForm = { id: 0, nom: '', description: '', topologie: '', prix: 0 };
    this.editingProduct = null;
    this.formErrors = {};
    if (this.productFormElement) {
      this.productFormElement.resetForm();
    }
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
      this.sortDirection[field] = field === 'id' ? false : true;
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
}