import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Produit } from '../models/produit.model';
import { Objet } from '../models/objet.model';

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

  getAllProduits(): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.apiUrl}/getallproduits`, this.getHttpOptions()).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des produits:', error);
        return throwError(() => new Error('Erreur lors de la récupération des produits'));
      })
    );
  }
 addProduit(produit: Produit): Observable<Produit> {
    console.log('Envoi de la requête POST avec:', produit);
    return this.http.post<Produit>(`${this.apiUrl}/addproduit`, produit, this.getHttpOptions()).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'ajout du produit:', error);
        return throwError(() => error);
      })
    );
  }

  

  updateProduit(id: number, produit: Produit): Observable<Produit> {
    return this.http.put<Produit>(`${this.apiUrl}/updateproduit/${id}`, produit, this.getHttpOptions());
  }

  deleteProduit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deleteproduit/${id}`, this.getHttpOptions());
  }

  getAllObjets(): Observable<Objet[]> {
    return this.http.get<Objet[]>(`${this.apiUrl}/objets`, this.getHttpOptions()).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des objets:', error);
        return throwError(() => new Error('Erreur lors de la récupération des objets'));
      })
    );
  }
}