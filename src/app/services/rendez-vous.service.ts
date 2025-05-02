import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Rdv, RdvCreate } from '../models/rendez-vous.model';

@Injectable({
  providedIn: 'root'
})
export class RendezvousService {
  private apiUrl = 'http://localhost:8082/api/rdvs';

  constructor(private http: HttpClient) {}

  private getHttpOptions(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No JWT token found in localStorage');
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token.trim()}` : ''
    });
    console.log('HTTP Headers:', {
      'Content-Type': headers.get('Content-Type'),
      'Authorization': headers.get('Authorization')
    });
    return { headers };
  }

  getRendezvous(): Observable<Rdv[]> {
    return this.http.get<Rdv[]>(this.apiUrl, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  getRendezvousByClient(clientId: number): Observable<Rdv[]> {
    const url = `${this.apiUrl}/client/${clientId}`;
    return this.http.get<Rdv[]>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  getRendezvousByTechnicien(technicienId: number): Observable<Rdv[]> {
    return this.http.get<Rdv[]>(`${this.apiUrl}/technicien/${technicienId}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  addRendezvous(rdv: RdvCreate): Observable<Rdv> {
    console.log('Sending POST request to:', this.apiUrl);
    console.log('Request body:', JSON.stringify(rdv, null, 2));
    return this.http.post<Rdv>(this.apiUrl, rdv, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  updateRdv(id: number, rdv: Partial<Rdv>): Observable<Rdv> {
    const url = `${this.apiUrl}/${id}`;
    console.log('Sending PUT request to:', url);
    console.log('Request body:', JSON.stringify(rdv, null, 2));
    return this.http.put<Rdv>(url, rdv, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  refuseRdv(id: number, guichetierId: number): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${id}/refuse?guichetierId=${guichetierId}`,
      {},
      this.getHttpOptions()
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue, veuillez réessayer.';
    if (error.status === 500) {
      errorMessage = 'Erreur serveur interne. Veuillez réessayer plus tard.';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Données invalides. Vérifiez les champs saisis.';
    } else if (error.status === 403) {
      errorMessage = 'Accès interdit. Vérifiez vos permissions ou reconnectez-vous.';
    } else if (error.status === 404) {
      errorMessage = error.error?.message || 'Ressource non trouvée.';
    }
    console.error('Erreur lors de la requête:', error);
    return throwError(() => new Error(errorMessage));
  }
}