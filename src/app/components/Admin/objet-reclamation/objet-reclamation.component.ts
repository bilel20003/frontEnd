import { Component, OnInit } from '@angular/core';
import { ObjectService } from 'src/app/services/object.service';  // Assurez-vous que le service existe
  // Utilisation de ng-bootstrap pour les modales si nécessaire

@Component({
  selector: 'app-objet-reclamation',
  templateUrl: './objet-reclamation.component.html',
  styleUrls: ['./objet-reclamation.component.css']
})
export class ObjetReclamationComponent implements OnInit {
  objects: any[] = [];  // Tableau pour stocker les objets
  itemsPerPage: number = 5;
  paginatedObjects: any[] = [];  // Objets paginés à afficher
  currentPage: number = 1;  // Page actuelle
  pageSize: number = 5;  // Taille des pages pour la pagination
  totalPages: number = 1;  // Nombre total de pages
  searchTerm: string = '';  // Termes de recherche
  showModal: boolean = false;  // Détermine si la modale est affichée ou non
  editingObject: any = null;  // Objet en cours de modification
  newObject: any = {  // Objet qui sera ajouté ou modifié
    id: 0,
    name: '',
    type: '',
    description: '',
    status: ''
  };
  isNightMode: boolean = false;  // Mode nuit

  constructor(private objectService: ObjectService) {}

  ngOnInit(): void {
    this.getObjects();
  }

  // Récupérer tous les objets
  getObjects(): void {
    this.objectService.getAllObjects().subscribe(data => {
      this.objects = data;
      this.totalPages = Math.ceil(this.objects.length / this.pageSize);  // Calcul du nombre de pages
      this.updatePaginatedObjects();
    });
  }

  // Mettre à jour la liste paginée des objets à afficher
  updatePaginatedObjects(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedObjects = this.objects.slice(startIndex, endIndex);
  }

  // Gérer le changement de page
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedObjects();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedObjects();
    }
  }

  // Ouvrir la modale pour ajouter un objet
  addObject(): void {
    this.editingObject = null;  // Pas d'objet en édition
    this.newObject = { id: 0, name: '', type: '', description: '', status: '' };  // Réinitialiser l'objet
    this.showModal = true;
  }

  // Ouvrir la modale pour modifier un objet
  editObject(object: any): void {
    this.editingObject = { ...object };  // Dupliquer l'objet pour l'éditer
    this.newObject = { ...object };  // Pré-remplir les champs du formulaire
    this.showModal = true;
  }

  // Fermer la modale sans sauvegarder
  closeModal(): void {
    this.showModal = false;
    this.newObject = { id: 0, name: '', type: '', description: '', status: '' };  // Réinitialiser l'objet
    this.editingObject = null;
  }

  // Sauvegarder l'objet (ajout ou modification)
  saveObject(): void {
    if (!this.newObject.name || !this.newObject.type || !this.newObject.description || !this.newObject.status) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    if (this.editingObject) {
      // Si l'objet est en édition, le mettre à jour
      this.objectService.updateObject(this.newObject.id, this.newObject).subscribe(() => {
        this.getObjects();  // Recharger les objets
        this.closeModal();  // Fermer la modale
      });
    } else {
      // Sinon, ajouter un nouvel objet
      this.objectService.addObject(this.newObject).subscribe(() => {
        this.getObjects();  // Recharger les objets
        this.closeModal();  // Fermer la modale
      });
    }
  }

  // Supprimer un objet
  deleteObject(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer cet objet ?')) {
      this.objectService.deleteObject(id).subscribe(() => {
        this.getObjects();  // Recharger les objets après suppression
      });
    }
  }

  // Filtrer les objets en fonction du terme de recherche
  filterObjects(): void {
    if (this.searchTerm) {
      this.objects = this.objects.filter(obj =>
        obj.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        obj.type.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        obj.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.getObjects();  // Recharger les objets si aucun terme de recherche n'est donné
    }
    this.totalPages = Math.ceil(this.objects.length / this.pageSize);  // Recalculer les pages
    this.updatePaginatedObjects();  // Mettre à jour les objets paginés
  }

  // Changer le mode (jour/nuit)
  toggleMode(): void {
    this.isNightMode = !this.isNightMode;
  }

  // Affecter un produit à un objet (fonctionnalité supplémentaire)
  affecterProduit(objet: any): void {
    // Code pour affecter un produit à un objet
    alert('Fonctionnalité "Affecter Produit" à implémenter');
  }

  // Gérer le changement du nombre d'éléments par page
  onItemsPerPageChange(): void {
    this.updatePaginatedObjects();
  }

  // Aller à la page précédente
  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedObjects();
    }
  }

  // Aller à la page suivante
  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedObjects();
    }
  }
}
