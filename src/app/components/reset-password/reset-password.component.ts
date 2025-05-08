import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  loading: boolean = false;
  submitted: boolean = false;
  token: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetForm = new FormGroup({
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', [Validators.required])
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      alert('Jeton de réinitialisation invalide.');
      this.router.navigate(['/login']);
    }
  }

  passwordMatchValidator: ValidatorFn = (form: AbstractControl): { [key: string]: boolean } | null => {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword ? { mismatch: true } : null;
  };

  onResetPassword(): void {
    this.submitted = true;
    if (this.resetForm.invalid || !this.token) {
      return;
    }

    this.loading = true;
    const newPassword = this.resetForm.get('password')?.value;
    this.authService.resetPassword(this.token, newPassword)
      .subscribe({
        next: (response: any) => {
          alert('Mot de passe réinitialisé avec succès. Veuillez vous connecter.');
          this.router.navigate(['/login']);
          this.loading = false;
        },
        error: (error: any) => {
          const message = error.error?.message || 'Erreur lors de la réinitialisation du mot de passe';
          alert(message);
          this.loading = false;
        }
      });
  }
}