import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Objet } from '../models/objet.model';

export enum ObjetType {
  RENDEZVOUS = 'RENDEZVOUS',
  RECLAMATION = 'RECLAMATION',
  DEMANDE_TRAVAUX = 'DEMANDE_TRAVAUX'
}

@Injectable({
  providedIn: 'root'
})
export class ObjetService {
  private apiUrl = 'http://localhost:8082/api/objets';

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

  getAllObjets(): Observable<Objet[]> {
    return this.http.get<Objet[]>(`${this.apiUrl}/getallobjets`, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  addObjet(objet: Omit<Objet, 'id'>): Observable<Objet> {
    console.log('Payload envoyée:', JSON.stringify(objet, null, 2));
    return this.http.post<Objet>(`${this.apiUrl}/addobjet`, objet, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  updateObjet(id: number, objet: Objet): Observable<Objet> {
    return this.http.put<Objet>(`${this.apiUrl}/updateobjet/${id}`, objet, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  archiveObjet(id: number): Observable<void> {
    console.log('archiveObjet called with id:', id);
    return this.http.put<void>(`${this.apiUrl}/archiveobjet/${id}`, {}, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  getObjetsByProduitId(produitId: number): Observable<Objet[]> {
    return this.http.get<Objet[]>(`${this.apiUrl}/getobjetsbyproduit/${produitId}`, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  getObjetsByProduitIdAndType(produitId: number, type: ObjetType): Observable<Objet[]> {
    return this.http.get<Objet[]>(`${this.apiUrl}/getobjetsbyproduit/${produitId}/${type}`, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Erreur HTTP:', error);
    let errorMessage = 'Une erreur est survenue, veuillez réessayer.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = `Code: ${error.status}, Message: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage += `, Détails: ${error.error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}