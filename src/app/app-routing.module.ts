import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';  // Adjust the path according to your file structure


//client
import { NavbarComponent } from './components/Client/navbar/navbar.component';
import { DocumentsComponent } from './components/Client/document/document.component';
import { HomeComponent } from './components/Client/home/home.component';
import { ReclamationComponent } from './components/Client/reclamation/reclamation.component';
import { RendezVousComponent } from './components/Client/rendez-vous/rendez-vous.component';
import { ProfileClientComponent } from './components/Client/profile-client/profile-client.component';

import { TechHomeComponent } from './components/Technicien/tech-home/tech-home.component';
import { ProfileTechnicienComponent } from './components/Technicien/profile-technicien/profile-technicien.component';
import { GuiHomeComponent } from './components/Guichetier/gui-home/gui-home.component';
import { ProfileGuichetierComponent } from './components/Guichetier/profile-guichetier/profile-guichetier.component';
//admin 
import { ProfileAdminComponent } from './components/Admin/profile-admin/profile-admin.component';
import { UtilisateursComponent } from './components/Admin/utilisateurs/utilisateurs.component';
import { NavbarAdminComponent } from './components/Admin/navbar-admin/navbar-admin.component';
import { DashboardComponent } from './components/Admin/dashboard/dashboard.component';
import { ProductsComponent } from './components/Admin/product/product.component';

import { ObjetReclamationComponent } from './components/Admin/objet-reclamation/objet-reclamation.component';
import { GererRoleComponent } from './components/Admin/role/role.component';
import { MinistryManagementComponent } from './components/Admin/ministere/ministere.component';

import { ServiceComponent } from './components/Admin/service/service.component';
import { ScheduleComponent } from './components/Admin/schedule/schedule.component';
import { TechRendezVousComponent } from './components/Technicien/tech-rendez-vous/tech-rendez-vous.component';


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
  { path: 'profile-admin', component: ProfileAdminComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },
  { path: 'schedule', component: ScheduleComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },

  // Client routes (protected by AuthGuard)
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard], data: { role: 'CLIENT' }  },
  { path: 'rendez-vous', component: RendezVousComponent, canActivate: [AuthGuard] , data: { role: 'CLIENT' } },
  { path: 'navbar', component: NavbarComponent, canActivate: [AuthGuard], data: { role: 'CLIENT' }  },
  { path: 'reclamation', component: ReclamationComponent, canActivate: [AuthGuard] , data: { role: 'CLIENT' } },
  { path: 'documents', component: DocumentsComponent, canActivate: [AuthGuard] , data: { role: 'CLIENT' } },
  { path: 'profile-client', component:  ProfileClientComponent, canActivate: [AuthGuard] , data: { role: 'CLIENT' } },
  // Technicien routes
  { path: 'tech-home', component: TechHomeComponent, canActivate: [AuthGuard] , data: { role: 'TECHNICIEN' }},
  { path: 'profile-technicien', component: ProfileTechnicienComponent, canActivate: [AuthGuard] , data: { role: 'TECHNICIEN' }},
  { path: 'tech_rendezvous', component: TechRendezVousComponent, canActivate: [AuthGuard] , data: { role: 'TECHNICIEN' }},
  // Guichetier routes
  { path: 'gui-home', component: GuiHomeComponent, canActivate: [AuthGuard], data: { role: 'GUICHETIER' } },
  { path: 'profile-guichetier', component: ProfileGuichetierComponent, canActivate: [AuthGuard], data: { role: 'GUICHETIER' } },
  // Redirection des routes inconnues
];



@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }