import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

// Interface pour la réponse de l'API Ollama
interface OllamaResponse {
  response: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  // Endpoint local d'Ollama
  private apiUrl = 'http://localhost:11434/api/generate';

  constructor(private http: HttpClient) {}

  generateDescription(prompt: string): Observable<string> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Prompt système élargi pour gérer plusieurs types de tâches
    const systemPrompt = 'Tu es une IA proactive et professionnelle. Ton rôle est d’aider l’utilisateur dans diverses tâches. Si l’utilisateur demande de générer un email, une réclamation, une demande de rendez-vous ou tout autre contenu, rédige-le directement de manière professionnelle et concise en français, en respectant les instructions spécifiques (ex. : inclure objet, salutation, corps, politesse pour un email). Si aucune génération n’est demandée, réponds de manière naturelle, chaleureuse et engageante, comme à un ami, en utilisant le contexte. Ne donne pas d’instructions ou d’explications inutiles, sauf si demandé.';
    const body = {
      model: 'mistral',
      prompt: `${systemPrompt}\n${prompt}`,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 300
      }
    };

    console.log('Sending POST request to:', this.apiUrl, 'with body:', body);

    return this.http.post<OllamaResponse>(this.apiUrl, body, { headers }).pipe(
      retry({ count: 2, delay: 1000 }),
      map((response: OllamaResponse) => {
        console.log('Raw AI response:', response);
        let text = response.response?.trim() || 'Erreur: aucune réponse générée.';
        text = this.cleanResponse(text, prompt);
        console.log('Cleaned AI response:', text);
        return text;
      }),
      catchError(this.handleError)
    );
  }

  // Fonction pour nettoyer les réponses indésirables
  private cleanResponse(text: string, prompt: string): string {
    const unwantedPatterns = [
      /^Vous souhaitez[^.]*\./i,
      /^L'utilisateur a demandé[^.]*\./i,
      /^Voici une description[^.]*\./i,
      new RegExp(`^${prompt}[. ]*`, 'i')
    ];

    let cleanedText = text;
    for (const pattern of unwantedPatterns) {
      cleanedText = cleanedText.replace(pattern, '').trim();
    }

    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    return cleanedText;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Erreur lors de la génération de la description.';
    if (error.status === 400) {
      errorMessage = 'Requête invalide. Vérifiez le prompt ou le modèle.';
    } else if (error.status === 404) {
      errorMessage = 'Serveur Ollama ou modèle non trouvé. Assurez-vous que Ollama est en cours d’exécution.';
    } else if (error.status === 500) {
      errorMessage = 'Erreur interne du serveur Ollama. Réessayez plus tard.';
    } else if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur Ollama. Vérifiez que "ollama serve" est en cours d’exécution.';
    }
    console.error('Erreur Ollama API:', error);
    return throwError(() => new Error(errorMessage));
  }
}