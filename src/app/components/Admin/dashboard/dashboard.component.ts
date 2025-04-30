import { Component, OnInit } from '@angular/core';
import { RequeteService } from 'src/app/services/requete.service';
import { UserInfoService } from 'src/app/services/user-info.service';
import { ProduitService } from 'src/app/services/produit.service';
import { MinistereService } from 'src/app/services/ministere.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  stats = {
    totalUtilisateurs: 0,
    totalTechniciens: 0,
    totalReclamationsEnCours: 0,
    totalReclamationsTraitees: 0,
    totalMinisteres: 0,
    totalProduits: 0
  };

  dernieresReclamations: any[] = [];

  constructor(
    private userService: UserInfoService,
    private reclamationService: RequeteService,
    private produitService: ProduitService,
    private ministereService: MinistereService
  ) {}

  ngOnInit(): void {
    this.chargerStatistiques();
    this.chargerDernieresReclamations();
  }

  chargerStatistiques(): void {
    this.userService.getAllUsers().subscribe(users => {
      this.stats.totalUtilisateurs = users.length;
      this.stats.totalTechniciens = users.filter(u => u.role === 'technicien').length;
    });

    this.reclamationService.getAllRequetes().subscribe(recs => {
      this.stats.totalReclamationsEnCours = recs.filter(r => r.etat === 'EN_COURS').length;
      this.stats.totalReclamationsTraitees = recs.filter(r => r.etat === 'TRAITE').length;
    });

    this.produitService.getAllProduits().subscribe(produits => {
      this.stats.totalProduits = produits.length;
    });

    this.ministereService.getAllMinisteres().subscribe(ministeres => {
      this.stats.totalMinisteres = ministeres.length;
    });
  }

  chargerDernieresReclamations(): void {
    this.reclamationService.getAllRequetes().subscribe(recs => {
      this.dernieresReclamations = recs.slice(-5).reverse();
    });
  }
}
