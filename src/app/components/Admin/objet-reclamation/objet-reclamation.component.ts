import { Component, OnInit } from '@angular/core';
import { ObjectService } from 'C:/Users/pc_asus/Documents/frontEnd/src/app/services/object.service';

interface Object {
  id: number;
  name: string;
  type: string;
  description: string;
  status: string;
}

@Component({
  selector: 'app-objet-reclamation',
  templateUrl: './objet-reclamation.component.html',
  styleUrls: ['./objet-reclamation.component.css']
})
export class ObjetReclamationComponent implements OnInit {

  objects: Object[] = [];  // Liste des objets associés aux réclamations
  newObject: Object = { id: 0, name: '', type: '', description: '', status: '' };  // Objet à ajouter
  editingObject: Object | null = null;  // Objet en cours d'édition
  searchTerm: string = '';  // Terme de recherche pour filtrer les objets
  itemsPerPage: number = 5;  // Nombre d'objets par page
  currentPage: number = 1;  // Page actuelle de la pagination
  totalPages: number = 1;  // Total des pages pour la pagination
  paginatedObjects: Object[] = [];  // Objets de la page actuelle

  isNightMode: boolean = false; 
  constructor(private objectService: ObjectService) {}

  ngOnInit() {
    this.getObjects();
  }

  getObjects() {
    // Souscription à l'Observable pour récupérer la liste des objets
    this.objectService.getObjects().subscribe(
      (data: Object[]) => {
        this.objects = data;  // Met à jour la liste des objets
        this.paginateObjects();  // Recalcule la pagination après avoir récupéré les objets
      },
      (error) => {
        console.error('Erreur lors de la récupération des objets', error);  // Gestion des erreurs
      }
    );
  }

  paginateObjects() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedObjects = this.objects.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.objects.length / this.itemsPerPage);
  }

  addObject() {
    if (this.newObject.name && this.newObject.type && this.newObject.description && this.newObject.status) {
      this.objectService.addObject(this.newObject).subscribe(
        () => {
          this.getObjects();  // Rafraîchir la liste des objets après l'ajout
          this.newObject = { id: 0, name: '', type: '', description: '', status: '' };  // Réinitialiser le formulaire
        },
        (error) => {
          console.error('Erreur lors de l\'ajout de l\'objet', error);  // Gestion des erreurs
        }
      );
    } else {
      alert('Veuillez remplir tous les champs');
    }
  }

  editObject(object: Object) {
    this.editingObject = { ...object };  // Cloner l'objet pour éviter la référence directe
  }

  updateObject() {
    if (this.editingObject && this.editingObject.name && this.editingObject.type && this.editingObject.description && this.editingObject.status) {
      this.objectService.updateObject(this.editingObject.id, this.editingObject).subscribe(
        () => {
          this.getObjects();  // Rafraîchir la liste des objets après la mise à jour
          this.editingObject = null;  // Réinitialiser le formulaire
        },
        (error) => {
          console.error('Erreur lors de la mise à jour de l\'objet', error);  // Gestion des erreurs
        }
      );
    } else {
      alert('Veuillez remplir tous les champs');
    }
  }

  deleteObject(objectId: number) {
    if (confirm('Voulez-vous vraiment supprimer cet objet ?')) {
      this.objectService.deleteObject(objectId).subscribe(
        () => {
          this.getObjects();  // Rafraîchir la liste des objets après la suppression
        },
        (error) => {
          console.error('Erreur lors de la suppression de l\'objet', error);  // Gestion des erreurs
        }
      );
    }
  }

  filterObjects() {
    // Filtre les objets en fonction du terme de recherche
    if (this.searchTerm) {
      this.objects = this.objects.filter(object => 
        object.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        object.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.getObjects();
    }
    this.paginateObjects();  // Recalcule la pagination après le filtrage
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateObjects();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateObjects();
    }
  }

  onItemsPerPageChange() {
    this.currentPage = 1;  // Réinitialise à la première page
    this.paginateObjects();  // Recalcule la pagination
  }
  
  toggleMode(): void {
    this.isNightMode = !this.isNightMode;  // Inverse la valeur de isNightMode
  }
  
  affecterProduit(objet: any) {
    // Par exemple : ouvrir une modale ou rediriger vers une page
    console.log('Affecter produit à :', objet);
  }
  

}
