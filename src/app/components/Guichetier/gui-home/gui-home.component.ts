import { Component, OnInit, HostListener } from "@angular/core";


import { Router } from "@angular/router";
import { GuiNavComponent } from "../gui-nav/gui-nav.component";

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
    selector: 'app-gui-home',
    templateUrl: './gui-home.component.html',
    styleUrls: ['./gui-home.component.css']
})

export class GuiHomeComponent implements OnInit {
    reclamations: Reclamation[] = [
        { id: 1, type: 'Réclamation', emetteur: 'Ali Ben Salah', ministere: 'Ministère A', service: 'Service X', objet: 'Problème réseau', etat: 'Nouveau' },
        { id: 2, type: 'Demande de travaux', emetteur: 'Mohamed Trabelsi', ministere: 'Ministère B', service: 'Service Y', objet: 'Mise à jour système', etat: 'En cours de traitement' },
        { id: 3, type: 'Réclamation', emetteur: 'Fatma Jebali', ministere: 'Ministère C', service: 'Service Z', objet: 'Panne matérielle', etat: 'Traité' },
        { id: 4, type: 'Réclamation', emetteur: 'Sami Kacem', ministere: 'Ministère D', service: 'Service W', objet: 'Problème logiciel', etat: 'Nouveau' },
        { id: 5, type: 'Demande de travaux', emetteur: 'Nadia Ben Ali', ministere: 'Ministère A', service: 'Service X', objet: 'Installation réseau', etat: 'En cours de traitement' },
        { id: 6, type: 'Réclamation', emetteur: 'Amine Zidi', ministere: 'Ministère E', service: 'Service V', objet: 'Erreur de configuration', etat: 'Traité' },
        { id: 7, type: 'Demande de travaux', emetteur: 'Mouna Gharbi', ministere: 'Ministère F', service: 'Service Y', objet: 'Mise à jour serveur', etat: 'En attente' },
        { id: 8, type: 'Réclamation', emetteur: 'Khaled Ben Ammar', ministere: 'Ministère G', service: 'Service Z', objet: 'Problème matériel', etat: 'Nouveau' },
        { id: 9, type: 'Demande de travaux', emetteur: 'Rami Fathi', ministere: 'Ministère H', service: 'Service W', objet: 'Réparation serveur', etat: 'En cours de traitement' },
        { id: 10, type: 'Réclamation', emetteur: 'Leila Charfeddine', ministere: 'Ministère I', service: 'Service V', objet: 'Mise à jour de base de données', etat: 'Traité' },
        { id: 11, type: 'Demande de travaux', emetteur: 'Hassan Mzali', ministere: 'Ministère J', service: 'Service X', objet: 'Optimisation du système', etat: 'En attente' },
        { id: 12, type: 'Réclamation', emetteur: 'Salma Zoghlami', ministere: 'Ministère K', service: 'Service Y', objet: 'Erreur dans le traitement des données', etat: 'Nouveau' }
    ];

    filteredReclamations: Reclamation[] = [...this.reclamations];
    
    selectedReclamation: Reclamation | null = null;

    searchTerm: string = '';
    dropdownVisible: boolean = false;
    sortDirection: { [key: string]: boolean } = {};

    constructor(private router: Router) {}

    ngOnInit(): void {}

    

    filterReclamations() {
        this.filteredReclamations = this.reclamations.filter(reclamation =>
            Object.values(reclamation).some(value =>
                value.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
            )
        );
    }

    refuserReclamation(id: number) {
        console.log(`Réclamation ${id} refusée`);
    }

    sort(column: string) {
        this.sortDirection[column] = !this.sortDirection[column];
        const direction = this.sortDirection[column] ? 1 : -1;
        
        this.filteredReclamations.sort((a, b) => {
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

    toggleDropdown(event: Event) {
        event.stopPropagation();
        this.dropdownVisible = !this.dropdownVisible;
        console.log("Dropdown toggled:", this.dropdownVisible);
        const dropdownMenu = document.querySelector('.dropdown-menu');
        if (dropdownMenu) {
            this.dropdownVisible ? dropdownMenu.classList.add('show') : dropdownMenu.classList.remove('show');
        }
    }

    @HostListener('document:click', ['$event'])
    closeDropdown(event: Event) {
        const dropdownMenu = document.querySelector('.dropdown-menu');
        const button = document.querySelector('.icon-btn');

        if (dropdownMenu && !dropdownMenu.contains(event.target as Node) && button !== event.target) {
            this.dropdownVisible = false;
            dropdownMenu.classList.remove('show');
        }
    }

    logout() {
        console.log('Déconnexion');
    }
}
