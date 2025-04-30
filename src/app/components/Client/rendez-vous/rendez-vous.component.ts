import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RendezvousService } from 'src/app/services/rendez-vous.service';
import { ScheduleService } from '../../../services/schedule.service';
import { Rdv, RdvCreate } from '../../../models/rendez-vous.model';
import { jwtDecode } from 'jwt-decode';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import '@fullcalendar/core';
import '@fullcalendar/daygrid';
import '@fullcalendar/timegrid';
import '@fullcalendar/list';

@Component({
  selector: 'app-rendez-vous',
  templateUrl: './rendez-vous.component.html',
  styleUrls: ['./rendez-vous.component.css']
})
export class RendezVousComponent implements OnInit {
  rendezvousForm: FormGroup;
  rendezvous: Rdv[] = [];
  isNightMode: boolean = false;
  isModalOpen: boolean = false;
  availableSlots: string[] = [];
  clientId: number | null = null;
  errorMessage: string | null = null;
  minDate: string; // Minimum date for picker (tomorrow)
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

  constructor(
    private fb: FormBuilder,
    private rendezvousService: RendezvousService,
    private scheduleService: ScheduleService
  ) {
    // Set minDate to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDate = tomorrow.toISOString().split('T')[0];

    this.rendezvousForm = this.fb.group({
      dateSouhaitee: ['', Validators.required],
      timeSlot: ['', Validators.required],
      typeProbleme: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    this.getClientIdFromToken();
    if (this.clientId) {
      this.getRendezvous();
    } else {
      console.warn('No client ID found. Please log in.');
      this.errorMessage = 'Veuillez vous connecter pour accéder à vos rendez-vous.';
    }
  }

  getClientIdFromToken() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        console.log('Decoded JWT:', decoded);
        this.clientId = Number(decoded.clientId) || Number(decoded.id) || null;
        if (!this.clientId) {
          console.error('No numeric clientId found in token. Found:', decoded);
          this.errorMessage = 'Erreur: ID client invalide. Veuillez vous reconnecter.';
        }
      } catch (error) {
        console.error('Error decoding JWT:', error);
        this.errorMessage = 'Erreur lors de la lecture du token. Veuillez vous reconnecter.';
      }
    } else {
      console.warn('No token found in localStorage');
      this.errorMessage = 'Aucun token trouvé. Veuillez vous connecter.';
    }
  }

  getRendezvous() {
    if (!this.clientId) {
      this.errorMessage = 'Client ID manquant. Veuillez vous reconnecter.';
      return;
    }
    console.log('Fetching RDVs for client ID:', this.clientId);
    this.rendezvousService.getRendezvousByClient(this.clientId).subscribe({
      next: (rendezvous) => {
        console.log('Received RDVs:', rendezvous);
        this.rendezvous = rendezvous;
        this.loadCalendarEvents();
        this.errorMessage = null;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des rendez-vous:', err);
        this.errorMessage = err.message;
      }
    });
  }

  loadCalendarEvents() {
    const events: EventInput[] = this.rendezvous.map(rdv => ({
      title: `${rdv.typeProbleme} (${rdv.status})`,
      start: rdv.dateSouhaitee,
      extendedProps: {
        description: rdv.description,
        status: rdv.status
      }
    }));
    this.calendarOptions = {
      ...this.calendarOptions,
      events
    };
  }

  handleEventClick(info: any) {
    alert(`Rendez-vous: ${info.event.title}\nDate: ${new Date(info.event.start).toLocaleString('fr-FR')}\nDescription: ${info.event.extendedProps.description}\nStatut: ${info.event.extendedProps.status}`);
  }

  openModal(): void {
    if (!this.clientId) {
      this.errorMessage = 'Veuillez vous connecter pour créer un rendez-vous.';
      return;
    }
    this.isModalOpen = true;
    this.rendezvousForm.reset({
      dateSouhaitee: '',
      timeSlot: '',
      typeProbleme: '',
      description: ''
    });
    this.availableSlots = [];
    this.errorMessage = null;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.rendezvousForm.reset();
    this.availableSlots = [];
    this.errorMessage = null;
  }

  addRendezvous() {
    if (this.rendezvousForm.valid && this.clientId) {
      const formValue = this.rendezvousForm.value;
      const date = new Date(formValue.dateSouhaitee);
      const [hours, minutes] = formValue.timeSlot.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);

      const formattedDate = date.toISOString().slice(0, 19);

      const rdv: RdvCreate = {
        dateSouhaitee: formattedDate,
        dateEnvoi: new Date().toISOString(),
        typeProbleme: formValue.typeProbleme,
        description: formValue.description,
        status: 'EN_ATTENTE',
        client: { id: this.clientId }
      };

      console.log('POST payload:', JSON.stringify(rdv, null, 2));
      console.log('Client ID:', this.clientId);

      this.rendezvousService.addRendezvous(rdv).subscribe({
        next: () => {
          this.getRendezvous();
          this.closeModal();
          this.errorMessage = null;
        },
        error: (err) => {
          console.error('Erreur lors de l\'ajout du rendez-vous:', err);
          try {
            const errorBody = JSON.parse(err.error);
            this.errorMessage = errorBody.message || 'Erreur lors de l\'ajout du rendez-vous.';
          } catch (e) {
            this.errorMessage = err.message || 'Erreur lors de l\'ajout du rendez-vous.';
          }
        }
      });
    } else {
      this.errorMessage = 'Veuillez remplir tous les champs requis correctement ou vérifier votre connexion.';
    }
  }

  loadAvailableSlots() {
    const date = this.rendezvousForm.get('dateSouhaitee')?.value;
    if (date) {
      this.scheduleService.getAvailableSlots(date).subscribe({
        next: (slots) => {
          this.availableSlots = slots;
          this.rendezvousForm.get('timeSlot')?.setValue('');
          this.errorMessage = null;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des créneaux:', err);
          this.errorMessage = err.message;
        }
      });
    } else {
      this.availableSlots = [];
    }
  }

  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
  }
}