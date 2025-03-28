import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RendezVousService {
  private rendezVousSource = new BehaviorSubject<any[]>([]);
  currentRendezVous = this.rendezVousSource.asObservable();

  constructor() {}

  addRendezVous(rendezVous: any) {
    const currentList = this.rendezVousSource.value;
    this.rendezVousSource.next([...currentList, rendezVous]);
  }

  getRendezVousList() {
    return this.rendezVousSource.value;
  }
}