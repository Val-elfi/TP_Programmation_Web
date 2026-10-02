import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  get email() {
    return this.form.controls.email;
  }

  get password() {
    return this.form.controls.password;
  }

  submit(): void {
    this.errorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.loading.set(true);

    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        console.debug('[LoginPage] Connexion réussie');
        void this.router.navigateByUrl('/tracks');
      },
      error: (error: HttpErrorResponse | { error?: { message?: string }; status?: number }) => {
        this.loading.set(false);
        console.error('[LoginPage] Échec de connexion', error);

        if (error.status === 401) {
          this.errorMessage.set('Identifiants incorrects (email ou mot de passe invalide).');
        } else if (error.status === 0) {
          this.errorMessage.set('Serveur inaccessible. Vérifiez que le backend est démarré.');
        } else {
          this.errorMessage.set(
            error.error?.message ?? 'Une erreur est survenue lors de la connexion.',
          );
        }
      },
    });
  }
}

