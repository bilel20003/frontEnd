import { Component, OnInit, HostListener } from "@angular/core";
import { Router } from "@angular/router";

interface Requete {
    ref: number;
    objet: string;
    typeRequete: string;
    description: string;
    etat: string;
    [key: string]: string | number;
}

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
    requetes: Requete[] = [
        { ref: 101, objet: 'Panne serveur', typeRequete: 'Réclamation', description: 'Le serveur principal est hors ligne.', etat: 'Nouveau' },
        { ref: 102, objet: 'Maintenance réseau', typeRequete: 'Demande de travaux', description: 'Besoin de maintenance sur le réseau.', etat: 'En cours de traitement' },
        { ref: 103, objet: 'Accès refusé', typeRequete: 'Réclamation', description: 'Problème d’accès à l’application.', etat: 'Traité' },
        { ref: 104, objet: 'Installation antivirus', typeRequete: 'Demande de travaux', description: 'Installation d’un antivirus sur les postes.', etat: 'Nouveau' }
    ];

    filteredRequetes: Requete[] = [...this.requetes];
    
    searchTerm: string = '';
    sortDirection: { [key: string]: boolean } = {};

    constructor(private router: Router) {}

    ngOnInit(): void {}

    filterReclamations() {
        this.filteredRequetes = this.requetes.filter(requete =>
            Object.values(requete).some(value =>
                value.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
            )
        );
    }

    sort(column: string) {
        this.sortDirection[column] = !this.sortDirection[column];
        const direction = this.sortDirection[column] ? 1 : -1;
        
        this.filteredRequetes.sort((a, b) => {
            const valA = a[column];
            const valB = b[column];

            if (typeof valA === 'number' && typeof valB === 'number') {
                return direction * (valA - valB);
            }
            return direction * valA.toString().localeCompare(valB.toString(), 'fr', { numeric: true });
        });
    }

    getBadgeClass(etat: string) {
        switch (etat) {
            case 'Nouveau': return 'badge-primary';
            case 'En cours de traitement': return 'badge-warning';
            case 'Traité': return 'badge-success';
            case 'Refusé': return 'badge-danger';
            default: return 'badge-secondary';
        }
    }
}
