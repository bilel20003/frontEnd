import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, forkJoin } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { UserInfo } from '../models/user-info.model';
import { Role } from '../models/role.model';
import { Servicee } from '../models/service.model';
import { Ministere } from '../models/ministere.model';
import { Produit } from '../models/produit.model';
import { RoleService } from './role.service';
import { MinistereService } from './ministere.service';
import { ServiceService } from './service.service';

export interface UserDisplay {
  id: number;
  nom: string;
  email: string;
  role: string;
  ministere: string;
  service: string;
  password?: string;
  produitId?: number;
  serviceId?: number;
}

export { UserInfo as Technicien };

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {
  private apiUrl = 'http://localhost:8082/api/personnes';

  constructor(
    private http: HttpClient,
    private roleService: RoleService,
    private ministereService: MinistereService,
    private serviceService: ServiceService
  ) {}

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

  getAllUsers(): Observable<UserDisplay[]> {
    return forkJoin({
      users: this.http.get<UserInfo[]>(`${this.apiUrl}/getallappuser`, this.getHttpOptions()),
      roles: this.roleService.getAllRoles(),
      services: this.serviceService.getAllServices(),
      ministeres: this.ministereService.getAllMinisteres()
    }).pipe(
      map(({ users, roles, services, ministeres }) => {
        console.log('getAllUsers API Responses:', { users, roles, services, ministeres });

        const roleMap = roles.reduce((map, role) => {
          map[role.id] = role.name;
          return map;
        }, {} as { [key: number]: string });

        const serviceMap = services.reduce((map, service) => {
          map[service.id] = service;
          return map;
        }, {} as { [key: number]: Servicee });

        const ministereMap = ministeres.reduce((map, ministere) => {
          map[ministere.id] = ministere.nomMinistere;
          return map;
        }, {} as { [key: number]: string });

        return users.map(user => {
          const roleName = user.role && user.role.id ? roleMap[user.role.id] || 'N/A' : 'N/A';
          const service = user.service && user.service.id && serviceMap[user.service.id] ? serviceMap[user.service.id] : null;
          const ministereName = service && service.ministere && service.ministere.id
            ? ministereMap[service.ministere.id] || 'N/A'
            : 'N/A';

          return {
            id: user.id || 0,
            nom: user.name || 'N/A',
            email: user.email || 'N/A',
            role: roleName,
            ministere: ministereName,
            service: service ? service.nomService || 'N/A' : 'N/A'
          };
        });
      }),
      catchError(this.handleError)
    );
  }

  getAllTechniciens(): Observable<UserInfo[]> {
    return this.http.get<UserInfo[]>(`${this.apiUrl}/getalltechniciens`, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  getServices(): Observable<Servicee[]> {
    return this.serviceService.getAllServices().pipe(
      catchError(this.handleError)
    );
  }

  addUser(user: UserDisplay): Observable<any> {
    console.log('addUser called with user:', user);
    return this.serviceService.getAllServices().pipe(
      mergeMap(services => {
        console.log('Services fetched for addUser:', services);
        if (!user.serviceId) {
          console.error('Service ID is undefined');
          return throwError(() => new Error('Service ID is required'));
        }
        const serviceId = Number(user.serviceId);
        const service = services.find(s => s.id === serviceId);
        if (!service) {
          console.error('Service not found, serviceId:', serviceId, 'services:', services);
          return throwError(() => new Error(`Service with ID '${serviceId}' not found`));
        }
        if (!user.produitId) {
          console.error('Produit ID is undefined');
          return throwError(() => new Error('Produit ID is required'));
        }
        const produitId = Number(user.produitId);
        if (!user.password) {
          console.error('Password is undefined');
          return throwError(() => new Error('Password is required'));
        }
        const roleId = this.getRoleId(user.role);
        if (!roleId) {
          console.error('Invalid role:', user.role);
          return throwError(() => new Error(`Invalid role '${user.role}'`));
        }

        const userInfo: Partial<UserInfo> = {
          name: user.nom,
          email: user.email,
          password: user.password,
          isDeletable: 'true',
          status: 'true',
          role: { id: roleId },
          produit: { id: produitId },
          service: { id: serviceId }
        };

        console.log('POST Payload for addNewAppuser:', JSON.stringify(userInfo, null, 2));

        return this.http.post(`${this.apiUrl}/addNewAppuser`, userInfo, this.getHttpOptions());
      }),
      catchError(this.handleError)
    );
  }

  updateUser(id: number, user: UserDisplay): Observable<any> {
    console.log('updateUser called with id:', id, 'user:', user);
    return this.serviceService.getAllServices().pipe(
      mergeMap(services => {
        console.log('Services fetched for updateUser:', services);
        if (!user.serviceId) {
          console.error('Service ID is undefined');
          return throwError(() => new Error('Service ID is required'));
        }
        const serviceId = Number(user.serviceId);
        const service = services.find(s => s.id === serviceId);
        if (!service) {
          console.error('Service not found, serviceId:', serviceId, 'services:', services);
          return throwError(() => new Error(`Service with ID '${serviceId}' not found`));
        }
        if (!user.produitId) {
          console.error('Produit ID is undefined');
          return throwError(() => new Error('Produit ID is required'));
        }
        const produitId = Number(user.produitId);
        const roleId = this.getRoleId(user.role);
        if (!roleId) {
          console.error('Invalid role:', user.role);
          return throwError(() => new Error(`Invalid role '${user.role}'`));
        }

        const userInfo: Partial<UserInfo> = {
          id: user.id,
          name: user.nom,
          email: user.email,
          role: { id: roleId },
          service: { id: serviceId },
          produit: { id: produitId },
          isDeletable: 'true',
          status: 'true'
        };

        console.log('PUT Payload for updateAppuser:', JSON.stringify(userInfo, null, 2));

        return this.http.put(`${this.apiUrl}/updateAppuser/${id}`, userInfo, this.getHttpOptions());
      }),
      catchError(this.handleError)
    );
  }

  deleteUser(id: number): Observable<any> {
    console.log('deleteUser called with id:', id);
    return this.http.delete(`${this.apiUrl}/deleteAppuser/${id}`, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  private getRoleId(roleName: string): number {
    const roleMap: { [key: string]: number } = {
      'CLIENT': 1,
      'GUICHETIER': 2,
      'TECHNICIEN': 3,
      'ADMIN': 4
    };
    return roleMap[roleName.toUpperCase()] || 0;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Erreur lors de la requête:', error);
    let errorMessage = 'Une erreur est survenue, veuillez réessayer.';
    if (error.status === 500) {
      errorMessage = 'Erreur serveur interne. Vérifiez les logs du serveur pour plus de détails.';
    } else if (error.status === 400) {
      const serverMessage = error.error ? JSON.stringify(error.error, null, 2) : 'Détails non disponibles';
      errorMessage = `Données invalides envoyées au serveur. Vérifiez les champs saisis. Erreur serveur: ${serverMessage}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}