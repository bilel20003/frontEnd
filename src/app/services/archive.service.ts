import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Ministere } from '../models/ministere.model';
import { Servicee } from '../models/service.model';
import { UserInfo } from '../models/user-info.model';
import { Produit } from '../models/produit.model';
import { Objet } from '../models/objet.model';
import { Requete } from '../models/requete.model';
import { Rdv } from '../models/rendez-vous.model'; 

@Injectable({
  providedIn: 'root'
})
export class ArchiveService {
  private apiUrl = 'http://localhost:8082/api/archive';

  constructor(private http: HttpClient) {}

  private getHttpOptions(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No JWT token found in localStorage');
    }
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Erreur lors de la requête:', error);
    let errorMessage = 'Une erreur est survenue, veuillez réessayer.';
    if (error.status === 500) {
      errorMessage = 'Erreur serveur interne. Vérifiez les logs du serveur pour plus de détails.';
    } else if (error.status === 400) {
      errorMessage = `Données invalides envoyées au serveur: ${JSON.stringify(error.error, null, 2)}`;
    } else if (error.status === 403) {
      errorMessage = 'Accès interdit. Vérifiez vos permissions ou le token JWT.';
    }
    return throwError(() => new Error(errorMessage));
  }

  getArchivedEntities(entity: string): Observable<(Ministere | Servicee | UserInfo | Produit | Objet | Requete | Rdv)[]> {
    return this.http.get<(Ministere | Servicee | UserInfo | Produit | Objet | Requete | Rdv)[]>(`${this.apiUrl}/${entity}`, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  unarchiveEntity(entity: string, id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${entity}/${id}/unarchive`, {}, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }
}