import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface Reclamation {
  id: number;
  type: string;
  emetteur: string;
  ministere: string;
  service: string;
  objet: string;
  etat: string;
  [key: string]: string | number;
}

@Component({
  selector: 'app-gui-request-details',
  templateUrl: './gui-request-details.component.html',
  styleUrls: ['./gui-request-details.component.css']
})
export class GuiRequestDetailsComponent implements OnInit {
  technicianDropdownVisible: boolean = false;
  selectedTechnician: number | null = null;
  technicians: { id: number; name: string }[] = [
    { id: 1, name: 'Technician A' },
    { id: 2, name: 'Technician B' },
    { id: 3, name: 'Technician C' }
  ];
  responseAreaVisible: boolean = false;
  responseText: string = '';
  reclamation!: Reclamation;

  constructor(private route: ActivatedRoute) { }

  showTechnicianDropdown() {
    this.technicianDropdownVisible = !this.technicianDropdownVisible;
  }

  showResponseArea() {
    this.responseAreaVisible = !this.responseAreaVisible;
  }

  sendResponse() {
    console.log('Response sent:', this.responseText);
    // Logic to send the response
  }

  ngOnInit(): void {
    const requestId = this.route.snapshot.paramMap.get('id');
    
    if (requestId) {
      // Remplace ceci par la logique pour charger les détails de la réclamation en fonction de l'ID
      this.reclamation = {
        id: +requestId,
        type: 'Réclamation',
        emetteur: 'Ali Ben Salah',
        ministere: 'Ministère A',
        service: 'Service X',
        objet: 'Problème réseau',
        etat: 'Nouveau'
      };
    }
  }

  routeToTechnician() {
    console.log('Requête envoyée au technicien');
    // Logique pour router la requête vers un technicien
  }

  respondToRequest() {
    console.log('Réponse à la réclamation');
    // Logique pour répondre à la réclamation
  }
  getBadgeClass(etat: string): string {
    switch (etat) {
      case 'En attente':
        return 'badge-warning'; // Jaune pour "En attente"
      case 'En cours':
        return 'badge-primary'; // Bleu pour "En cours"
      case 'Terminé':
        return 'badge-success'; // Vert pour "Terminé"
      case 'Refusé':
        return 'badge-danger'; // Rouge pour "Refusé"
      default:
        return 'badge-secondary'; // Gris pour un état inconnu
    }
  }
}
