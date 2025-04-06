import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar-admin',
  templateUrl: './navbar-admin.component.html',
  styleUrls: ['./navbar-admin.component.css']
})
export class NavbarAdminComponent {
  dropdownVisible = false;

  constructor(private router: Router) {}

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownVisible = !this.dropdownVisible;
  }

  logout(): void {
    // Efface les données de session ou token selon ton système
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // Ferme le dropdown si on clique en dehors
  ngOnInit(): void {
    window.addEventListener('click', () => {
      this.dropdownVisible = false;
    });
  }
}
