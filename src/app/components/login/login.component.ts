import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  public form = {
    username: '',
    password: ''
  };

  constructor(private router: Router) {}

  onLogin() {
    if (this.form.username === 'client' && this.form.password === '123') {
      this.router.navigate(['/home']); // Redirige vers l'interface client
    } else {
      if (this.form.username === 'guichetier' && this.form.password === '123') {
        this.router.navigate(['/gui-home']); // Redirige vers l'interface client
      }else{
      alert('Nom d’utilisateur ou mot de passe incorrect');
    }
  }
  }
}
