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

  // Rendre la méthode publique
  public getHttpOptions(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  // Nouvelle méthode pour récupérer une pièce jointe par ID
  getPieceJointeParId(id: number): Observable<{ id: number; nomFichier: string; url: string; typeFichier: string }> {
    return this.http.get<{ id: number; nomFichier: string; url: string; typeFichier: string }>(
      `${this.apiUrl}/piece-jointe/${id}`,
      this.getHttpOptions()
    ).pipe(catchError(this.handleError));
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

  createRequete(requete: Omit<Requete, 'id'>, files?: File[]): Observable<Requete> {
    const formData = new FormData();
    formData.append('requete', new Blob([JSON.stringify(requete)], { type: 'application/json' }));
    
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file, file.name);
      });
    }
    
    return this.http.post<Requete>(`${this.apiUrl}/addrequete`, formData, this.getHttpOptions())
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