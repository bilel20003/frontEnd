import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Client } from 'src/app/components/Admin/client/client.component'; // Importer le modèle depuis le fichier du composant

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private clients: Client[] = [
    { id: 1, name: 'Client 1', email: 'client1@example.com', phone: '1234567890', services: ['Service 1', 'Service 2'] },
    { id: 2, name: 'Client 2', email: 'client2@example.com', phone: '0987654321', services: ['Service 3'] },
    // Ajoutez plus de clients si nécessaire
  ];

  constructor() { }

  // Récupérer tous les clients
  getClients(): Observable<Client[]> {
    return of(this.clients);
  }

  // Ajouter un client
  addClient(client: Client): Observable<Client> {
    const newClient = { ...client, id: this.clients.length + 1 };  // Attribuer un nouvel ID
    this.clients.push(newClient);  // Ajouter le client à la liste
    return of(newClient);  // Retourner un observable
  }

  // Modifier un client
  updateClient(client: Client): Observable<Client> {
    const index = this.clients.findIndex(c => c.id === client.id);
    if (index !== -1) {
      this.clients[index] = client;  // Mettre à jour le client dans le tableau
      return of(client);  // Retourner l'objet modifié
    }
    // Si le client n'existe pas, retourner un objet vide de type Client
    return of({ id: 0, name: '', email: '', phone: '', services: [] }); // Retourner un client vide
  }

  // Supprimer un client
  deleteClient(clientId: number): Observable<void> {
    this.clients = this.clients.filter(client => client.id !== clientId);  // Supprimer le client par ID
    return of();  // Retourner un observable vide
  }
}
