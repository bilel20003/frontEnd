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

  getAllServices(): Observable<Servicee[]> {
    return this.http.get<Servicee[]>(`${this.apiUrl}/getAllServices`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  addNewService(service: Servicee): Observable<Servicee> {
    return this.http.post<Servicee>(`${this.apiUrl}/addNewService`, service, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  updateService(id: number, service: Servicee): Observable<Servicee> {
    return this.http.put<Servicee>(`${this.apiUrl}/updateService/${id}`, service, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deleteService/${id}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Erreur lors de la requête:', error);
    return throwError(() => new Error('Une erreur est survenue, veuillez réessayer.'));
  }
}