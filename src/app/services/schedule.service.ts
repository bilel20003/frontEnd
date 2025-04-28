import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Schedule } from '../models/schedule.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = 'http://localhost:8082/api/schedules';

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

  getSchedulesByDay(dayOfWeek: string): Observable<Schedule[]> {
    return this.http.get<Schedule[]>(`${this.apiUrl}/${dayOfWeek}`, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  getAvailableSlots(date: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/available-slots?date=${date}`, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  addSchedule(schedule: Schedule): Observable<Schedule> {
    return this.http.post<Schedule>(this.apiUrl, schedule, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  updateSchedule(id: number, schedule: Schedule): Observable<Schedule> {
    return this.http.put<Schedule>(`${this.apiUrl}/${id}`, schedule, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  deleteSchedule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getHttpOptions()).pipe(
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
      errorMessage = 'Accès interdit. Vérifiez vos permissions.';
    } else if (error.status === 404) {
      errorMessage = error.error?.message || 'Ressource non trouvée.';
    }
    console.error('Erreur lors de la requête:', error);
    return throwError(() => new Error(errorMessage));
  }
}