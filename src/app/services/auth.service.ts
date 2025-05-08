import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8082/api/personnes';

  constructor(private http: HttpClient, private router: Router) {}

  // Méthode de connexion
  login(email: string, password: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/login`, { email: email.toLowerCase(), password }, { headers })
      .pipe(tap((response: any) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          const decodedUser = jwtDecode(response.token);
        }
      }));
  }

  // Méthode pour mot de passe oublié
  forgotPassword(email: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/forgot-password`, { email: email.toLowerCase() }, { headers });
  }

  // Méthode de déconnexion
  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  // Obtenir le token actuel
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  // Récupérer le rôle de l'utilisateur à partir du token
  getRole(): string | null {
    const token = this.getToken();
    if (token) {
      const decoded: any = jwtDecode(token);
      return decoded.role;
    }
    return null;
  }

  // Décoder le token JWT
  decodeToken(): any {
    const token = this.getToken();
    if (token) {
      return jwtDecode(token);
    }
    return null;
  }

  // Méthode pour réinitialiser le mot de passe
  resetPassword(token: string, password: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/reset-password`, { token, password }, { headers });
  }
}