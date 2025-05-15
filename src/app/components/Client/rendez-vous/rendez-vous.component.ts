import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RendezvousService } from 'src/app/services/rendez-vous.service';
import { ScheduleService } from '../../../services/schedule.service';
import { ObjetService } from 'src/app/services/objet.service';
import { UserInfoService } from 'src/app/services/user-info.service';
import { Rdv, RdvCreate } from '../../../models/rendez-vous.model';
import {  ObjetType } from 'src/app/services/objet.service';
import { Objet } from 'src/app/models/objet.model';
import { UserInfo } from 'src/app/models/user-info.model';
import { jwtDecode } from 'jwt-decode';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import '@fullcalendar/core';
import '@fullcalendar/daygrid';
import '@fullcalendar/timegrid';
import '@fullcalendar/list';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  isDetailsModalOpen: boolean = false;
  selectedRdv: Rdv | null = null;
  availableSlots: string[] = [];
  clientId: number | null = null;
  clientProduitId: number | null = null;
  minDate: string;
  typesProblemes: Objet[] = [];

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
    private scheduleService: ScheduleService,
    private objetService: ObjetService,
    private userInfoService: UserInfoService,
    private snackBar: MatSnackBar
  ) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDate = tomorrow.toISOString().split('T')[0];

    this.rendezvousForm = this.fb.group({
      dateSouhaitee: ['', Validators.required],
      timeSlot: ['', Validators.required],
      typeProbleme: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    this.loadUserInfo().then(() => {
      if (this.clientId) {
        this.getRendezvous();
        this.loadTypesProblemes();
      } else {
        this.showError('Veuillez vous connecter pour accéder à vos rendez-vous.');
      }
    });
    if (localStorage.getItem('mode') === 'night') {
      this.toggleMode();
    }
  }

  private loadUserInfo(): Promise<void> {
    return new Promise((resolve) => {
      const token = localStorage.getItem('token');
      if (!token) {
        this.showError('Aucun token trouvé. Veuillez vous connecter.');
        resolve();
        return;
      }

      try {
        const decoded: any = jwtDecode(token);
        console.log('Decoded JWT:', decoded);
        this.clientId = Number(decoded.id) || null;

        if (!this.clientId) {
          this.showError('Erreur: ID client invalide. Veuillez vous reconnecter.');
          resolve();
          return;
        }

        this.userInfoService.getUserById(this.clientId).subscribe({
          next: (user: UserInfo) => {
            this.clientProduitId = user.produit?.id || null;
            console.log('Loaded user info:', user, 'Client Product ID:', this.clientProduitId);
            resolve();
          },
          error: (err) => {
            console.error('Error fetching user info:', err);
            this.showError('Erreur lors de la récupération des informations utilisateur.');
            resolve();
          }
        });
      } catch (error) {
        console.error('Error decoding JWT:', error);
        this.showError('Erreur lors de la lecture du token. Veuillez vous reconnecter.');
        resolve();
      }
    });
  }

  loadTypesProblemes() {
    if (!this.clientProduitId) {
      console.warn('Client product ID is not available, cannot load types of problems.');
      this.typesProblemes = [];
      this.showError('Produit du client non trouvé. Veuillez vérifier votre configuration.');
      return;
    }

    this.objetService.getObjetsByProduitIdAndType(this.clientProduitId, ObjetType.RENDEZVOUS).subscribe({
      next: (objets) => {
        this.typesProblemes = objets;
        console.log('Types de problèmes chargés:', this.typesProblemes);
        if (this.typesProblemes.length === 0) {
          this.showNotification('Aucun type de problème disponible pour votre produit.');
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des types de problèmes:', err);
        this.showError('Erreur lors du chargement des types de problèmes.');
      }
    });
  }

  getRendezvous() {
    if (!this.clientId) {
      this.showError('Client ID manquant. Veuillez vous reconnecter.');
      return;
    }
    console.log('Fetching RDVs for client ID:', this.clientId);
    this.rendezvousService.getRendezvousByClient(this.clientId).subscribe({
      next: (rendezvous) => {
        console.log('Received RDVs:', rendezvous);
        this.rendezvous = rendezvous;
        this.loadCalendarEvents();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des rendez-vous:', err);
        this.showError(err.message);
      }
    });
  }

  loadCalendarEvents() {
    const events: EventInput[] = this.rendezvous.map(rdv => ({
      title: `${rdv.typeProbleme} (${rdv.status})`,
      start: rdv.dateSouhaitee,
      extendedProps: {
        id: rdv.id,
        description: rdv.description,
        status: rdv.status,
        meetLink: rdv.meetLink,
        technicienId: rdv.technicien?.id
      },
      backgroundColor: this.getEventColor(rdv.status),
      borderColor: this.getEventColor(rdv.status)
    }));
    this.calendarOptions = {
      ...this.calendarOptions,
      events
    };
  }

  getEventColor(status: string): string {
    switch (status) {
      case 'EN_ATTENTE':
        return '#ffc107';
      case 'TERMINE':
        return '#28a745';
      case 'REFUSE':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  }

  handleEventClick(info: any) {
    const rdvId = info.event.extendedProps.id;
    const rdv = this.rendezvous.find(r => r.id === rdvId);
    if (rdv) {
      this.openDetailsModal(rdv);
    }
  }

  openDetailsModal(rdv: Rdv): void {
    this.selectedRdv = rdv;
    this.isDetailsModalOpen = true;
  }

  closeDetailsModal(): void {
    this.isDetailsModalOpen = false;
    this.selectedRdv = null;
  }

  openModal(): void {
    if (!this.clientId) {
      this.showError('Veuillez vous connecter pour créer un rendez-vous.');
      return;
    }
    if (this.typesProblemes.length === 0) {
      this.showError('Aucun type de problème disponible pour votre produit. Veuillez vérifier votre configuration.');
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
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.rendezvousForm.reset();
    this.availableSlots = [];
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
        typeProbleme: this.typesProblemes.find(obj => obj.id === Number(formValue.typeProbleme))?.name || formValue.typeProbleme,
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
          this.showSuccess('Rendez-vous créé avec succès !');
        },
        error: (err) => {
          console.error('Erreur lors de l\'ajout du rendez-vous:', err);
          try {
            const errorBody = JSON.parse(err.error);
            this.showError(errorBody.message || 'Erreur lors de l\'ajout du rendez-vous.');
          } catch (e) {
            this.showError(err.message || 'Erreur lors de l\'ajout du rendez-vous.');
          }
        }
      });
    } else {
      this.showError('Veuillez remplir tous les champs requis correctement ou vérifier votre connexion.');
    }
  }

  loadAvailableSlots() {
    const date = this.rendezvousForm.get('dateSouhaitee')?.value;
    if (date) {
      this.scheduleService.getAvailableSlots(date).subscribe({
        next: (slots) => {
          this.availableSlots = slots;
          this.rendezvousForm.get('timeSlot')?.setValue('');
        },
        error: (err) => {
          console.error('Erreur lors du chargement des créneaux:', err);
          this.showError(err.message);
        }
      });
    } else {
      this.availableSlots = [];
    }
  }

  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
    localStorage.setItem('mode', this.isNightMode ? 'night' : 'day');
  }

  // Méthodes pour afficher les notifications
  private showSuccess(message: string): void {
    this.snackBar.open(message, '', {
      duration: 6000,
      panelClass: ['custom-success-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, '', {
      duration: 5000,
      panelClass: ['custom-error-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, '', {
      duration: 5000,
      panelClass: ['custom-notification-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }
}