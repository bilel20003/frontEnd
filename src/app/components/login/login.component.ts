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
  loginForm: FormGroup;
  forgotPasswordForm: FormGroup;
  loading: boolean = false;
  forgotLoading: boolean = false;
  submitted: boolean = false;
  forgotSubmitted: boolean = false;
  isForgotPasswordModalOpen: boolean = false;

  constructor(private authService: AuthService, private router: Router) {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', Validators.required)
    });

    this.forgotPasswordForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email])
    });
  }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    localStorage.clear();
    if (token) {
      localStorage.setItem('token', token);
    }
  }

  onLogin(): void {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.login(this.loginForm.get('email')?.value, this.loginForm.get('password')?.value)
      .subscribe({
        next: (response: any) => {
          if (response.token) {
            const role = this.authService.getRole();
            if (role === 'ADMIN') {
              this.router.navigate(['/utilisateurs']);
            } else if (role === 'CLIENT') {
              this.router.navigate(['/home']);
            } else if (role === 'GUICHETIER') {
              this.router.navigate(['/gui-home']);
            } else if (role === 'TECHNICIEN') {
              this.router.navigate(['/tech-home']);
            } else {
              alert('Rôle non reconnu');
            }
          } else {
            alert('Email ou mot de passe incorrect');
          }
          this.loading = false;
        },
        error: (error: any) => {
          const message = error.error?.message || 'Erreur lors de la connexion';
          alert(message);
          this.loading = false;
        }
      });
  }

  openForgotPasswordModal(): void {
    this.forgotPasswordForm.reset();
    this.forgotSubmitted = false;
    this.isForgotPasswordModalOpen = true;
  }

  closeForgotPasswordModal(): void {
    this.isForgotPasswordModalOpen = false;
    this.forgotPasswordForm.reset();
    this.forgotSubmitted = false;
  }

  onForgotPassword(): void {
    this.forgotSubmitted = true;
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.forgotLoading = true;
    const email = this.forgotPasswordForm.get('email')?.value;
    this.authService.forgotPassword(email)
      .subscribe({
        next: (response: any) => {
          alert('Un email de réinitialisation a été envoyé à votre adresse.');
          this.closeForgotPasswordModal();
          this.forgotLoading = false;
        },
        error: (error: any) => {
          const message = error.error?.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation';
          alert(message);
          this.forgotLoading = false;
        }
      });
  }
}