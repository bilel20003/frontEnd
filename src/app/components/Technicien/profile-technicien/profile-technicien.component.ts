import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { UserInfoService } from 'src/app/services/user-info.service';
import { Router } from '@angular/router';
import { Servicee } from 'src/app/models/service.model';
@Component({
  selector: 'app-profile-technicien',
  templateUrl: './profile-technicien.component.html',
  styleUrls: ['./profile-technicien.component.css']
})
export class ProfileTechnicienComponent  implements OnInit {
  userInfo: any;
  editionActive = false;

  nouveauMotDePasse = '';
  confirmationMotDePasse = '';
  ancienMotDePasse = '';
  popupVisible = false;
  serviceId!: number;
  ministereId!: number;
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
          this.userInfo = data;
          // Sauvegarde des IDs
          this.serviceId = data.service?.id;
          (this.userInfo.service as Servicee).ministere.id
        },
        (error) => {
          console.error('Erreur lors de la récupération des infos utilisateur', error);
        }
      );
    }
  }
  

  enregistrerModifications(): void {
    // Vérifie que le service est bien défini
    if (!this.userInfo.service || !this.userInfo.service.id) {
      console.error("Service ID is undefined");
      alert("Erreur : Le service de l'utilisateur est manquant.");
      return;
    }
  
    // Nettoyer l'objet service pour ne pas envoyer le ministre (s’il n’est pas attendu)
    const cleanedService: Servicee = {
      id: this.userInfo.service.id,
      nomService: this.userInfo.service.nomService,
      ministere: {
        id: this.userInfo.service.ministere.id
      }
    };
  
    // Mettre à jour le service nettoyé dans userInfo avant l’envoi
    this.userInfo.service = cleanedService;
  
    this.userInfoService.updateUser(this.userInfo.id, this.userInfo).subscribe({
      next: () => alert('Profil mis à jour avec succès.'),
      error: (err) => {
        console.error("Erreur lors de la mise à jour :", err);
        alert("Erreur lors de la mise à jour du profil.");
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

    // ici tu peux aussi valider que `ancienMotDePasse` est correct si nécessaire

    this.userInfoService.changePassword(this.userInfo.id, this.nouveauMotDePasse).subscribe({
      next: () => {
        alert('Mot de passe mis à jour avec succès.');
        this.popupVisible = false;
        this.nouveauMotDePasse = '';
        this.ancienMotDePasse = '';
        this.confirmationMotDePasse = '';
      },
      error: () => {
        alert('Erreur lors de la mise à jour du mot de passe.');
      }
    });
  }

  retour() {
    this.router.navigate(['/chemin-precedent']); // adapte le chemin
  }
}