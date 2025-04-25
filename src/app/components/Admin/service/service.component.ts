import { Component, OnInit } from '@angular/core';
import { ServiceService } from 'src/app/services/service.service';
import { Servicee } from 'src/app/models/service.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.css']
})
export class ServiceComponent implements OnInit {
  services: Servicee[] = [];
  errorMessage: string | null = null;
  isModalOpen: boolean = false;
  editingService: Servicee | null = null;
  serviceForm: Servicee = {
    id: 0,
    nomService: '',
    ministere: { id: 0 }
  };

  constructor(private serviceService: ServiceService) {}

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    this.serviceService.getAllServices().subscribe({
      next: (services: Servicee[]) => {
        this.services = services;
        this.errorMessage = null;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des services:', err);
        this.errorMessage = 'Impossible de charger les services. Veuillez vérifier votre connexion ou vos permissions.';
        this.services = [];
      }
    });
  }

  openModal(service: Servicee | null = null) {
    this.isModalOpen = true;
    if (service) {
      this.editingService = service;
      this.serviceForm = { ...service };
    } else {
      this.editingService = null;
      this.serviceForm = {
        id: 0,
        nomService: '',
        ministere: { id: 0 }
      };
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingService = null;
    this.serviceForm = {
      id: 0,
      nomService: '',
      ministere: { id: 0 }
    };
  }

  addService() {
    if (!this.serviceForm.nomService || !this.serviceForm.ministere.id) {
      alert('Veuillez remplir tous les champs obligatoires (Nom du service, Ministère).');
      return;
    }
    this.serviceService.addNewService(this.serviceForm).subscribe({
      next: () => {
        console.log('Service ajouté');
        this.loadServices();
        this.closeModal();
        this.errorMessage = null;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors de l\'ajout du service:', err);
        this.errorMessage = 'Erreur lors de l\'ajout du service. Veuillez vérifier vos permissions ou les données saisies.';
      }
    });
  }

  updateService() {
    if (!this.serviceForm.nomService || !this.serviceForm.ministere.id) {
      alert('Veuillez remplir tous les champs obligatoires (Nom du service, Ministère).');
      return;
    }
    this.serviceService.updateService(this.serviceForm.id, this.serviceForm).subscribe({
      next: () => {
        console.log('Service mis à jour');
        this.loadServices();
        this.closeModal();
        this.errorMessage = null;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors de la mise à jour du service:', err);
        this.errorMessage = 'Erreur lors de la mise à jour du service. Veuillez vérifier vos permissions ou les données saisies.';
      }
    });
  }

  deleteService(id: number) {
    if (confirm('Voulez-vous vraiment supprimer ce service ?')) {
      this.serviceService.deleteService(id).subscribe({
        next: () => {
          console.log('Service supprimé');
          this.loadServices();
          this.errorMessage = null;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur lors de la suppression du service:', err);
          this.errorMessage = 'Erreur lors de la suppression du service. Veuillez vérifier vos permissions.';
        }
      });
    }
  }
}