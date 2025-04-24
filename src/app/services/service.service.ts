import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Servicee } from '../models/service.model';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private apiUrl = 'http://localhost:8082/api/roles'; // Assuming Servicee is managed by RoleRest

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

  addNewService(service: Servicee): Observable<Servicee> {
    return this.http.post<Servicee>(`${this.apiUrl}/add`, service, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getAllService(): Observable<Servicee[]> {
    return this.http.get<Servicee[]>(`${this.apiUrl}/getall`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  updateService(id: number, service: Servicee): Observable<Servicee> {
    return this.http.put<Servicee>(`${this.apiUrl}/update/${id}`, service, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Erreur lors de la requête:', error);
    return throwError(() => new Error('Une erreur est survenue, veuillez réessayer.'));
  }
}