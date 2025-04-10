import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';


import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';

import { FormsModule } from '@angular/forms';

import { RenseignerAvancementComponent } from './components/Technicien/renseigner-avancement/renseigner-avancement.component';
import { TechNavComponent } from './components/Technicien/tech-nav/tech-nav.component';
import { GuiNavComponent } from './components/Guichetier/gui-nav/gui-nav.component';

import { GererRdvComponent } from './components/Guichetier/gerer-rdv/gerer-rdv.component';


import { TechHomeComponent } from './components/Technicien/tech-home/tech-home.component';
import { TechDetailsComponent } from './components/Technicien/tech-details/tech-details.component';
import { GuiHomeComponent } from './components/Guichetier/gui-home/gui-home.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GuiRequestDetailsComponent } from './components/Guichetier/gui-request-details/gui-request-details.component';

//client

import { DetailDemandeComponent } from './components/Client/detail-demande/detail-demande.component';
import { DocumentsComponent } from './components/Client/document/document.component';
import { HomeComponent } from './components/Client/home/home.component';
import { PageRechercheComponent } from './components/Client/recherche/recherche.component';
import { PageRechercheAvanceeComponent } from './components/Client/recherche-avancee/recherche-avancee.component';
import { ReclamationComponent } from './components/Client/reclamation/reclamation.component';
import { RendezVousComponent } from './components/Client/rendez-vous/rendez-vous.component';
import { RendezVousDetailComponent } from './components/Client/rendez-vous/rendezvous-detail/rendezvous-detail.component';
import { NavbarComponent } from './components/Client/navbar/navbar.component';

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




@NgModule({
  declarations: [
    // other components
    
    AppComponent,
    LoginComponent,
    
  
    
    RenseignerAvancementComponent,
    TechNavComponent,
    GuiNavComponent,

    GererRdvComponent,
 
  
    TechHomeComponent,
    TechDetailsComponent,
    GuiHomeComponent,
    GuiRequestDetailsComponent,
  

    DetailDemandeComponent,
    DocumentsComponent,
    HomeComponent,
    PageRechercheComponent,
    PageRechercheAvanceeComponent,
    ReclamationComponent,
    RendezVousComponent,
    RendezVousDetailComponent,
    NavbarComponent,
    //admin
    UtilisateursComponent,
    NavbarAdminComponent,
    DashboardComponent,
    ProductsComponent,
  
    ObjetReclamationComponent,
    GererRoleComponent,
    MinistryManagementComponent,
    ClientManagementComponent,
  
    HoraireComponent,
   
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    NgxPaginationModule,
    BrowserAnimationsModule,
    HttpClientModule,
   
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
