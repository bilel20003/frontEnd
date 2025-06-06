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
import { ProduitService } from './produit.service';

export interface UserDisplay {
  id: number;
  nom: string;
  email: string;
  role: string;
  ministere: string;
  service: string;
  produitId?: number;
  produitNom?: string;
  serviceId?: number;
  password?: string;
  status: string;
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
    private serviceService: ServiceService,
    private produitService: ProduitService
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
      ministeres: this.ministereService.getAllMinisteres(),
      produits: this.produitService.getAllProduits()
    }).pipe(
      map(({ users, roles, services, ministeres, produits }) => {
        console.log('getAllUsers API Responses:', { users, roles, services, ministeres, produits });

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

        const produitMap = produits.reduce((map, produit) => {
          map[produit.id] = produit.nom;
          return map;
        }, {} as { [key: number]: string });

        return users.map(user => {
          console.log(`Mapping user ID ${user.id}: Raw produit data:`, user.produit);

          const roleName = user.role && user.role.id ? roleMap[user.role.id] || 'N/A' : 'N/A';
          const service = user.service && user.service.id && serviceMap[user.service.id] ? serviceMap[user.service.id] : null;
          let ministereName = 'N/A';
          if (service && service.ministere && service.ministere.id) {
            ministereName = ministereMap[service.ministere.id] || 'N/A';
          }

          let produitId: number | undefined = undefined;
          let produitNom: string = 'N/A';

          if (user.produit && typeof user.produit === 'object' && 'id' in user.produit && user.produit.id != null) {
            produitId = user.produit.id;
            produitNom = user.produit.nom ?? (produitId && produitMap[produitId] ? produitMap[produitId] : 'N/A');
          } else {
            console.warn(`Produit is missing or invalid for user ID ${user.id}:`, user.produit);
            produitId = 1; // Default to 'Any'
            produitNom = produitMap[1] || 'N/A';
          }

          console.log(`User ID ${user.id} - produitId: ${produitId}, produitNom: ${produitNom}`);

          return {
            id: user.id || 0,
            nom: user.name || 'N/A',
            email: user.email || 'N/A',
            role: roleName,
            ministere: ministereName,
            service: service ? service.nomService || 'N/A' : 'N/A',
            produitId: produitId,
            produitNom: produitNom,
            serviceId: user.service && user.service.id ? user.service.id : undefined,
            password: '',
            status: user.status || 'false'
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
        if (!user.serviceId) {
          return throwError(() => new Error('Service ID is required'));
        }
        const serviceId = Number(user.serviceId);
        const service = services.find(s => s.id === serviceId);
        if (!service) {
          return throwError(() => new Error(`Service with ID '${serviceId}' not found`));
        }
        if (!user.produitId) {
          return throwError(() => new Error('Produit ID is required'));
        }
        const produitId = Number(user.produitId);
        const roleId = this.getRoleId(user.role);
        if (!roleId) {
          return throwError(() => new Error(`Invalid role '${user.role}'`));
        }
        const userInfo: Partial<UserInfo> = {
          name: user.nom,
          email: user.email,
          password: this.generateDefaultPassword(),
          isDeletable: 'true',
          status: user.status || 'true',
          role: { id: roleId },
          produit: { id: produitId },
          service: { id: serviceId }
        };
        return this.http.post(`${this.apiUrl}/addNewAppuser`, userInfo, this.getHttpOptions());
      }),
      catchError(this.handleError)
    );
  }

  updateUser(id: number, user: UserDisplay): Observable<any> {
    console.log('updateUser called with id:', id, 'user:', user);
    return this.serviceService.getAllServices().pipe(
      mergeMap(services => {
        let serviceId: number | undefined = user.serviceId;
        let produitId: number | undefined = user.produitId;

        if (serviceId) {
          const service = services.find(s => s.id === serviceId);
          if (!service) {
            return throwError(() => new Error(`Service with ID '${serviceId}' not found`));
          }
        } else {
          console.warn('No serviceId provided, proceeding without service update');
          serviceId = undefined;
        }

        if (!produitId) {
          console.warn('No produitId provided, proceeding without produit update');
          produitId = undefined;
        }

        const roleId = this.getRoleId(user.role);
        if (!roleId) {
          return throwError(() => new Error(`Invalid role '${user.role}'`));
        }

        const userInfo: Partial<UserInfo> = {
          id: user.id,
          name: user.nom,
          email: user.email,
          password: user.password || undefined,
          role: { id: roleId },
          service: serviceId ? { id: serviceId } : undefined,
          produit: produitId ? { id: produitId } : undefined,
          isDeletable: 'true',
          status: user.status || 'true'
        };

        console.log('Sending update user payload:', userInfo);
        return this.http.put(`${this.apiUrl}/updateAppuser/${id}`, userInfo, this.getHttpOptions());
      }),
      catchError(this.handleError)
    );
  }

  archiveUser(id: number): Observable<void> {
    console.log('archiveUser called with id:', id);
    return this.http.put<void>(`${this.apiUrl}/archiveAppuser/${id}`, {}, this.getHttpOptions()).pipe(
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
      'ADMIN': 1,
      'DACA': 5
    };
    const roleId = roleMap[roleName.toUpperCase()];
    if (!roleId) {
      console.error(`Invalid role '${roleName}'. Valid roles are: ${Object.keys(roleMap).join(', ')}`);
      throw new Error(`Invalid role '${roleName}'`);
    }
    return roleId;
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

  getUserById(id: number): Observable<UserInfo> {
    console.log('getUserById called with id:', id);
    return this.http.get<UserInfo>(`${this.apiUrl}/appuser/${id}`, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  changePassword(userId: number, newPassword: string): Observable<any> {
    const payload = { password: newPassword };
    console.log('changePassword called with userId:', userId, 'payload:', payload);
    return this.http.put(`${this.apiUrl}/changePassword/${userId}`, payload, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  getUsersByRole(roleName: string): Observable<UserDisplay[]> {
    console.log(`getUsersByRole called with role: ${roleName}`);
    return this.getAllUsers().pipe(
      map(users => {
        const filteredUsers = users.filter(user => 
          user.role.toUpperCase() === roleName.toUpperCase()
        );
        console.log(`Found ${filteredUsers.length} users with role ${roleName}`);
        return filteredUsers;
      }),
      catchError(this.handleError)
    );
  }
}