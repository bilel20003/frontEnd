import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';


import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/Client/home/home.component';
import { FormsModule } from '@angular/forms';
import { DemandeRendezvousComponent } from './components/Client/demande-rendezvous/demande-rendezvous.component';
import { VoirRendezvousComponent } from './components/Client/voir-rendezvous/voir-rendezvous.component';
import { DemandeTravauxComponent } from './components/Client/demande-travaux/demande-travaux.component';
import { NavbarComponent } from './components/Client/navbar/navbar.component';
import { ReclamationComponent } from './components/Client/reclamation/reclamation.component';

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
import { SignupComponent } from './components/signup/signup.component';




@NgModule({
  declarations: [
    // other components
    
    AppComponent,
    LoginComponent,
    HomeComponent,
    DemandeRendezvousComponent,
    VoirRendezvousComponent,
    DemandeTravauxComponent,
    NavbarComponent,
    ReclamationComponent,
    
    RenseignerAvancementComponent,
    TechNavComponent,
    GuiNavComponent,

    GererRdvComponent,
 
  
    TechHomeComponent,
    TechDetailsComponent,
    GuiHomeComponent,
    GuiRequestDetailsComponent,
    SignupComponent,
   
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    NgxPaginationModule,
    BrowserAnimationsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
