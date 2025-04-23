import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Requete } from '../models/requete.model';
import { UserInfo } from '../models/user-info.model';

@Injectable({
  providedIn: 'root'
})
export class RequeteService {
  private apiUrl = 'http://localhost:8082/api/requetes';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAllRequetes(): Observable<Requete[]> {
    return this.http.get<Requete[]>(`${this.apiUrl}/all`, { headers: this.getHeaders() });
  }

  getRequetesByClientId(clientId: number): Observable<Requete[]> {
    return this.http.get<Requete[]>(`${this.apiUrl}/client/${clientId}`, { headers: this.getHeaders() });
  }

  getRequetesByGuichetierId(guichetierId: number): Observable<Requete[]> {
    return this.http.get<Requete[]>(`${this.apiUrl}/guichetier/${guichetierId}`, { headers: this.getHeaders() });
  }

  getRequetesByTechnicienId(technicienId: number): Observable<Requete[]> {
    return this.http.get<Requete[]>(`${this.apiUrl}/technicien/${technicienId}`, { headers: this.getHeaders() });
  }

  createRequete(requete: Omit<Requete, 'id'>): Observable<Requete> {
    return this.http.post<Requete>(`${this.apiUrl}/addrequete`, requete, { headers: this.getHeaders() });
  }

  updateRequete(id: number, requete: Requete): Observable<Requete> {
    return this.http.put<Requete>(`${this.apiUrl}/updaterequete/${id}`, requete, { headers: this.getHeaders() });
  }

  getGuichetierWithLeastRequests(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${this.apiUrl}/guichetier/least`, { headers: this.getHeaders() });
  }

  getAllTechniciens(): Observable<UserInfo[]> {
    return this.http.get<UserInfo[]>('http://localhost:8082/api/personnes/getalltechniciens', { headers: this.getHeaders() });
  }
}