import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar'; // Importer MatSnackBar

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
    private snackBar: MatSnackBar // Injecter MatSnackBar
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
    localStorage.clear();
    if (token) {
      localStorage.setItem('token', token);
    }
  }

  onLogin(): void {
    this.submitted = true;
    if (this.loginForm.invalid) {
      this.showError('Veuillez vérifier les champs requis.');
      return;
    }

    this.loading = true;
    this.authService.login(this.loginForm.get('email')?.value, this.loginForm.get('password')?.value)
      .subscribe({
        next: (response: any) => {
          if (response.token) {
            const role = this.authService.getRole();
            if (role === 'ADMIN') {
              this.router.navigate(['/dashboard']);
            } else if (role === 'CLIENT') {
              this.router.navigate(['/home']);
            } else if (role === 'GUICHETIER') {
              this.router.navigate(['/gui-home']);
            } else if (role === 'TECHNICIEN') {
              this.router.navigate(['/tech-home']);
            } else {
              this.showError('Rôle non reconnu');
            }
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
    this.authService.forgotPassword(email)
      .subscribe({
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

  // Méthodes pour afficher les notifications
  private showSuccess(message: string): void {
    this.snackBar.open(message, '', {
      duration: 10000, // 10 secondes
      panelClass: ['custom-success-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, '', {
      duration: 60000, // 10 secondes
      panelClass: ['custom-error-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }
}