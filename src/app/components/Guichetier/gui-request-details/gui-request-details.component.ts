import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Reclamation {
  id: number;
  type: string;
  objet: string;
  description: string;
  etat: string;
  noteRetour: string | null;
  date: string;
  client: Personne;
  guichetier: Personne;
  technicien: Personne | null;
}

interface Personne {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

interface Technicien {
  id: number;
  nom: string;
  prenom: string;
}

@Component({
  selector: 'app-gui-request-details',
  templateUrl: './gui-request-details.component.html',
  styleUrls: ['./gui-request-details.component.css']
})
export class GuiRequestDetailsComponent implements OnInit {
  technicianDropdownVisible: boolean = false;
  selectedTechnician: number | null = null;
  technicians: Technicien[] = [];
  responseAreaVisible: boolean = false;
  responseText: string = '';
  reclamation: Reclamation | null = null;

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  showTechnicianDropdown() {
    this.technicianDropdownVisible = !this.technicianDropdownVisible;
    if (this.technicianDropdownVisible) {
      // Récupérer les techniciens disponibles via le backend
      this.http.get<Personne[]>('http://localhost:8082/api/personnes/techniciens').subscribe(
        (data) => {
          this.technicians = data.map((technician: Personne) => ({
            id: technician.id,
            nom: technician.nom,
            prenom: technician.prenom
          }));
        },
        (error) => {
          console.error('Erreur lors de la récupération des techniciens', error);
        }
      );
    }
  }

  showResponseArea() {
    this.responseAreaVisible = !this.responseAreaVisible;
  }

  sendResponse() {
    console.log('Réponse envoyée:', this.responseText);
    const requestId = this.reclamation?.id;
    const noteRetour = this.responseText;
    if (requestId != null) {
      this.http.put(`http://localhost:8082/api/requetes/${requestId}/respond`, noteRetour).subscribe(
        (data) => {
          this.reclamation = data as Reclamation;
          this.responseAreaVisible = false;  // Cacher la zone de réponse après envoi
        },
        (error) => {
          console.error('Erreur lors de l\'envoi de la réponse', error);
        }
      );
    }
  }

  assignTechnician() {
    if (this.selectedTechnician) {
      const requestId = this.reclamation?.id;
      if (requestId != null) {
        this.http.put(`http://localhost:8082/api/requetes/${requestId}/assign-technician`, this.selectedTechnician).subscribe(
          (data) => {
            this.reclamation = data as Reclamation;
            this.technicianDropdownVisible = false;  // Cacher le dropdown après l'affectation
          },
          (error) => {
            console.error('Erreur lors de l\'assignation du technicien', error);
          }
        );
      }
    }
  }

  ngOnInit(): void {
    const requestId = this.route.snapshot.paramMap.get('id');
    if (requestId) {
      this.http.get<Reclamation>(`http://localhost:8082/api/requetes/${requestId}`).subscribe(
        (data) => {
          this.reclamation = data;
        },
        (error) => {
          console.error('Erreur lors de la récupération des détails de la réclamation', error);
        }
      );
    }
  }

  getBadgeClass(etat: string): string {
    switch (etat) {
      case 'NOUVEAU': return 'badge-primary';
      case 'EN_COURS_DE_TRAITEMENT': return 'badge-warning';
      case 'TRAITEE': return 'badge-success';
      case 'REFUSEE': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }
}
