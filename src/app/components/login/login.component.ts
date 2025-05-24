import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

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

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
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
    // Éviter de vider tout le localStorage
    if (token) {
      const role = this.authService.getRole();
      if (role) {
        this.redirectUser(role);
      }
    }
  }

  onLogin(): void {
    this.submitted = true;
    if (this.loginForm.invalid) {
      this.showError('Veuillez vérifier les champs requis.');
      return;
    }

    this.loading = true;
    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;

    this.authService.login(email, password).subscribe({
      next: (response: any) => {
        if (response.token) {
          const role = this.authService.getRole();
          if (!role) {
            this.showError('Rôle non défini dans le token. Veuillez contacter l\'administrateur.');
            this.loading = false;
            return;
          }
          this.redirectUser(role);
        } else {
          this.showError('Email ou mot de passe incorrect');
        }
        this.loading = false;
      },
      error: (error: any) => {
        const message = error.error?.message || 'Erreur lors de la connexion';
        this.showError(message);
        this.loading = false;
      }
    });
  }

  private redirectUser(role: string): void {
  const roleUpper = role.toUpperCase();
  switch (roleUpper) {
    case 'ADMIN':
    case 'DACA':
      this.router.navigate(['/dashboard']);
      break;
    case 'CLIENT':
      this.router.navigate(['/home']);
      break;
    case 'GUICHETIER':
      this.router.navigate(['/gui-home']);
      break;
    case 'TECHNICIEN':
      this.router.navigate(['/tech-home']);
      break;
    default:
      this.showError(`Rôle non reconnu : ${role}. Veuillez contacter l'administrateur.`);
      break;
  }
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
      this.showError('Veuillez entrer un email valide.');
      return;
    }

    this.forgotLoading = true;
    const email = this.forgotPasswordForm.get('email')?.value;
    this.authService.forgotPassword(email).subscribe({
      next: (response: any) => {
        this.showSuccess('Un email de réinitialisation a été envoyé à votre adresse.');
        this.closeForgotPasswordModal();
        this.forgotLoading = false;
      },
      error: (error: any) => {
        const message = error.error?.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation';
        this.showError(message);
        this.forgotLoading = false;
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, '', {
      duration: 10000,
      panelClass: ['custom-success-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, '', {
      duration: 10000, // Réduit à 10 secondes pour une meilleure UX
      panelClass: ['custom-error-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }
}