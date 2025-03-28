import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RendezVousService } from '../rendezvous-detail.service';

@Component({
  selector: 'app-rendezvous-detail',
  templateUrl: './rendezvous-detail.component.html',
  styleUrls: ['./rendezvous-detail.component.css']
})
export class RendezVousDetailComponent implements OnInit {
  rendezVousForm: FormGroup;
  rendezVousList: any[] = []; // Liste des rendez-vous

  constructor(private fb: FormBuilder, private router: Router, private rendezVousService: RendezVousService) {
    this.rendezVousForm = this.fb.group({
     
      typeProbleme: ['', Validators.required],
      date: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Écoutez les changements dans le service
    this.rendezVousService.currentRendezVous.subscribe(rendezVous => {
      this.rendezVousList = rendezVous; // Mettez à jour la liste des rendez-vous
    });
  }

  onSubmit() {
    if (this.rendezVousForm.valid) {
      const newRendezVous = {
        ...this.rendezVousForm.value,
        etat: 'En attente' // État par défaut
      };
      this.rendezVousService.addRendezVous(newRendezVous); // Utilisation du service
      this.rendezVousForm.reset(); // Réinitialiser le formulaire après ajout
    } else {
      console.log('Le formulaire est invalide');
    }
  }

  onCancel() {
    this.rendezVousForm.reset(); // Réinitialiser le formulaire
  }
}