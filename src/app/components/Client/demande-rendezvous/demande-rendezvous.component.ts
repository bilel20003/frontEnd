import { Component } from '@angular/core';

@Component({
  selector: 'app-demande-rendezvous',
  templateUrl: './demande-rendezvous.component.html',
  styleUrls: ['./demande-rendezvous.component.css']
})
export class DemandeRendezvousComponent {
  rendezvous = {
    date: '',
    time: '',
    description: ''
  };

  submitForm() {
    if (this.rendezvous.date && this.rendezvous.time && this.rendezvous.description) {
      console.log('Demande de rendez-vous envoyée:', this.rendezvous);
      // Logique pour envoyer les données (par exemple, via un service)
    }
  }
}
