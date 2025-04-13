import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface ObjetReclamation {
  id: number;
  name: string;
  type: string;
  description: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ObjectService {

  private objects: ObjetReclamation[] = [
    { id: 1, name: 'Objet A', type: 'Type 1', description: 'Description A', status: 'Actif' },
    { id: 2, name: 'Objet B', type: 'Type 2', description: 'Description B', status: 'Inactif' },
    { id: 3, name: 'Objet C', type: 'Type 1', description: 'Description C', status: 'Actif' }
  ];

  private nextId: number = 4;

  constructor() {}

  getAllObjects(): Observable<ObjetReclamation[]> {
    return of(this.objects);
  }

  addObject(object: ObjetReclamation): Observable<void> {
    object.id = this.nextId++;
    this.objects.push({ ...object });
    return of();
  }

  updateObject(id: number, updatedObject: ObjetReclamation): Observable<void> {
    const index = this.objects.findIndex(obj => obj.id === id);
    if (index !== -1) {
      this.objects[index] = { ...updatedObject };
    }
    return of();
  }

  deleteObject(id: number): Observable<void> {
    this.objects = this.objects.filter(obj => obj.id !== id);
    return of();
  }
}
