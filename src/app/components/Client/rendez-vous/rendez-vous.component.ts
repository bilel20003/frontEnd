import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RendezVousService } from './rendezvous-detail.service'; // Importez le service

@Component({
  selector: 'app-rendez-vous',
  templateUrl: './rendez-vous.component.html',
  styleUrls: ['./rendez-vous.component.css']
})
export class RendezVousComponent implements OnInit {
  rendezVousList: any[] = []; // Liste des rendez-vous

  constructor(private router: Router, private rendezVousService: RendezVousService) {}

  ngOnInit() {
    // Écoutez les changements dans le service
    this.rendezVousService.currentRendezVous.subscribe(rendezVous => {
      this.rendezVousList = rendezVous; // Mettez à jour la liste des rendez-vous
    });
  }

  navigateToDetail() {
    this.router.navigate(['rendez-vous/rendezvous-detail']); // Naviguer vers la page de détail
  }
}