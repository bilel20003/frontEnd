  import { Injectable } from '@angular/core';
  import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
  import { Observable, throwError } from 'rxjs';
  import { catchError } from 'rxjs/operators';
  import { Objet } from '../models/objet.model';

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
      return this.http.get<Objet[]>(`${this.apiUrl}/getallobjets`, this.getHttpOptions())
        .pipe(catchError(this.handleError));
    }

    private handleError(error: HttpErrorResponse): Observable<never> {
      console.error('Erreur lors de la requête:', error);
      return throwError(() => new Error('Une erreur est survenue, veuillez réessayer.'));
    }
  }