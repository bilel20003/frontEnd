import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Requete } from '../models/requete.model';

@Injectable({
  providedIn: 'root'
})
export class RequeteService {
  private apiUrl = 'http://localhost:8082/api/requetes'; // URL of your backend

  constructor(private http: HttpClient) {}

  // Method to retrieve requests by client ID
  getRequetesByClientId(clientId: number): Observable<Requete[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  
    return this.http.get<Requete[]>(`${this.apiUrl}/client/${clientId}`, { headers });
  }

  // Method to create a new request
  createRequete(requete: Omit<Requete, 'id'>): Observable<Requete> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    return this.http.post<Requete>(`${this.apiUrl}/addrequete`, requete, { headers });
  }
}