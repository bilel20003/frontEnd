import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-renseigner-avancement',
  templateUrl: './renseigner-avancement.component.html',
  styleUrls: ['./renseigner-avancement.component.css']
})
export class RenseignerAvancementComponent implements OnInit {
  idDemande: string = '';  // Pour l'ID de la demande
  dateDemande: string = '';  // Pour la date de la demande
  etatAvancement: string = '';  // Etat d'avancement
  note: string = '';  // Note
  critereRecherche: string = '';  // Critère de recherche de demande

  // Liste des critères de recherche
  criteres = [
    'Critère 1',
    'Critère 2',
    'Critère 3',
    'Critère 4'
  ];

  constructor() { }

  ngOnInit(): void {
    // Initialisation ou logique à ajouter
  }

  submitAvancement(): void {
    // Logique de soumission des données
    console.log('Avancement soumis :', {
      idDemande: this.idDemande,
      dateDemande: this.dateDemande,
      etatAvancement: this.etatAvancement,
      note: this.note,
      critereRecherche: this.critereRecherche
    });
    // Tu peux ici ajouter la logique d'envoi au serveur
  }
}
