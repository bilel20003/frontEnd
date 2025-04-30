import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Ministere } from '../models/ministere.model';

@Injectable({
  providedIn: 'root'
})
export class MinistereService {
  private apiUrl = 'http://localhost:8082/api/ministeres';

  private getHttpOptions(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  constructor(private http: HttpClient) {}

  addNewMinistere(ministere: { nomMinistere: string }): Observable<Ministere> {
    return this.http.post<Ministere>(`${this.apiUrl}/addNewMinistere`, ministere, this.getHttpOptions());
  }

  getAllMinisteres(): Observable<Ministere[]> {
    return this.http.get<Ministere[]>(`${this.apiUrl}/getAllMinisteres`, this.getHttpOptions());
  }

  updateMinistere(id: number, ministere: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/updateMinistere/${id}`, ministere, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  archiveMinistere(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/archiveMinistere/${id}`, null, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Erreur lors de la requête:', error);
    return throwError(() => new Error('Une erreur est survenue, veuillez réessayer.'));
  }
}