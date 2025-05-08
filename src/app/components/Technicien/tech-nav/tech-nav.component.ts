import { Component, HostListener, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { UserInfoService } from 'src/app/services/user-info.service';
import { UserInfo } from 'src/app/models/user-info.model';
import { jwtDecode } from 'jwt-decode';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-tech-nav',
  templateUrl: './tech-nav.component.html',
  styleUrls: ['./tech-nav.component.css']
})
export class TechNavComponent implements OnInit {
  dropdownVisible: boolean = false;
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

      this.userInfoService.getUserById(decoded.id).subscribe({
        next: (user) => {
          console.log('UserInfo:', user);
          this.userInfo = user;
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