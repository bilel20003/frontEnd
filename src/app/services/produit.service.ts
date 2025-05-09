import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Produit, CreateProduit } from '../models/produit.model';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {
  private apiUrl = 'http://localhost:8082/api/produits';

  constructor(private http: HttpClient) {}

  private getHttpOptions(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Erreur lors de la requête:', error);
    let errorMessage = 'Une erreur est survenue, veuillez réessayer.';
    if (error.status === 500) {
      errorMessage = `Erreur serveur interne: ${JSON.stringify(error.error, null, 2) || 'Vérifiez les logs du serveur.'}`;
    } else if (error.status === 400) {
      errorMessage = `Données invalides envoyées au serveur: ${JSON.stringify(error.error, null, 2)}`;
    } else if (error.status === 403) {
      errorMessage = 'Accès interdit. Vérifiez vos permissions ou le token JWT.';
    }
    return throwError(() => new Error(errorMessage));
  }

  getAllProduits(): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.apiUrl}/getallproduits`, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  addProduit(produit: CreateProduit): Observable<Produit> {
    return this.http.post<Produit>(`${this.apiUrl}/addproduit`, produit, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  updateProduit(id: number, produit: Produit): Observable<Produit> {
    return this.http.put<Produit>(`${this.apiUrl}/updateproduit/${id}`, produit, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  archiveProduit(id: number): Observable<void> {
    const url = `${this.apiUrl}/archiveproduit/${id}`;
    return this.http.put<void>(url, {}, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }
}