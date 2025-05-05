import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Requete } from '../models/requete.model';
import { UserInfo } from '../models/user-info.model';

@Injectable({
  providedIn: 'root'
})
export class RequeteService {
  private apiUrl = 'http://localhost:8082/api/requetes';

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

  getAllRequetes(): Observable<Requete[]> {
    return this.http.get<Requete[]>(this.apiUrl, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getRequetesByClientId(clientId: number): Observable<Requete[]> {
    return this.http.get<Requete[]>(`${this.apiUrl}/client/${clientId}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getRequetesByGuichetierId(guichetierId: number): Observable<Requete[]> {
    return this.http.get<Requete[]>(`${this.apiUrl}/guichetier/${guichetierId}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getRequetesByTechnicienId(technicienId: number): Observable<Requete[]> {
    return this.http.get<Requete[]>(`${this.apiUrl}/technicien/${technicienId}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  createRequete(requete: Omit<Requete, 'id'>): Observable<Requete> {
    console.log('Creating requete with payload:', requete);
    return this.http.post<Requete>(`${this.apiUrl}/addrequete`, requete, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  updateRequete(id: number, requete: Requete): Observable<Requete> {
    return this.http.put<Requete>(`${this.apiUrl}/updaterequete/${id}`, requete, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getGuichetierWithLeastRequests(): Observable<{ id: number }> {
    return this.http.get<{ id: number }>(`${this.apiUrl}/guichetier/least`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Erreur lors de la requête:', error);
    return throwError(() => new Error('Une erreur est survenue, veuillez réessayer.'));
  }
  
}