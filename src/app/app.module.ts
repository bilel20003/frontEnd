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
import { MinistereService } from './services/ministere.service';
import { ProduitService } from './services/produit.service';
import { ObjetService } from './services/objet.service';
import { RoleService } from './services/role.service';
import { RequeteService } from './services/requete.service';
import { TechHomeComponent } from './components/Technicien/tech-home/tech-home.component';
import { GuiHomeComponent } from './components/Guichetier/gui-home/gui-home.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DetailDemandeComponent } from './components/Client/detail-demande/detail-demande.component';
import { DocumentsComponent } from './components/Client/document/document.component';
import { HomeComponent } from './components/Client/home/home.component';
import { PageRechercheComponent } from './components/Client/recherche/recherche.component';
import { PageRechercheAvanceeComponent } from './components/Client/recherche-avancee/recherche-avancee.component';
import { ReclamationComponent } from './components/Client/reclamation/reclamation.component';
import { RendezVousComponent } from './components/Client/rendez-vous/rendez-vous.component';
import { NavbarComponent } from './components/Client/navbar/navbar.component';
import { UtilisateursComponent } from './components/Admin/utilisateurs/utilisateurs.component';
import { NavbarAdminComponent } from './components/Admin/navbar-admin/navbar-admin.component';
import { DashboardComponent } from './components/Admin/dashboard/dashboard.component';
import { ProductsComponent } from './components/Admin/product/product.component';
import { ObjetReclamationComponent } from './components/Admin/objet-reclamation/objet-reclamation.component';
import { GererRoleComponent } from './components/Admin/role/role.component';
import { MinistryManagementComponent } from './components/Admin/ministere/ministere.component';
import { ServiceComponent } from './components/Admin/service/service.component';
import { ServiceService } from './services/service.service';
import { ScheduleComponent } from './components/Admin/schedule/schedule.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FullCalendarModule } from '@fullcalendar/angular';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RenseignerAvancementComponent,
    TechNavComponent,
    GuiNavComponent,
    TechHomeComponent,
    GuiHomeComponent,
    DetailDemandeComponent,
    DocumentsComponent,
    HomeComponent,
    PageRechercheComponent,
    PageRechercheAvanceeComponent,
    ReclamationComponent,
    RendezVousComponent,
    NavbarComponent,
    UtilisateursComponent,
    NavbarAdminComponent,
    DashboardComponent,
    ProductsComponent,
    ObjetReclamationComponent,
    GererRoleComponent,
    MinistryManagementComponent,
    ServiceComponent,
    ScheduleComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    NgxPaginationModule,
    BrowserAnimationsModule,
    HttpClientModule,
    NgbModule,
    FullCalendarModule
  ],
  providers: [
    MinistereService,
    ProduitService,
    ObjetService,
    RoleService,
    ServiceService,
    RequeteService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}