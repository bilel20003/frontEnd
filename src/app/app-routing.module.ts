import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';

import { RenseignerAvancementComponent } from './components/Technicien/renseigner-avancement/renseigner-avancement.component';
//client
import { NavbarComponent } from './components/Client/navbar/navbar.component';
import { DetailDemandeComponent } from './components/Client/detail-demande/detail-demande.component';
import { DocumentsComponent } from './components/Client/document/document.component';
import { HomeComponent } from './components/Client/home/home.component';
import { PageRechercheComponent } from './components/Client/recherche/recherche.component';
import { PageRechercheAvanceeComponent } from './components/Client/recherche-avancee/recherche-avancee.component';
import { ReclamationComponent } from './components/Client/reclamation/reclamation.component';
import { RendezVousComponent } from './components/Client/rendez-vous/rendez-vous.component';
import { RendezVousDetailComponent } from './components/Client/rendez-vous/rendezvous-detail/rendezvous-detail.component';

import { GererRdvComponent } from './components/Guichetier/gerer-rdv/gerer-rdv.component';
import { TechHomeComponent } from './components/Technicien/tech-home/tech-home.component';
import { TechDetailsComponent } from './components/Technicien/tech-details/tech-details.component';
import { GuiHomeComponent } from './components/Guichetier/gui-home/gui-home.component';
import { GuiRequestDetailsComponent } from './components/Guichetier/gui-request-details/gui-request-details.component';


const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, 
  { path: 'login', component: LoginComponent },
  
  
  // Client
  { path: 'home', component: HomeComponent },
  { 
    path: 'rendez-vous', 
    component: RendezVousComponent, 
    children: [
      { path: 'rendezvous-detail', component: RendezVousDetailComponent }
    ]
  },
  { path: 'navbar', component: NavbarComponent },
  { path: 'reclamation', component: ReclamationComponent },
  { path: 'detail-demande/:id', component: DetailDemandeComponent },
  { path: 'recherche', component: PageRechercheComponent },
  { path: 'recherche-avancee', component: PageRechercheAvanceeComponent },
  { path: 'documents', component: DocumentsComponent },

  // Technicien
  { path: 'tech-details/:id', component: TechDetailsComponent },
  { path: 'renseigner-avancement/:id', component: RenseignerAvancementComponent},
  { path: 'tech-home', component: TechHomeComponent },

  // Guichetier
  { path: 'gerer-rdv', component: GererRdvComponent },
  { path: 'gui-home', component: GuiHomeComponent },
  { path: 'request-details/:id', component: GuiRequestDetailsComponent },

  // Redirection des routes inconnues
  
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
