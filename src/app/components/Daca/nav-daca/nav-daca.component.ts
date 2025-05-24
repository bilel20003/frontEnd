  import { Component, HostListener, OnInit } from '@angular/core';
  import { AuthService } from 'src/app/services/auth.service';
  import { UserInfoService } from 'src/app/services/user-info.service';
  import { UserInfo } from 'src/app/models/user-info.model';
  import { jwtDecode } from 'jwt-decode';
  import { HttpErrorResponse } from '@angular/common/http';

  @Component({
    selector: 'app-navbar-daca',
    templateUrl: './nav-daca.component.html',
    styleUrls: ['./nav-daca.component.css']
  })
  export class NavbarDacaComponent implements OnInit {
    dropdownVisible: boolean = false;
    sidebarCollapsed: boolean = window.innerWidth <= 768;
    userInfo: UserInfo | null = null;

    constructor(
      private authService: AuthService,
      private userInfoService: UserInfoService
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
        const decoded = jwtDecode<{ id: number; role: string }>(token);
        console.log('Decoded JWT:', decoded);

        const roleId = this.getRoleId(decoded.role);
        this.userInfoService.getUserById(decoded.id).subscribe({
          next: (user) => {
            console.log('UserInfo:', user);
            this.userInfo = {
              ...user,
              role: { id: roleId }
            };
          },
          error: (err: HttpErrorResponse) => {
            console.error('Error fetching user info:', err.message);
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
        'ADMIN': 1,
        'DACA': 5
      };
      const roleId = roleMap[roleName.toUpperCase()] || 0;
      if (!roleId) {
        console.warn(`No role ID found for roleName: ${roleName}`);
      }
      return roleId;
    }

    toggleDropdown(event: Event): void {
      event.stopPropagation();
      this.dropdownVisible = !this.dropdownVisible;
    }

    toggleSidebar(): void {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    @HostListener('document:click', ['$event'])
    closeDropdown(event: Event): void {
      const dropdownMenu = document.querySelector('.dropdown-menu');
      const button = document.querySelector('.icon-btn');
      if (dropdownMenu && !dropdownMenu.contains(event.target as Node) && button !== event.target) {
        this.dropdownVisible = false;
      }
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: Event): void {
      this.sidebarCollapsed = window.innerWidth <= 768;
    }

    logout(): void {
      this.authService.logout();
    }
  }