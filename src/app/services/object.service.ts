import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

interface Object {
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

  // Liste fictive des objets pour simuler les appels à une API backend
  private objects: Object[] = [
    { id: 1, name: 'Objet A', type: 'Type 1', description: 'Description de l\'objet A', status: 'En cours' },
    { id: 2, name: 'Objet B', type: 'Type 2', description: 'Description de l\'objet B', status: 'Traitée' },
    { id: 3, name: 'Objet C', type: 'Type 3', description: 'Description de l\'objet C', status: 'Refusée' }
  ];

  constructor() { }

  // Récupérer tous les objets
  getObjects(): Observable<Object[]> {
    return of(this.objects);
  }

  // Ajouter un objet
  addObject(newObject: Object): Observable<Object> {
    const newId = this.objects.length + 1; // Génère un nouvel ID (à améliorer avec un backend)
    newObject.id = newId;
    this.objects.push(newObject);
    return of(newObject);
  }

  // Mettre à jour un objet
  updateObject(id: number, updatedObject: Object): Observable<Object> {
    const index = this.objects.findIndex(obj => obj.id === id);
    if (index !== -1) {
      this.objects[index] = { ...updatedObject, id };
      return of(this.objects[index]);  // Retourne l'objet mis à jour
    } else {
      // Retourne un objet vide ou une valeur spécifique au lieu de null
      return of({ id: 0, name: '', type: '', description: '', status: '' });
    }
  }
  

  // Supprimer un objet
  deleteObject(id: number): Observable<void> {
    const index = this.objects.findIndex(obj => obj.id === id);
    if (index !== -1) {
      this.objects.splice(index, 1);
    }
    return of();
  }

  // Filtrer les objets en fonction du nom ou de la description
  filterObjects(term: string): Observable<Object[]> {
    if (!term) {
      return of(this.objects);  // Si le terme est vide, on retourne tous les objets
    }
    const filtered = this.objects.filter(obj =>
      obj.name.toLowerCase().includes(term.toLowerCase()) ||
      obj.description.toLowerCase().includes(term.toLowerCase())
    );
    return of(filtered);
  }
}
