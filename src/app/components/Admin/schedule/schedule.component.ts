import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ScheduleService } from '../../../services/schedule.service';
import { Schedule } from '../../../models/schedule.model';

interface TimePickerState {
  startTime: boolean;
  endTime: boolean;
  breakStart: boolean;
  breakEnd: boolean;
}

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {
  scheduleForm: FormGroup;
  schedules: Schedule[] = [];
  filteredSchedules: Schedule[] = [];
  editingSchedule: Schedule | null = null;
  searchTerm: string = '';
  itemsPerPage: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  paginatedSchedules: Schedule[] = [];
  isNightMode: boolean = false;
  daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  selectedDay: string = '';
  errorMessage: string | null = null;
  timeOptions: string[] = [];
  showTimePicker: TimePickerState = {
    startTime: false,
    endTime: false,
    breakStart: false,
    breakEnd: false
  };

  constructor(private fb: FormBuilder, private scheduleService: ScheduleService) {
    this.scheduleForm = this.fb.group({
      dayOfWeek: ['', Validators.required],
      startTime: ['', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
      endTime: ['', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
      breakStart: ['', Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)],
      breakEnd: ['', Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]
    }, { validators: this.timeRangeValidator });
    this.generateTimeOptions();
  }

  ngOnInit(): void {
    this.loadSchedules();
    this.applyNightMode();
  }

  generateTimeOptions(): void {
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        this.timeOptions.push(time);
      }
    }
  }

  toggleTimePicker(field: keyof TimePickerState): void {
    this.showTimePicker[field] = !this.showTimePicker[field];
    Object.keys(this.showTimePicker).forEach(key => {
      if (key !== field) {
        this.showTimePicker[key as keyof TimePickerState] = false;
      }
    });
  }

  selectTime(field: keyof TimePickerState, time: string): void {
    this.scheduleForm.patchValue({ [field]: time });
    this.showTimePicker[field] = false;
  }

  loadSchedules(): void {
    this.schedules = [];
    this.daysOfWeek.forEach(day => {
      this.scheduleService.getSchedulesByDay(day).subscribe({
        next: (schedules) => {
          this.schedules = [...this.schedules, ...schedules];
          this.filterSchedules();
        },
        error: (err) => {
          console.error('Erreur lors du chargement des horaires:', err);
          this.errorMessage = err.message;
        }
      });
    });
  }

  filterSchedules(): void {
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      this.filteredSchedules = this.schedules.filter(schedule =>
        schedule.dayOfWeek.toLowerCase().includes(term)
      );
    } else {
      this.filteredSchedules = [...this.schedules];
    }
    this.paginateSchedules();
  }

  paginateSchedules(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedSchedules = this.filteredSchedules.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.filteredSchedules.length / this.itemsPerPage);
  }

  selectDay(day: string): void {
    this.selectedDay = day;
    this.scheduleForm.patchValue({ dayOfWeek: day });
  }

  onSubmit(): void {
    if (this.scheduleForm.valid) {
      const formValue = this.scheduleForm.value;
      const schedule: Partial<Schedule> = {
        dayOfWeek: formValue.dayOfWeek.toUpperCase(),
        startTime: this.timeToString(formValue.startTime),
        endTime: this.timeToString(formValue.endTime),
        breakStart: formValue.breakStart ? this.timeToString(formValue.breakStart) : undefined,
        breakEnd: formValue.breakEnd ? this.timeToString(formValue.breakEnd) : undefined
      };
      if (this.editingSchedule) {
        schedule.id = this.editingSchedule.id;
      }

      console.log('Payload sent to server:', JSON.stringify(schedule, null, 2));

      if (this.editingSchedule) {
        this.scheduleService.updateSchedule(schedule.id!, schedule as Schedule).subscribe({
          next: () => {
            this.loadSchedules();
            this.resetForm();
            this.errorMessage = null;
          },
          error: (err) => {
            console.error('Erreur lors de la modification:', err);
            this.errorMessage = err.message || 'Erreur lors de la modification de l\'horaire.';
          }
        });
      } else {
        this.scheduleService.addSchedule(schedule as Schedule).subscribe({
          next: () => {
            this.loadSchedules();
            this.resetForm();
            this.errorMessage = null;
          },
          error: (err) => {
            console.error('Erreur lors de l\'ajout:', err);
            this.errorMessage = err.message || 'Erreur lors de l\'ajout de l\'horaire.';
          }
        });
      }
    } else {
      this.errorMessage = 'Veuillez remplir tous les champs requis correctement.';
    }
  }

  editSchedule(schedule: Schedule): void {
    this.editingSchedule = schedule;
    this.selectedDay = schedule.dayOfWeek;
    this.scheduleForm.patchValue({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime.slice(0, 5),
      endTime: schedule.endTime.slice(0, 5),
      breakStart: schedule.breakStart ? schedule.breakStart.slice(0, 5) : '',
      breakEnd: schedule.breakEnd ? schedule.breakEnd.slice(0, 5) : ''
    });
    this.errorMessage = null;
  }

  deleteSchedule(id: number | null): void {
    if (id == null) {
      this.errorMessage = 'Impossible de supprimer un horaire sans ID valide.';
      return;
    }
    if (confirm('Voulez-vous vraiment supprimer cet horaire ?')) {
      this.scheduleService.deleteSchedule(id).subscribe({
        next: () => {
          this.loadSchedules();
          this.errorMessage = null;
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          this.errorMessage = err.message || 'Erreur lors de la suppression de l\'horaire.';
        }
      });
    }
  }

  resetForm(): void {
    this.scheduleForm.reset();
    this.editingSchedule = null;
    this.selectedDay = '';
    this.errorMessage = null;
    Object.keys(this.showTimePicker).forEach(key => {
      this.showTimePicker[key as keyof TimePickerState] = false;
    });
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateSchedules();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateSchedules();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginateSchedules();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  onItemsPerPageChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.itemsPerPage = Number(selectElement.value);
    this.currentPage = 1;
    this.paginateSchedules();
  }

  toggleNightMode(): void {
    this.isNightMode = !this.isNightMode;
    this.applyNightMode();
  }

  applyNightMode(): void {
    document.body.classList.toggle('night-mode', this.isNightMode);
  }

  timeRangeValidator(form: FormGroup): { [key: string]: any } | null {
    const startTime = form.get('startTime')?.value;
    const endTime = form.get('endTime')?.value;
    const breakStart = form.get('breakStart')?.value;
    const breakEnd = form.get('breakEnd')?.value;

    const timeToMinutes = (time: string): number => {
      if (!time) return 0;
      const [hour, minute] = time.split(':').map(Number);
      return hour * 60 + minute;
    };

    if (startTime && endTime) {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      if (startMinutes >= endMinutes) {
        return { 'invalidTimeRange': 'L\'heure de fin doit être après l\'heure de début' };
      }
    }

    if (breakStart && breakEnd) {
      const breakStartMinutes = timeToMinutes(breakStart);
      const breakEndMinutes = timeToMinutes(breakEnd);
      if (breakStartMinutes >= breakEndMinutes) {
        return { 'invalidBreakRange': 'La fin de la pause doit être après le début de la pause' };
      }
    }

    if (breakStart && startTime && endTime) {
      const breakStartMinutes = timeToMinutes(breakStart);
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      if (breakStartMinutes < startMinutes || breakStartMinutes > endMinutes) {
        return { 'invalidBreakStart': 'Le début de la pause doit être entre l\'heure de début et de fin' };
      }
    }

    if (breakEnd && startTime && endTime) {
      const breakEndMinutes = timeToMinutes(breakEnd);
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      if (breakEndMinutes < startMinutes || breakEndMinutes > endMinutes) {
        return { 'invalidBreakEnd': 'La fin de la pause doit être entre l\'heure de début et de fin' };
      }
    }

    return null;
  }

  private timeToString(time: string): string {
    return time ? `${time}:00` : '';
  }
}