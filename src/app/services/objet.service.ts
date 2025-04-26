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




// Ajouter un nouvel objet
addObjet(objet: Omit<Objet, 'id'>): Observable<Objet> {
console.log('Payload envoyée:', JSON.stringify(objet, null, 2));
return this.http.post<Objet>(`${this.apiUrl}/addobjet`, objet, this.getHttpOptions())
  .pipe(
    catchError(this.handleError)
  );
}
// Mettre à jour un objet existant
updateObjet(id: number, objet: Objet): Observable<Objet> {
return this.http.put<Objet>(`${this.apiUrl}/updateobjet/${id}`, objet, this.getHttpOptions())
  .pipe(catchError(this.handleError));
}

// Supprimer un objet
deleteObjet(id: number): Observable<void> {
return this.http.delete<void>(`${this.apiUrl}/deleteobjet/${id}`, this.getHttpOptions())
  .pipe(catchError(this.handleError));
}


// Gérer les erreurs

private handleError(error: any): Observable<never> {
  console.error('Erreur HTTP:', error); // Log détaillé pour le débogage
  let errorMessage = 'Une erreur est survenue, veuillez réessayer.';
  if (error.error instanceof ErrorEvent) {
    // Erreur côté client
    errorMessage = `Erreur: ${error.error.message}`;
  } else {
    // Erreur côté serveur
    errorMessage = `Code: ${error.status}, Message: ${error.message}`;
    if (error.error && error.error.message) {
      errorMessage += `, Détails: ${error.error.message}`;
    }
  }
  return throwError(() => new Error(errorMessage));
}




}