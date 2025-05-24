import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RendezvousService } from 'src/app/services/rendez-vous.service';
import { ScheduleService } from '../../../services/schedule.service';
import { ObjetService } from 'src/app/services/objet.service';
import { UserInfoService } from 'src/app/services/user-info.service';
import { Rdv, RdvCreate } from '../../../models/rendez-vous.model';
import { ObjetType } from 'src/app/services/objet.service';
import { Objet } from 'src/app/models/objet.model';
import { UserInfo } from 'src/app/models/user-info.model';
import { jwtDecode } from 'jwt-decode';
import { CalendarOptions, EventInput, EventContentArg, DayCellContentArg } from '@fullcalendar/core';
import { DateClickArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import '@fullcalendar/core';
import '@fullcalendar/daygrid';
import '@fullcalendar/timegrid';
import '@fullcalendar/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Schedule } from 'src/app/models/schedule.model';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { AiService } from 'src/app/services/ai.service';

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
  isChatModalOpen: boolean = false;
  selectedRdv: Rdv | null = null;
  availableSlots: string[] = [];
  selectedSlot: string | null = null;
  clientId: number | null = null;
  clientProduitId: number | null = null;
  minDate: string;
  typesProblemes: Objet[] = [];
  schedules: { [key: string]: Schedule[] } = {};
  currentWeekStart: Date = new Date();
  daysInWeek: { date: Date; isAvailable: boolean }[] = [];
  chatHistory: { text: string; isUser: boolean }[] = [];
  chatInput: string = '';

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    events: [],
    eventClick: this.handleEventClick.bind(this),
    height: '600px',
    contentHeight: 'auto',
    aspectRatio: 1.5,
    locale: 'fr',
    eventContent: this.renderEventContent.bind(this),
    dayMaxEvents: true,
    moreLinkClick: 'popover',
    eventDisplay: 'block',
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', meridiem: false },
    slotDuration: '00:30:00',
    slotLabelInterval: '01:00',
    editable: false,
    selectable: true,
    dayCellClassNames: this.getDayCellClassNames.bind(this),
    datesSet: this.updateAvailableDays.bind(this),
    dateClick: this.handleDateClick.bind(this)
  };

  constructor(
    private fb: FormBuilder,
    private rendezvousService: RendezvousService,
    private scheduleService: ScheduleService,
    private objetService: ObjetService,
    private userInfoService: UserInfoService,
    private snackBar: MatSnackBar,
    private aiService: AiService
  ) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDate = tomorrow.toISOString().split('T')[0];
    this.currentWeekStart.setDate(tomorrow.getDate() - tomorrow.getDay());

    this.rendezvousForm = this.fb.group({
      dateSouhaitee: ['', Validators.required],
      typeProbleme: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    this.loadUserInfo().then(() => {
      if (this.clientId) {
        this.getRendezvous();
        this.loadTypesProblemes();
        this.updateAvailableDays();
        this.loadDaysInWeek();
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
      borderColor: this.getEventColor(rdv.status),
      textColor: this.getTextColor(rdv.status)
    }));
    this.calendarOptions = {
      ...this.calendarOptions,
      events
    };
  }

  getEventColor(status: string): string {
    switch (status) {
      case 'EN_ATTENTE':
        return '#e1c809';
      case 'TERMINE':
        return '#089900';
      case 'REFUSE':
        return '#d50606';
      default:
        return '#6c757d';
    }
  }

  getTextColor(status: string): string {
    return status === 'EN_ATTENTE' ? '#212529' : 'white';
  }

  renderEventContent(eventInfo: EventContentArg): any {
    return { html: `<div>${eventInfo.event.title}</div>` };
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
      typeProbleme: '',
      description: ''
    });
    this.availableSlots = [];
    this.selectedSlot = null;
    this.loadDaysInWeek();
    this.chatHistory = [];
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.rendezvousForm.reset();
    this.availableSlots = [];
    this.selectedSlot = null;
    this.chatHistory = [];
  }

  addRendezvous() {
    if (this.rendezvousForm.valid && this.clientId && this.selectedSlot) {
      const formValue = this.rendezvousForm.value;
      const date = new Date(formValue.dateSouhaitee);
      const [hours, minutes] = this.selectedSlot.split(':').map(Number);
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
      this.showError('Veuillez sélectionner un créneau horaire et remplir tous les champs requis.');
    }
  }

  loadAvailableSlots() {
    const date = this.rendezvousForm.get('dateSouhaitee')?.value;
    if (date) {
      this.scheduleService.getAvailableSlots(date).subscribe({
        next: (slots) => {
          this.availableSlots = slots;
          this.selectedSlot = null;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des créneaux:', err);
          this.showError(err.message);
          this.availableSlots = [];
          this.selectedSlot = null;
        }
      });
    } else {
      this.availableSlots = [];
      this.selectedSlot = null;
    }
  }

  selectSlot(slot: string) {
    this.selectedSlot = slot;
  }

  toggleMode() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
    localStorage.setItem('mode', this.isNightMode ? 'night' : 'day');
  }

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

  updateAvailableDays(): void {
    const calendarApi = this.calendarComponent?.getApi();
    if (!calendarApi) return;

    const currentDate = calendarApi.getDate();
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const dayMap = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6
    } as const;

    const dayMapKeys = Object.keys(dayMap) as Array<keyof typeof dayMap>;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = dayMapKeys.find(key => dayMap[key] === d.getDay());
      if (dayMap && dayOfWeek) {
        this.scheduleService.getSchedulesByDay(dayOfWeek).subscribe({
          next: (schedules) => {
            this.schedules[dayOfWeek] = schedules;
            const isAvailable = schedules.length > 0 && d >= new Date();
            const dayElement = document.querySelector(`[data-date="${d.toISOString().split('T')[0]}"]`);
            if (dayElement) {
              dayElement.classList.toggle('available-day', isAvailable);
              dayElement.classList.toggle('unavailable-day', !isAvailable);
            }
          },
          error: (err) => {
            console.error(`Erreur lors du chargement des horaires pour ${dayOfWeek}:`, err);
            this.showError('Erreur lors du chargement des horaires.');
          }
        });
      }
    }
  }

  getDayCellClassNames(info: DayCellContentArg): string[] {
    const dayMap = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6
    } as const;

    const dayMapKeys = Object.keys(dayMap) as Array<keyof typeof dayMap>;
    const date = info.date;
    const dayOfWeek = dayMapKeys.find(key => dayMap[key] === date.getDay());
    if (dayOfWeek) {
      const schedules = this.schedules[dayOfWeek] || [];
      const isAvailable = schedules.length > 0 && date >= new Date();
      return isAvailable ? ['available-day'] : ['unavailable-day'];
    }
    return ['unavailable-day'];
  }

  handleDateClick(info: DateClickArg): void {
    const selectedDate = info.dateStr;
    this.rendezvousForm.patchValue({ dateSouhaitee: selectedDate });
    this.loadAvailableSlots();
  }

  loadDaysInWeek() {
    this.daysInWeek = [];
    const dayMap = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6
    } as const;
    const dayMapKeys = Object.keys(dayMap) as Array<keyof typeof dayMap>;

    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);
      const dayOfWeek = dayMapKeys[date.getDay()];
      const isAvailable = dayOfWeek && this.schedules[dayOfWeek]?.length > 0 && date >= new Date();
      this.daysInWeek.push({ date, isAvailable: !!isAvailable });
    }
  }

  prevWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.loadDaysInWeek();
  }

  nextWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.loadDaysInWeek();
  }

  selectDay(date: Date) {
    this.rendezvousForm.patchValue({ dateSouhaitee: date.toISOString().split('T')[0] });
    this.loadAvailableSlots();
  }

  openChatModal(): void {
    this.isChatModalOpen = true;
    if (this.chatHistory.length === 0) {
      this.chatHistory.push({ text: 'Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider aujourd’hui ? 😊', isUser: false });
    }
  }

  closeChatModal(): void {
    this.isChatModalOpen = false;
    this.chatInput = '';
  }

  sendChatMessage(): void {
    if (!this.chatInput.trim()) return;

    const userMessage = this.chatInput.trim().toLowerCase();
    this.chatHistory.push({ text: userMessage, isUser: true });
    this.chatInput = '';

    // Détection des salutations ou présentations
    if (userMessage.includes('bonjour') || userMessage.includes('salut')) {
      this.chatHistory.push({ text: 'Bonjour ! Comment vas-tu ? 😊', isUser: false });
      return;
    }

    if (userMessage.includes('je m\'appelle') || userMessage.includes('j\'ai')) {
      const nameMatch = userMessage.match(/je m'appelle (\w+)/i);
      const ageMatch = userMessage.match(/j'ai (\d+)/i);
      let aiResponse = '';
      if (nameMatch && ageMatch) {
        const name = nameMatch[1];
        const age = ageMatch[1];
        aiResponse = `Enchanté ${name} ! Tu as ${age} ans, c’est super ! Comment puis-je t’aider aujourd’hui ?`;
      } else if (nameMatch) {
        const name = nameMatch[1];
        aiResponse = `Ravi de te rencontrer ${name} ! Quel âge as-tu ?`;
      } else if (ageMatch) {
        const age = ageMatch[1];
        aiResponse = `Super, tu as ${age} ans ! Comment je peux t’aider ?`;
      }
      if (aiResponse) {
        this.chatHistory.push({ text: aiResponse, isUser: false });
        return;
      }
    }

    if (userMessage.includes('quel est mon nom') || userMessage.includes('mon âge')) {
      const previousMessages = this.chatHistory.map(msg => msg.text).join(' ');
      const nameMatch = previousMessages.match(/je m'appelle (\w+)/i);
      const ageMatch = previousMessages.match(/j'ai (\d+)/i);
      let aiResponse = '';
      if (nameMatch && ageMatch) {
        const name = nameMatch[1];
        const age = ageMatch[1];
        aiResponse = `Tu t’appelles ${name} et tu as ${age} ans !`;
      } else if (nameMatch) {
        const name = nameMatch[1];
        aiResponse = `Tu t’appelles ${name}, mais je ne connais pas ton âge. Quel âge as-tu ?`;
      } else if (ageMatch) {
        const age = ageMatch[1];
        aiResponse = `Tu as ${age} ans, mais je ne connais pas ton nom. Comment tu t’appelles ?`;
      } else {
        aiResponse = `Désolé, je ne me souviens pas de ton nom ni de ton âge. Peux-tu me le redire ?`;
      }
      this.chatHistory.push({ text: aiResponse, isUser: false });
      return;
    }

    // Détection des demandes de génération
    const context = this.chatHistory.map(msg => msg.text).join('\n');
    let prompt = '';

    // Génération d'un email
    if (userMessage.includes('generer un mail') || userMessage.includes('generer une email')) {
      prompt = `Construis un email professionnel en français basé sur le contexte suivant :\n${context}\nL'email doit inclure une ligne d'objet, une salutation, un corps de message clair et une formule de politesse. Retourne uniquement le contenu de l'email au format texte, sans explications ni instructions supplémentaires.`;
    }
    // Génération d'une réclamation
    else if (userMessage.includes('generer une reclamation')) {
      prompt = `Rédige une réclamation professionnelle en français basée sur le contexte suivant :\n${context}\nLa réclamation doit inclure une introduction expliquant le problème, les détails de la situation, et une demande de solution. Retourne uniquement le contenu de la réclamation au format texte, sans explications ni instructions supplémentaires.`;
    }
    // Génération d'une demande de rendez-vous
    else if (userMessage.includes('generer une demande de rendez-vous') || userMessage.includes('generer une demande de rdv')) {
      prompt = `Rédige une demande de rendez-vous professionnelle en français basée sur le contexte suivant :\n${context}\nLa demande doit inclure une introduction, une proposition de date ou une demande de disponibilités, et une formule de politesse. Retourne uniquement le contenu de la demande au format texte, sans explications ni instructions supplémentaires.`;
    }
    // Réponse conversationnelle par défaut
    else {
      prompt = `Conversation en cours :\n${context}\nIA: `;
    }

    this.aiService.generateDescription(prompt).subscribe({
      next: (response) => {
        this.chatHistory.push({ text: response, isUser: false });
      },
      error: (err) => {
        this.showError('Erreur lors de la génération de la réponse IA.');
        console.error('AI Error:', err);
      }
    });
  }

  sendFinalDescription(): void {
    if (this.chatHistory.length > 0) {
      const lastAIMessage = this.chatHistory[this.chatHistory.length - 1];
      if (!lastAIMessage.isUser) {
        this.rendezvousForm.patchValue({ description: lastAIMessage.text });
        this.closeChatModal();
      } else {
        this.showError('Veuillez attendre une réponse de l\'IA avant d\'envoyer la description finale.');
      }
    }
  }
}