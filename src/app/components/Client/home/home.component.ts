// home.component.ts
import { Component , OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-client',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  reclamations = [
    { id: 1, date: '2025-03-04', ministere: 'Ministère A', service: 'Service X', objet: 'Problème réseau', description: 'Problème de connexion Internet' },
    { id: 2, date: '2025-03-03', ministere: 'Ministère B', service: 'Service Y', objet: 'Problème logiciel', description: 'Erreur dans l’application' },
    { id: 3, date: '2025-03-02', ministere: 'Ministère C', service: 'Service Z', objet: 'Panne matérielle', description: 'Écran cassé' }
  ];

  constructor() {}

  ngOnInit(): void {}

  consulterReclamation(id: number) {
    console.log(`Consultation de la réclamation ${id}`);
  }

  refuserReclamation(id: number) {
    console.log(`Réclamation ${id} refusée`);
  }
}
