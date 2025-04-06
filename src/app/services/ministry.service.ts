import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MinistryService {

  private ministries = [
    { id: 1, name: 'Ministère de l\'Éducation', description: 'Responsable de l\'éducation nationale', services: [
      { id: 1, name: 'Direction des Examens et Concours', description: 'Gestion des examens et concours' },
      { id: 2, name: 'Service des Ressources Pédagogiques', description: 'Fourniture de ressources pédagogiques' }
    ]},
    { id: 2, name: 'Ministère de la Santé', description: 'Gestion des affaires sanitaires et médicales', services: [
      { id: 3, name: 'Direction de la Santé Publique', description: 'Prévention des maladies et santé publique' },
      { id: 4, name: 'Service des Hôpitaux', description: 'Gestion des hôpitaux et cliniques' }
    ]},
    { id: 3, name: 'Ministère des Finances', description: 'Responsable de la gestion économique et des finances publiques', services: [
      { id: 5, name: 'Direction des Impôts', description: 'Gestion des impôts et des taxes' },
      { id: 6, name: 'Service de la Comptabilité Publique', description: 'Suivi des comptes publics' }
    ]}
  ];

  constructor() { }
  deleteMinistry(ministryId: number): Observable<void> {
    console.log(`Ministère avec l'ID ${ministryId} supprimé`);
    return of();  // Simulation de la suppression, ici tu devrais interagir avec une API backend
  }

  // Récupérer tous les ministères
  getAllMinistries(): Observable<any> {
    return of(this.ministries); // Retourner les données par défaut
  }

  // Récupérer un ministère par son ID
  getMinistryById(ministryId: number): Observable<any> {
    const ministry = this.ministries.find(min => min.id === ministryId);
    return of(ministry); // Retourner le ministère trouvé
  }

  // Récupérer les services associés à un ministère
  getServicesByMinistry(ministryId: number): Observable<any> {
    const ministry = this.ministries.find(min => min.id === ministryId);
    return of(ministry ? ministry.services : []); // Retourner les services associés au ministère
  }
}
