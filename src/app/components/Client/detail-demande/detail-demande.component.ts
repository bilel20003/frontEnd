import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Interface pour les objets requêtes
interface Requete {
  ref: number;
  objet: string;
  typeRequete: string;
  description: string;
  etat: string;
  pieceJointe?: string; 
}

@Component({
  selector: 'app-detail-demande',
  templateUrl: './detail-demande.component.html',
  styleUrls: ['./detail-demande.component.css']
})
export class DetailDemandeComponent implements OnInit {
  reference!: string;
  requetes: Requete[] = []; // Tableau vide initialisé

  Requetes: Requete[] = [
    { ref: 101, objet: 'Panne serveur', typeRequete: 'Réclamation', description: 'Le serveur principal est hors ligne.', etat: 'Nouveau' },
    { ref: 102, objet: 'Maintenance réseau', typeRequete: 'Demande de travaux', description: 'Besoin de maintenance sur le réseau.', etat: 'En cours de traitement' },
    { ref: 103, objet: 'Accès refusé', typeRequete: 'Réclamation', description: 'Problème d’accès à l’application.', etat: 'Traité' },
    { ref: 104, objet: 'Installation antivirus', typeRequete: 'Demande de travaux', description: 'Installation d’un antivirus sur les postes.', etat: 'Nouveau' }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.reference = this.route.snapshot.paramMap.get('id') || '';
    // Recherche de la requête, ou vide si non trouvée
    const requeteTrouvee = this.Requetes.find((r: Requete) => r.ref.toString() === this.reference);

    // Si la requête est trouvée, assigne-la à requetes. Sinon, assigne un tableau vide
    this.requetes = requeteTrouvee ? [requeteTrouvee] : [];
  }

  retour() {
    window.history.back();
  }
}
