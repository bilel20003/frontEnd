import { Component } from '@angular/core';

@Component({
  selector: 'app-documents',
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.css']
})
export class DocumentsComponent {
  documents = [
    { nom: 'Guide utilisateur.pdf', url: '#' },
    { nom: 'Procédure de réclamation.docx', url: '#' }
  ];
}
