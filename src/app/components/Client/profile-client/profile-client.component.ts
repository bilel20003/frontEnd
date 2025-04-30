import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { UserInfoService, UserDisplay } from 'src/app/services/user-info.service';
import { Router } from '@angular/router';
import { Servicee } from 'src/app/models/service.model';
import { Role } from 'src/app/models/role.model';
import { Produit } from 'src/app/models/produit.model';
import { Ministere } from 'src/app/models/ministere.model';

// Interface temporaire pour les données brutes de l'API
interface ApiUserInfo {
  id: number;
  name: string;
  email: string;
  status: string;
  role: { id: number; name: string };
  service: { id: number; nomService: string; ministere: { id: number; nomMinistere?: string; archiver: boolean }; archiver: boolean };
  produit: { id: number; nom: string; description: string; topologie: string; prix: number; archiver: boolean };
}

// Interface pour userInfo, alignée avec le template
interface UserProfile {
  id: number;
  name: string;
  email: string;
  status: string;
  role: Role; // { id: number, name: string }
  service: Servicee; // { id: number, nomService: string, ministere: { id: number, nomMinistere?: string } }
  produit: Produit; // { id: number, nom: string, description: string, topologie: string, prix: number }
}

@Component({
  selector: 'app-profile-client',
  templateUrl: './profile-client.component.html',
  styleUrls: ['./profile-client.component.css']
})
export class ProfileClientComponent implements OnInit {
  userInfo!: UserProfile;
  editionActive = false;
  nouveauMotDePasse = '';
  confirmationMotDePasse = '';
  ancienMotDePasse = '';
  popupVisible = false;
  serviceId?: number;
  ministereId?: number;

  constructor(
    private authService: AuthService,
    private userInfoService: UserInfoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const decodedToken = this.authService.decodeToken();
    const id = decodedToken?.id;

    if (id) {
      this.userInfoService.getUserById(id).subscribe(
        (data) => {
          const apiData = data as unknown as ApiUserInfo;
          console.log('User data received:', apiData);
          this.userInfo = {
            id: apiData.id,
            name: apiData.name,
            email: apiData.email,
            status: apiData.status,
            role: { id: apiData.role.id, name: apiData.role.name },
            service: {
              id: apiData.service.id,
              nomService: apiData.service.nomService,
              ministere: {
                id: apiData.service.ministere.id,
                nomMinistere: apiData.service.ministere.nomMinistere
              }
            },
            produit: {
              id: apiData.produit.id,
              nom: apiData.produit.nom,
              description: apiData.produit.description,
              topologie: apiData.produit.topologie,
              prix: apiData.produit.prix
            }
          };
          this.serviceId = apiData.service.id;
          this.ministereId = apiData.service.ministere.id;
          console.log('serviceId:', this.serviceId, 'ministereId:', this.ministereId);
        },
        (error) => {
          console.error('Erreur lors de la récupération des infos utilisateur', error);
          alert('Impossible de charger les informations du profil.');
        }
      );
    } else {
      console.error('No user ID found in token');
      this.router.navigate(['/login']);
    }
  }

  enregistrerModifications(): void {
    const userToUpdate: UserDisplay = {
      id: this.userInfo.id,
      nom: this.userInfo.name,
      email: this.userInfo.email,
      role: this.userInfo.role.name,
      ministere: this.userInfo.service.ministere.nomMinistere || 'N/A',
      service: this.userInfo.service.nomService,
      produitId: this.userInfo.produit.id,
      serviceId: this.userInfo.service.id,
      password: undefined,
      status: this.userInfo.status
    };

    console.log('Sending update user:', userToUpdate);

    this.userInfoService.updateUser(this.userInfo.id, userToUpdate).subscribe({
      next: () => {
        alert('Profil mis à jour avec succès.');
        this.editionActive = false;
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour :', err);
        alert('Erreur lors de la mise à jour du profil : ' + err.message);
      }
    });
  }

  ouvrirPopupMotDePasse() {
    this.popupVisible = true;
  }

  changerMotDePasse() {
    if (this.nouveauMotDePasse !== this.confirmationMotDePasse) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }

    this.userInfoService.changePassword(this.userInfo.id, this.nouveauMotDePasse).subscribe({
      next: () => {
        alert('Mot de passe mis à jour avec succès.');
        this.popupVisible = false;
        this.nouveauMotDePasse = '';
        this.ancienMotDePasse = '';
        this.confirmationMotDePasse = '';
      },
      error: (err) => {
        console.error('Erreur lors du changement de mot de passe :', err);
        alert('Erreur lors de la mise à jour du mot de passe : ' + err.message);
      }
    });
  }

  retour() {
    this.router.navigate(['/home']);
  }
}