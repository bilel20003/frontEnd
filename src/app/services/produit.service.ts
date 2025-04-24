import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Produit } from '../models/produit.model';

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
        'Authorization': token ?` Bearer ${token}` : ''
      })
    };
  }

  getAllProduits(): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.apiUrl}/getallproduits`, this.getHttpOptions());
  }

  
  addProduit(produit: Produit): Observable<Produit> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token')  // ou autre méthode de stockage du token
    });
  
    return this.http.post<Produit>(`${this.apiUrl}/addproduit`,produit,{ headers: headers });
  }

  updateProduit(id: number, produit: Produit): Observable<Produit> {
    return this.http.put<Produit>(`${this.apiUrl}/updateproduit/${produit.id}`, produit, this.getHttpOptions());
  }
  deleteProduit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deleteproduit/${id}`, this.getHttpOptions());
  }
  
}