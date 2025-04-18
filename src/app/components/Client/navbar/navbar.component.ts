import { AuthService } from 'src/app/services/auth.service'; 
import { Component,  HostListener } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  dropdownVisible: boolean = false;
  constructor(private authService: AuthService) {}

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownVisible = !this.dropdownVisible;
    console.log("Dropdown toggled:", this.dropdownVisible);
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (dropdownMenu) {
      this.dropdownVisible ? dropdownMenu.classList.add('show') : dropdownMenu.classList.remove('show');
    }
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event) {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const button = document.querySelector('.icon-btn');

    if (dropdownMenu && !dropdownMenu.contains(event.target as Node) && button !== event.target) {
      this.dropdownVisible = false;
      dropdownMenu.classList.remove('show');
    }
  }

  logout() {
    this.authService.logout();
  }
}
