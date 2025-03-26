import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-voir-rendezvous',
  templateUrl: './voir-rendezvous.component.html',
  styleUrls: ['./voir-rendezvous.component.css']
})
export class VoirRendezvousComponent implements OnInit {
  // Liste simulée des rendez-vous
  rendezvousList = [
    { date: '2025-03-10', time: '10:00', description: 'Consultation générale' },
    { date: '2025-03-12', time: '14:00', description: 'Rendez-vous 1' },
    { date: '2025-03-15', time: '09:00', description: 'Suivi de traitement' }
  ];

  constructor() {}

  ngOnInit(): void {
    // Logique pour récupérer les rendez-vous, par exemple depuis un service
    // this.rendezvousList = this.rendezvousService.getRendezvous();
  }
}
