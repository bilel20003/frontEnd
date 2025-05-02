import { Component, OnInit } from '@angular/core';
import { RendezvousService } from 'src/app/services/rendez-vous.service';
import { Rdv } from 'src/app/models/rendez-vous.model';
import { jwtDecode } from 'jwt-decode';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { HttpErrorResponse } from '@angular/common/http';

declare const google: any;
declare const gapi: any;

@Component({
  selector: 'app-tech-rendez-vous',
  templateUrl: './tech-rendez-vous.component.html',
  styleUrls: ['./tech-rendez-vous.component.css']
})
export class TechRendezVousComponent implements OnInit {
  private clientId = '727799598294-le5i4ua3p823apgkdfd19osufjad6c4g.apps.googleusercontent.com';
  private discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
  private scopes = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';
  rendezvous: Rdv[] = [];
  filteredRendezvous: Rdv[] = [];
  searchTerm: string = '';
  isNightMode: boolean = false;
  technicienId: number | null = null;
  errorMessage: string | null = null;
  isModalOpen: boolean = false;
  selectedRdv: Rdv | null = null;
  accessToken: string | null = null;
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    events: [],
    eventClick: this.handleEventClick.bind(this),
    height: 'auto',
    locale: 'fr'
  };

  constructor(private rendezvousService: RendezvousService) {}

  ngOnInit(): void {
    this.getTechnicienIdFromToken();
    if (this.technicienId) {
      this.getRendezvous();
    } else {
      this.errorMessage = 'Veuillez vous connecter pour accéder à vos rendez-vous.';
    }
    if (localStorage.getItem('mode') === 'night') {
      this.toggleMode();
    }
    this.loadGapiAndGisScripts();
  }

  loadGapiAndGisScripts(): void {
    console.log('Checking for gapi and google...');
    if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
      console.log('gapi and google already loaded');
      this.initializeGapi();
    } else {
      const scripts = [
        { src: 'https://apis.google.com/js/api.js', id: 'gapi' },
        { src: 'https://accounts.google.com/gsi/client', id: 'gis' }
      ];
      scripts.forEach(script => {
        if (!document.getElementById(script.id)) {
          console.log(`Loading ${script.id} script...`);
          const scriptElement = document.createElement('script');
          scriptElement.src = script.src;
          scriptElement.async = true;
          scriptElement.id = script.id;
          scriptElement.onload = () => {
            console.log(`${script.id} script loaded`);
            if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
              this.initializeGapi();
            }
          };
          scriptElement.onerror = () => {
            console.error(`Failed to load ${script.id} script`);
            this.errorMessage = `Erreur lors du chargement de l’API ${script.id}`;
          };
          document.head.appendChild(scriptElement);
        }
      });
    }
  }

  initializeGapi(): void {
    if (typeof gapi === 'undefined') {
      console.error('gapi still not defined after script load');
      this.errorMessage = 'Erreur: API Google non disponible';
      return;
    }
    console.log('Initializing gapi client...');
    gapi.load('client', () => {
      console.log('gapi client loaded');
      gapi.client.init({
        discoveryDocs: this.discoveryDocs
      }).then(() => {
        console.log('gapi client initialized');
      }).catch((error: any) => {
        console.error('Error initializing gapi client:', error);
        this.errorMessage = `Erreur lors de l’initialisation de gapi: ${error.message || error}`;
      });
    });
  }

  stkCallback(response: any): void {
    console.log('Google Sign-In response:', response);
    if (response.credential) {
      const accessToken = response.credential;
      this.accessToken = accessToken;
      this.errorMessage = null;
      if (this.selectedRdv && this.selectedRdv.id) {
        this.generateMeetLink();
      }
    } else {
      console.error('No credential in Google Sign-In response');
      this.errorMessage = 'Erreur: Aucune information d’authentification reçue';
    }
  }

  getTechnicienIdFromToken(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.technicienId = Number(decoded.technicienId) || Number(decoded.id) || null;
        if (!this.technicienId) {
          this.errorMessage = 'Erreur: ID technicien invalide. Veuillez vous reconnecter.';
        }
      } catch (error) {
        console.error('Erreur lors du décodage du token:', error);
        this.errorMessage = 'Erreur lors de la lecture du token. Veuillez vous reconnecter.';
      }
    } else {
      this.errorMessage = 'Aucun token trouvé. Veuillez vous connecter.';
    }
  }

  getRendezvous(): void {
    if (!this.technicienId) {
      this.errorMessage = 'ID technicien manquant. Veuillez vous reconnecter.';
      return;
    }
    console.log('Fetching RDVs for technicien ID:', this.technicienId);
    this.rendezvousService.getRendezvousByTechnicien(this.technicienId).subscribe({
      next: (rendezvous) => {
        this.rendezvous = rendezvous;
        this.filteredRendezvous = [...rendezvous];
        this.loadCalendarEvents();
        this.errorMessage = null;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des rendez-vous:', err);
        this.errorMessage = err.message;
      }
    });
  }

  loadCalendarEvents(): void {
    const events: EventInput[] = this.filteredRendezvous.map(rdv => ({
      title: `${rdv.typeProbleme} (${rdv.status})`,
      start: rdv.dateSouhaitee,
      extendedProps: {
        id: rdv.id,
        clientId: rdv.client.id,
        description: rdv.description,
        status: rdv.status,
        meetLink: rdv.meetLink
      }
    }));
    this.calendarOptions = {
      ...this.calendarOptions,
      events
    };
  }

  handleEventClick(info: any): void {
    const rdvId = info.event.extendedProps.id;
    const rdv = this.filteredRendezvous.find(r => r.id === rdvId);
    if (rdv) {
      this.openModal(rdv);
    }
  }

  openModal(rdv: Rdv): void {
    this.selectedRdv = rdv;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedRdv = null;
  }

  refuseRendezvous(): void {
    if (this.selectedRdv && this.selectedRdv.id && this.technicienId) {
      this.rendezvousService.refuseRdv(this.selectedRdv.id, this.technicienId).subscribe({
        next: () => {
          this.getRendezvous();
          this.closeModal();
          this.errorMessage = null;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur lors du refus du rendez-vous:', err);
          this.errorMessage = err.message;
        }
      });
    }
  }

  generateMeetLink(): void {
    if (!this.selectedRdv || !this.selectedRdv.id) {
      console.error('No appointment selected');
      this.errorMessage = 'Aucun rendez-vous sélectionné';
      return;
    }

    if (!this.accessToken) {
      console.log('No access token, prompting Google Sign-In');
      this.promptGoogleSignIn();
      return;
    }

    console.log('Generating Meet link for RDV:', this.selectedRdv.id);
    const event = {
      summary: `Rendez-vous ID: ${this.selectedRdv.id}`,
      start: {
        dateTime: new Date(this.selectedRdv.dateSouhaitee).toISOString(),
        timeZone: 'Europe/Paris'
      },
      end: {
        dateTime: new Date(new Date(this.selectedRdv.dateSouhaitee).getTime() + 3600000).toISOString(),
        timeZone: 'Europe/Paris'
      },
      conferenceData: {
        createRequest: {
          requestId: `rdv-${this.selectedRdv.id}-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    };

    console.log('Inserting Google Calendar event:', event);
    gapi.client.setToken({ access_token: this.accessToken });
    gapi.client.calendar.events
      .insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1
      })
      .then(
        (response: any) => {
          console.log('Google Calendar event created:', response);
          const meetLink = response.result.hangoutLink;
          if (meetLink && meetLink.match(/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/)) {
            console.log('Valid Meet link generated:', meetLink);
            this.updateRdvWithMeetLink(this.selectedRdv!.id!, meetLink);
          } else {
            console.error('Invalid Meet link:', meetLink);
            this.errorMessage = 'Lien Meet invalide généré';
          }
        },
        (error: any) => {
          console.error('Error creating Meet link:', error);
          this.errorMessage = `Erreur lors de la génération du lien Meet: ${error.result?.error?.message || error.message || error}`;
        }
      )
      .catch((error: any) => {
        console.error('Unexpected error creating Meet link:', error);
        this.errorMessage = `Erreur inattendue lors de la génération du lien Meet: ${error.message || error}`;
      });
  }

  promptGoogleSignIn(): void {
    console.log('Prompting Google Sign-In...');
    google.accounts.oauth2.initTokenClient({
      client_id: this.clientId,
      scope: this.scopes,
      callback: (response: any) => {
        console.log('OAuth2 response:', response);
        if (response.access_token) {
          this.accessToken = response.access_token;
          this.errorMessage = null;
          if (this.selectedRdv && this.selectedRdv.id) {
            this.generateMeetLink();
          }
        } else {
          console.error('No access token in OAuth2 response');
          this.errorMessage = 'Erreur: Impossible d’obtenir le jeton d’accès';
        }
      }
    }).requestAccessToken();
  }

  updateRdvWithMeetLink(rdvId: number, meetLink: string): void {
    console.log('Updating RDV with Meet link:', { rdvId, meetLink });
    this.rendezvousService.updateRdv(rdvId, { meetLink }).subscribe({
      next: (updatedRdv) => {
        console.log('RDV updated successfully:', updatedRdv);
        this.selectedRdv = updatedRdv;
        const index = this.rendezvous.findIndex(r => r.id === updatedRdv.id);
        if (index !== -1) {
          this.rendezvous[index] = updatedRdv;
          this.filteredRendezvous[index] = updatedRdv;
        }
        this.loadCalendarEvents();
        this.errorMessage = null;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors de l’enregistrement du lien Meet:', err);
        this.errorMessage = err.message;
      }
    });
  }

  filterRendezvous(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredRendezvous = this.rendezvous.filter(rdv => {
      return (
        rdv.client.id.toString().includes(term) ||
        rdv.typeProbleme.toLowerCase().includes(term) ||
        rdv.status.toLowerCase().includes(term) ||
        (rdv.meetLink && rdv.meetLink.toLowerCase().includes(term))
      );
    });
    this.loadCalendarEvents();
  }

  toggleMode(): void {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
    localStorage.setItem('mode', this.isNightMode ? 'night' : 'day');
  }
}