import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Servicee } from '../models/service.model';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private apiUrl = 'http://localhost:8082/api/services';

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

  addNewService(service: Omit<Servicee, 'id'>): Observable<Servicee> {
    console.log('Données envoyées au backend (POST):', service);
    return this.http.post<Servicee>(`${this.apiUrl}/addNewService`, service, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getAllServices(): Observable<Servicee[]> {
    return this.http.get<Servicee[]>(`${this.apiUrl}/getAllServices`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  updateService(id: number, service: Omit<Servicee, 'id'>): Observable<Servicee> {
    console.log('Données envoyées au backend (PUT):', service);
    return this.http.put<Servicee>(`${this.apiUrl}/updateService/${id}`, service, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  archiveService(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/archiveService/${id}`, null, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Erreur lors de la requête:', error);
    if (error.status === 401) {
      alert('Session expirée. Veuillez vous reconnecter.');
      window.location.href = '/login';
    }
    return throwError(() => new Error('Une erreur est survenue, veuillez réessayer.'));
  }
}