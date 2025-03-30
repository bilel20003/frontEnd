import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RequeteService {
  private apiUrl = 'http://localhost:8082/api/requetes'; // URL de l'API backend

  constructor(private http: HttpClient) { }

  getAllRequetes(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl); // Envoie une requête GET
  }
}
