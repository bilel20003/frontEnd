import { Component, HostListener, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { UserInfoService } from 'src/app/services/user-info.service';
import { ProduitService } from 'src/app/services/produit.service';
import { UserInfo } from 'src/app/models/user-info.model';
import { Produit } from 'src/app/models/produit.model';
import { jwtDecode } from 'jwt-decode';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  dropdownVisible: boolean = false;
  userInfo: UserInfo | null = null;
  produitMap: { [key: number]: Produit } = {};

  constructor(
    private authService: AuthService,
    private userInfoService: UserInfoService,
    private produitService: ProduitService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  private loadUserInfo(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, logging out');
      this.authService.logout();
      return;
    }

    try {
      const decoded = jwtDecode<{ id: number; role: string; produit?: { id: number } }>(token);
      console.log('Decoded JWT:', decoded);

      forkJoin({
        user: this.userInfoService.getUserById(decoded.id),
        produits: this.produitService.getAllProduits()
      }).subscribe({
        next: ({ user, produits }) => {
          console.log('UserInfo:', user);
          console.log('Produits:', produits);

          // Map JWT role string to role ID
          const roleId = this.getRoleId(decoded.role);
          this.userInfo = {
            ...user,
            role: { id: roleId } // Override role to match UserInfo interface
          };

          this.produitMap = produits.reduce((map, prod) => {
            if (prod.id) map[prod.id] = prod;
            return map;
          }, {} as { [key: number]: Produit });

          console.log('ProduitMap:', this.produitMap);
          console.log('User Produit:', this.userInfo?.produit);

          if (this.userInfo?.produit?.id && !this.produitMap[this.userInfo.produit.id]) {
            console.warn(`Product ID ${this.userInfo.produit.id} not found in produitMap`);
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error fetching user info or products:', err.message);
          this.authService.logout();
        }
      });
    } catch (e) {
      console.error('Error decoding token:', (e as Error).message);
      this.authService.logout();
    }
  }

  private getRoleId(roleName: string): number {
    const roleMap: { [key: string]: number } = {
      'CLIENT': 4,
      'GUICHETIER': 2,
      'TECHNICIEN': 3,
      'ADMIN': 1
    };
    const roleId = roleMap[roleName.toUpperCase()] || 0;
    if (!roleId) {
      console.warn(`No role ID found for roleName: ${roleName}`);
    }
    return roleId;
  }

  getProductName(): string {
    if (this.userInfo?.produit?.id && this.produitMap[this.userInfo.produit.id]) {
      return this.produitMap[this.userInfo.produit.id].nom;
    }
    return 'N/A';
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownVisible = !this.dropdownVisible;
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event): void {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const button = document.querySelector('.icon-btn');
    if (dropdownMenu && !dropdownMenu.contains(event.target as Node) && button !== event.target) {
      this.dropdownVisible = false;
    }
  }

  logout(): void {
    this.authService.logout();
  }
}