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
  produitId?: number;
  serviceId?: number;
  password?: string;
  status: string; // Ajout du champ status
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
  
  getUserById(id: number): Observable<UserInfo> {
    console.log('getUserById called with id:', id);
    return this.http.get<UserInfo>(`${this.apiUrl}/appuser/${id}`, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  changePassword(userId: number, newPassword: string): Observable<any> {
    const payload = { password: newPassword };
    return this.http.put(`${this.apiUrl}/changePassword/${userId}`, payload, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }
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

  private generateDefaultPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
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
        console.log('Ministeres fetched:', JSON.stringify(ministeres, null, 2));

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
        console.log('MinistereMap created:', ministereMap);

        return users.map(user => {
          const roleName = user.role && user.role.id ? roleMap[user.role.id] || 'N/A' : 'N/A';
          const service = user.service && user.service.id && serviceMap[user.service.id] ? serviceMap[user.service.id] : null;
          let ministereName = 'N/A';
          if (service) {
            if (service.ministere && service.ministere.id) {
              ministereName = ministereMap[service.ministere.id] || 'N/A';
              console.log(`Mapping ministere for user ${user.id}: serviceId=${service.id}, ministereId=${service.ministere.id}, ministereName=${ministereName}`);
            } else {
              console.warn(`No ministere for user ${user.id}: serviceId=${service.id}, service.ministere=${JSON.stringify(service.ministere)}`);
            }
          } else {
            console.warn(`No service for user ${user.id}: serviceId=${user.service?.id}, serviceMap=${Object.keys(serviceMap)}`);
          }

          return {
            id: user.id || 0,
            nom: user.name || 'N/A',
            email: user.email || 'N/A',
            role: roleName,
            ministere: ministereName,
            service: service ? service.nomService || 'N/A' : 'N/A',
            produitId: user.produit && user.produit.id ? user.produit.id : undefined,
            serviceId: user.service && user.service.id ? user.service.id : undefined,
            password: '',
            status: user.status || 'false' // Inclure le status
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
        const roleId = this.getRoleId(user.role);
        if (!roleId) {
          console.error('Invalid role:', user.role);
          return throwError(() => new Error(`Invalid role '${user.role}'`));
        }
        console.log('Role ID for addUser:', roleId, 'for role:', user.role);

        const userInfo: Partial<UserInfo> = {
          name: user.nom,
          email: user.email,
          password: this.generateDefaultPassword(),
          isDeletable: 'true',
          status: user.status || 'true', // Utiliser le status du formulaire
          role: { id: roleId },
          produit: { id: produitId },
          service: { id: serviceId }
        };

        console.log('POST Payload for addNewAppuser:', JSON.stringify(userInfo, null, 2));

        return this.http.post(`${this.apiUrl}/addNewAppuser`, userInfo, this.getHttpOptions()).pipe(
          catchError(error => {
            console.error('POST request failed for addNewAppuser:', error);
            return throwError(() => error);
          })
        );
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
        console.log('Role ID for updateUser:', roleId, 'for role:', user.role);

        const userInfo: Partial<UserInfo> = {
          id: user.id,
          name: user.nom,
          email: user.email,
          password: user.password || undefined,
          role: { id: roleId },
          service: { id: serviceId },
          produit: { id: produitId },
          isDeletable: 'true',
          status: user.status || 'true' // Utiliser le status du formulaire
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

  toggleUserStatus(id: number): Observable<void> {
    console.log('toggleUserStatus called with id:', id);
    return this.http.put<void>(`${this.apiUrl}/toggleStatus/${id}`, {}, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  private getRoleId(roleName: string): number {
    const roleMap: { [key: string]: number } = {
      'CLIENT': 4,
      'GUICHETIER': 2,
      'TECHNICIEN': 3,
      'ADMIN': 1
    };
    const roleId = roleMap[roleName.toUpperCase()];
    console.log(`getRoleId called with roleName: ${roleName}, returning roleId: ${roleId || 'undefined'}`);
    if (!roleId) {
      console.error(`No role ID found for roleName: ${roleName}`);
    }
    return roleId || 0;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Erreur lors de la requête:', error);
    let errorMessage = 'Une erreur est survenue, veuillez réessayer.';
    if (error.status === 500) {
      errorMessage = 'Erreur serveur interne. Vérifiez les logs du serveur pour plus de détails.';
    } else if (error.status === 400) {
      const serverMessage = error.error ? JSON.stringify(error.error, null, 2) : 'Détails non disponibles';
      errorMessage = `Données invalides envoyées au serveur. Vérifiez les champs saisis. Erreur serveur: ${serverMessage}`;
    } else if (error.status === 403) {
      errorMessage = 'Accès interdit. Vérifiez vos permissions ou le token JWT.';
    }
    return throwError(() => new Error(errorMessage));
  }
}