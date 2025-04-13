import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup; // Déclaration de loginForm
  loading: boolean = false; // Initialisation de loading
  submitted: boolean = false; // Déclaration de submitted

  constructor(private authService: AuthService, private router: Router) { 
    // Initialisation de loginForm dans le constructeur
    this.loginForm = new FormGroup({
      email: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required)
    });
  }

  ngOnInit(): void {
    // Vous pouvez également initialiser ici si vous préférez
  }
  
  onLogin(): void {
    this.loading = true;
    this.authService.login(this.loginForm.get('email')?.value, this.loginForm.get('password')?.value)
        .subscribe((response: any) => {
            if (response.token) {
                const role = localStorage.getItem('role');
                if (role === 'ADMIN') {
                  this.router.navigate(['/utilisateurs']);
              } else if (role === 'CLIENT') {
                  this.router.navigate(['/home']);
              } else if (role === 'GUICHETIER') {
                  this.router.navigate(['/gui-home']);
              } else {
                  alert('Rôle non reconnu');
              }
            } else {
                alert('Email ou mot de passe incorrect');
            }
            this.loading = false;
        }, (error: any) => {
            alert('Erreur lors de la connexion');
            this.loading = false;
        });
}
}