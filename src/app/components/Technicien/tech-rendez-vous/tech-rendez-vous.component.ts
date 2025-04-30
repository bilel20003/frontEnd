import { Component, OnInit } from '@angular/core';
import { RendezvousService } from 'src/app/services/rendez-vous.service';
import { Rdv } from 'src/app/models/rendez-vous.model';
import { jwtDecode } from 'jwt-decode';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-tech-rendez-vous',
  templateUrl: './tech-rendez-vous.component.html',
  styleUrls: ['./tech-rendez-vous.component.css']
})
export class TechRendezVousComponent implements OnInit {
  rendezvous: Rdv[] = [];
  filteredRendezvous: Rdv[] = [];
  searchTerm: string = '';
  isNightMode: boolean = false;
  technicienId: number | null = null;
  errorMessage: string | null = null;
  isModalOpen: boolean = false;
  selectedRdv: Rdv | null = null;
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
        status: rdv.status
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
          this.getRendezvous(); // Refresh calendar
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

  filterRendezvous(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredRendezvous = this.rendezvous.filter(rdv => {
      return (
        rdv.client.id.toString().includes(term) ||
        rdv.typeProbleme.toLowerCase().includes(term) ||
        rdv.status.toLowerCase().includes(term)
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