import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Requete } from '../models/requete.model';



@Injectable({
  providedIn: 'root'
})
export class RequeteService {
  private apiUrl = 'http://localhost:8082/api/requetes'; // mets ici l'URL de ton backend

  constructor(private http: HttpClient) {}

  getRequetesByClientId(clientId: number): Observable<Requete[]> {
    const token = localStorage.getItem('token'); // ou sessionStorage selon ton app
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  
    return this.http.get<Requete[]>(`http://localhost:8082/api/requetes/client/${clientId}`, { headers });
  }
  
}
