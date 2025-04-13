import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface ServiceModel {
  id_service: number;
  nom_service: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceService {

  private services: ServiceModel[] = [
    { id_service: 1, nom_service: 'Informatique' },
    { id_service: 2, nom_service: 'Ressources Humaines' },
    { id_service: 3, nom_service: 'Logistique' },
    { id_service: 4, nom_service: 'Comptabilité' },
    { id_service: 5, nom_service: 'Affaires Juridiques' },
    { id_service: 6, nom_service: 'Communication' }
  ];

  constructor() {}

  getAllServices(): Observable<ServiceModel[]> {
    return of(this.services);
  }

  deleteService(id: number): Observable<void> {
    this.services = this.services.filter(s => s.id_service !== id);
    return of();
  }

  addService(service: ServiceModel): Observable<ServiceModel> {
    const newId = this.services.length ? Math.max(...this.services.map(s => s.id_service)) + 1 : 1;
    const newService = { ...service, id_service: newId };
    this.services.push(newService);
    return of(newService);
  }

  updateService(updatedService: ServiceModel): Observable<ServiceModel> {
    const index = this.services.findIndex(s => s.id_service === updatedService.id_service);
    if (index !== -1) {
      this.services[index] = updatedService;
    }
    return of(updatedService);
  }
}
