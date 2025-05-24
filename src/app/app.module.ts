import { LOCALE_ID, NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { FormsModule } from '@angular/forms';
import { TechNavComponent } from './components/Technicien/tech-nav/tech-nav.component';
import { GuiNavComponent } from './components/Guichetier/gui-nav/gui-nav.component';
import { MinistereService } from './services/ministere.service';
import { ProduitService } from './services/produit.service';
import { ObjetService } from './services/objet.service';
import { RoleService } from './services/role.service';
import { RequeteService } from './services/requete.service';
import { RendezvousService } from './services/rendez-vous.service';
import { UserInfoService } from './services/user-info.service';
import { DashboardService } from './services/dashboard.service';
import { TechHomeComponent } from './components/Technicien/tech-home/tech-home.component';
import { GuiHomeComponent } from './components/Guichetier/gui-home/gui-home.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './components/Client/home/home.component';
import { ReclamationComponent } from './components/Client/reclamation/reclamation.component';
import { RendezVousComponent } from './components/Client/rendez-vous/rendez-vous.component';
import { NavbarComponent } from './components/Client/navbar/navbar.component';
import { UtilisateursComponent } from './components/Admin/utilisateurs/utilisateurs.component';
import { NavbarAdminComponent } from './components/Admin/navbar-admin/navbar-admin.component';
import { ProductsComponent } from './components/Admin/product/product.component';
import { ObjetReclamationComponent } from './components/Admin/objet-reclamation/objet-reclamation.component';
import { GererRoleComponent } from './components/Admin/role/role.component';
import { MinistryManagementComponent } from './components/Admin/ministere/ministere.component';
import { ServiceComponent } from './components/Admin/service/service.component';
import { ServiceService } from './services/service.service';
import { ScheduleComponent } from './components/Admin/schedule/schedule.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FullCalendarModule } from '@fullcalendar/angular';
import { ProfileTechnicienComponent } from './components/Technicien/profile-technicien/profile-technicien.component';
import { ProfileGuichetierComponent } from './components/Guichetier/profile-guichetier/profile-guichetier.component';
import { ProfileClientComponent } from './components/Client/profile-client/profile-client.component';
import { ProfileAdminComponent } from './components/Admin/profile-admin/profile-admin.component';
import { TechRendezVousComponent } from './components/Technicien/tech-rendez-vous/tech-rendez-vous.component';
import { ArchiveComponent } from './components/Admin/archive/archive.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { NgChartsModule } from 'ng2-charts';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthInterceptor } from 'src/auth.interceptor';
import { DashboardComponent } from './components/Admin/dashboard/dashboard.component';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { RequetesAdminComponent } from './components/Admin/requetes-admin/requetes-admin.component';
import { NavbarDacaComponent } from './components/Daca/nav-daca/nav-daca.component';
import { ProfileDacaComponent } from './components/Daca/profile-daca/profile-daca.component';

registerLocaleData(localeFr);

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    TechNavComponent,
    GuiNavComponent,
    TechHomeComponent,
    GuiHomeComponent,
    HomeComponent,
    ReclamationComponent,
    RendezVousComponent,
    NavbarComponent,
    UtilisateursComponent,
    NavbarAdminComponent,
    ProductsComponent,
    ObjetReclamationComponent,
    GererRoleComponent,
    MinistryManagementComponent,
    ServiceComponent,
    ScheduleComponent,
    ProfileTechnicienComponent,
    ProfileGuichetierComponent,
    ProfileClientComponent,
    ProfileAdminComponent,
    TechRendezVousComponent,
    ArchiveComponent,
    ResetPasswordComponent,
    DashboardComponent,
    RequetesAdminComponent,
    NavbarDacaComponent,
    ProfileDacaComponent
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
    FullCalendarModule,
    NgChartsModule,
    CommonModule,
    MatSnackBarModule
  ],
  providers: [
    MinistereService,
    ProduitService,
    ObjetService,
    RoleService,
    ServiceService,
    RequeteService,
    RendezvousService,
    UserInfoService,
    DashboardService,
    { provide: LOCALE_ID, useValue: 'fr' },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}