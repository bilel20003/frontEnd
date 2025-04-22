import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Requete } from '../models/requete.model';
import { UserInfo } from './user-info';

@Injectable({
  providedIn: 'root'
})
export class RequeteService {
  private apiUrl = 'http://localhost:8082/api/requetes'; // URL de votre backend

  constructor(private http: HttpClient) {}

  // Méthode pour récupérer les requêtes par ID de client
  getRequetesByClientId(clientId: number): Observable<Requete[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  
    return this.http.get<Requete[]>(`${this.apiUrl}/client/${clientId}`, { headers });
  }

  // Méthode pour récupérer les requêtes par ID de guichetier
  getRequetesByGuichetierId(guichetierId: number): Observable<Requete[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Requete[]>(`${this.apiUrl}/guichetier/${guichetierId}`, { headers });
  }

  // Méthode pour créer une nouvelle requête
  createRequete(requete: Omit<Requete, 'id'>): Observable<Requete> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    return this.http.post<Requete>(`${this.apiUrl}/addrequete`, requete, { headers });
  }

  // Méthode pour mettre à jour une requête
  updateRequete(id: number, requete: Requete): Observable<Requete> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<Requete>(`${this.apiUrl}/updaterequete/${id}`, requete, { headers });
  }

  // Méthode pour récupérer le guichetier avec le moins de requêtes
  getGuichetierWithLeastRequests(): Observable<UserInfo> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<UserInfo>(`${this.apiUrl}/guichetier/least`, { headers });
  }

  // Dans votre RequeteService
  getAllTechniciens(): Observable<UserInfo[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<UserInfo[]>('http://localhost:8082/api/personnes/getalltechniciens', { headers });
  }
  
}