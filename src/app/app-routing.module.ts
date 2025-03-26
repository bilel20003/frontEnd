import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/Client/home/home.component';
import { DemandeRendezvousComponent } from './components/Client/demande-rendezvous/demande-rendezvous.component';
import { VoirRendezvousComponent } from './components/Client/voir-rendezvous/voir-rendezvous.component';
import { DemandeTravauxComponent } from './components/Client/demande-travaux/demande-travaux.component';
import { ReclamationComponent } from './components/Client/reclamation/reclamation.component';
import { RenseignerAvancementComponent } from './components/Technicien/renseigner-avancement/renseigner-avancement.component';

import { GererRdvComponent } from './components/Guichetier/gerer-rdv/gerer-rdv.component';
import { TechHomeComponent } from './components/Technicien/tech-home/tech-home.component';
import { TechDetailsComponent } from './components/Technicien/tech-details/tech-details.component';
import { GuiHomeComponent } from './components/Guichetier/gui-home/gui-home.component';
import { GuiRequestDetailsComponent } from './components/Guichetier/gui-request-details/gui-request-details.component';
import { SignupComponent } from './components/signup/signup.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirection vers Login
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  //client
  { path: 'client-home', component: HomeComponent },
  { path: 'request-appointment', component: DemandeRendezvousComponent },
  { path: 'view-appointments', component: VoirRendezvousComponent } ,
  { path: 'request-work', component: DemandeTravauxComponent },
  { path: 'reclamation', component: ReclamationComponent },
  //tech
  { path: 'tech-details/:id', component: TechDetailsComponent },
  { path: 'renseigner-avancement/:id', component: RenseignerAvancementComponent},
  { path: 'tech-home', component: TechHomeComponent  } ,
  //guichetier
  { path: 'gerer-rdv', component: GererRdvComponent },
  { path: 'gui-home', component: GuiHomeComponent },
  { path: 'request-details/:id', component: GuiRequestDetailsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
