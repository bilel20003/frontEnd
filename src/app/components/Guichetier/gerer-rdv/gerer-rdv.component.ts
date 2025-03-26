import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-gerer-rdv',
  templateUrl: './gerer-rdv.component.html',
  styleUrls: ['./gerer-rdv.component.css']
})
export class GererRdvComponent implements OnInit {
  searchText: string = '';  // Champ de recherche

  rendezVous: any[] = [
    { id: 1, date: '2025-03-15', client: { nom: 'Client', prenom: 'A' }, heure: '10:00', status: 'Confirmé' },
    { id: 2, date: '2025-03-16', client: { nom: 'Client', prenom: 'B' }, heure: '11:00', status: 'En attente' },
    { id: 3, date: '2025-03-16', client: { nom: 'Client', prenom: 'D' }, heure: '14:00', status: 'Confirmé' },
    { id: 4, date: '2025-03-17', client: { nom: 'Client', prenom: 'C' }, heure: '12:00', status: 'Annulé' },
    { id: 5, date: '2025-03-18', client: { nom: 'Client', prenom: 'E' }, heure: '09:30', status: 'Confirmé' },
    { id: 6, date: '2025-03-18', client: { nom: 'Client', prenom: 'F' }, heure: '15:00', status: 'En attente' },
    { id: 7, date: '2025-03-19', client: { nom: 'Client', prenom: 'G' }, heure: '10:30', status: 'Confirmé' },
    { id: 8, date: '2025-03-20', client: { nom: 'Client', prenom: 'H' }, heure: '16:00', status: 'Annulé' },
    { id: 9, date: '2025-03-21', client: { nom: 'Client', prenom: 'I' }, heure: '13:45', status: 'Confirmé' },
    { id: 10, date: '2025-03-22', client: { nom: 'Client', prenom: 'J' }, heure: '08:00', status: 'En attente' },
    
  ];

  sortColumn: string = '';  // Colonne actuellement triée
  sortOrder: boolean = true;  // Ordre du tri (true = ascendant, false = descendant)

  

  constructor() {}

  ngOnInit(): void {}

  // Fonction pour créer un nouveau RDV
  creerRdv(): void {
    const nouveauRdv = {
      id: this.rendezVous.length + 1,  // Assigner un nouvel ID
      date: '2025-03-18',  // Par défaut, une nouvelle date (cela peut être modifié selon ton besoin)
      client: { nom: 'Nouveau', prenom: 'Client' },  // Nom et prénom par défaut
      heure: '14:00',  // Heure par défaut
      status: 'En attente'  // Statut par défaut
    };
    this.rendezVous.push(nouveauRdv);  // Ajoute le nouveau RDV à la liste
    console.log('Nouveau RDV créé:', nouveauRdv);
  }

  modifierRdv(rdv: any): void {
    console.log('Modifier RDV:', rdv);
    // Logique de modification ici
  }

  annulerRdv(id: number): void {
    this.rendezVous = this.rendezVous.filter(rdv => rdv.id !== id);
    console.log('Rendez-vous annulé avec succès:', id);
  }

  filtrerRendezVous(): any[] {
    const searchTextLower = this.searchText.toLowerCase();  // Conversion de la recherche en minuscule
    return this.rendezVous
      .filter(rdv => {
        // Convertir id en chaîne pour la recherche, tout en vérifiant que ce n'est pas un nombre (pour éviter la confusion avec l'heure)
        return (
          rdv.id.toString().includes(searchTextLower) ||  // Recherche dans l'id (converti en chaîne)
          rdv.date.includes(searchTextLower) ||
          rdv.client.nom.toLowerCase().includes(searchTextLower) ||
          rdv.client.prenom.toLowerCase().includes(searchTextLower) ||
          rdv.heure.includes(searchTextLower)  // Recherche dans l'heure (chaine de caractère)
        );
      })
      .sort((a, b) => {
        const valueA = this.getPropertyValue(a, this.sortColumn);
        const valueB = this.getPropertyValue(b, this.sortColumn);
    
        if (valueA < valueB) return this.sortOrder ? -1 : 1;
        if (valueA > valueB) return this.sortOrder ? 1 : -1;
        return 0;
      });
  }

  // Fonction pour accéder à la valeur d'une propriété dynamique (comme 'client.nom')
  getPropertyValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc ? acc[part] : undefined, obj);
  }

  trier(colonne: string) {
    if (this.sortColumn === colonne) {
      this.sortOrder = !this.sortOrder; // Inverse l'ordre si on clique à nouveau sur la même colonne
    } else {
      this.sortColumn = colonne;
      this.sortOrder = true; // Par défaut, tri ascendant
    }
  }

  
}
