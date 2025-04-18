import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = this.authService.getToken();

    if (token) {
      // Le token existe → OK, mais on vérifie aussi le rôle si nécessaire
      const expectedRole = route.data['role']; // récupère le rôle attendu s'il y en a

      if (expectedRole) {
        const decodedToken: any = this.authService.decodeToken(); // tu peux créer cette méthode dans le service
        const userRole = decodedToken?.role;

        if (userRole === expectedRole) {
          return true;
        } else {
          alert('Accès interdit : rôle non autorisé');
          this.router.navigate(['/login']);
          return false;
        }
      }

      return true; // pas de rôle attendu → juste connecté
    } else {
      // Pas de token → redirection vers login
      this.router.navigate(['/login']);
      return false;
    }
  }
}
