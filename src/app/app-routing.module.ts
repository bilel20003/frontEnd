import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';  // Adjust the path according to your file structure


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


import { GererRdvComponent } from './components/Guichetier/gerer-rdv/gerer-rdv.component';
import { TechHomeComponent } from './components/Technicien/tech-home/tech-home.component';

import { GuiHomeComponent } from './components/Guichetier/gui-home/gui-home.component';

//admin 
import { UtilisateursComponent } from './components/Admin/utilisateurs/utilisateurs.component';
import { NavbarAdminComponent } from './components/Admin/navbar-admin/navbar-admin.component';
import { DashboardComponent } from './components/Admin/dashboard/dashboard.component';
import { ProductsComponent } from './components/Admin/product/product.component';

import { ObjetReclamationComponent } from './components/Admin/objet-reclamation/objet-reclamation.component';
import { GererRoleComponent } from './components/Admin/role/role.component';
import { MinistryManagementComponent } from './components/Admin/ministere/ministere.component';
import { ClientManagementComponent } from './components/Admin/client/client.component';

import { HoraireComponent } from './components/Admin/horaire/horaire.component';
import { ServiceComponent } from './components/Admin/service/service.component';


const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // Admin routes (protected by AuthGuard and role-based authorization)
  { path: 'utilisateurs', component: UtilisateursComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },
  { path: 'navbar-admin', component: NavbarAdminComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },
  { path: 'product', component: ProductsComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },
  { path: 'objet-reclamation', component: ObjetReclamationComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },
  { path: 'role', component: GererRoleComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },
  { path: 'ministere', component: MinistryManagementComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },
  { path: 'service', component: ServiceComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },
  { path: 'client', component: ClientManagementComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },
  { path: 'horaire', component: HoraireComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },

  // Client routes (protected by AuthGuard)
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard], data: { role: 'CLIENT' }  },
  { path: 'rendez-vous', component: RendezVousComponent, canActivate: [AuthGuard] , data: { role: 'CLIENT' } },
  { path: 'navbar', component: NavbarComponent, canActivate: [AuthGuard], data: { role: 'CLIENT' }  },
  { path: 'reclamation', component: ReclamationComponent, canActivate: [AuthGuard] , data: { role: 'CLIENT' } },
  { path: 'detail-demande/:id', component: DetailDemandeComponent, canActivate: [AuthGuard], data: { role: 'CLIENT' }  },
  { path: 'recherche', component: PageRechercheComponent, canActivate: [AuthGuard] , data: { role: 'CLIENT' } },
  { path: 'recherche-avancee', component: PageRechercheAvanceeComponent, canActivate: [AuthGuard] , data: { role: 'CLIENT' } },
  { path: 'documents', component: DocumentsComponent, canActivate: [AuthGuard] , data: { role: 'CLIENT' } },

  // Technicien routes
  { path: 'renseigner-avancement/:id', component: RenseignerAvancementComponent, canActivate: [AuthGuard] , data: { role: 'TECHNICIEN' } },
  { path: 'tech-home', component: TechHomeComponent, canActivate: [AuthGuard] , data: { role: 'TECHNICIEN' }},

  // Guichetier routes
  { path: 'gerer-rdv', component: GererRdvComponent, canActivate: [AuthGuard] , data: { role: 'GUICHETIER' }},
  { path: 'gui-home', component: GuiHomeComponent, canActivate: [AuthGuard], data: { role: 'GUICHETIER' } },

  // Redirection des routes inconnues
];



@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
