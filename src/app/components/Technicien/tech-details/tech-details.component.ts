import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-tech-details',
  templateUrl: './tech-details.component.html',
  styleUrls: ['./tech-details.component.css']
})
export class TechDetailsComponent implements OnInit {
  reclamation: any;
  note: string = '';

  reclamations = [
    { id: 1, date: '2025-03-04', ministere: 'Ministère A', service: 'Service X', objet: 'Problème réseau', description: 'Problème de connexion Internet' },
    { id: 2, date: '2025-03-03', ministere: 'Ministère B', service: 'Service Y', objet: 'Problème logiciel', description: 'Erreur dans l’application' },
    { id: 3, date: '2025-03-02', ministere: 'Ministère C', service: 'Service Z', objet: 'Panne matérielle', description: 'Écran cassé' }
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.reclamation = this.reclamations.find(r => r.id === id);
  }

  soumettreTravail() {
    console.log(`Travail effectué pour réclamation ${this.reclamation.id} avec note: ${this.note}`);
    this.router.navigate(['/tech/home']);
  }
}
