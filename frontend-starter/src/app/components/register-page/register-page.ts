import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  get name() {
    return this.form.controls.name;
  }

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

    const { name, email, password } = this.form.getRawValue();
    this.loading.set(true);

    this.auth.register(name, email, password).subscribe({
      next: () => {
        this.loading.set(false);
        console.debug('[RegisterPage] Inscription réussie');
        void this.router.navigateByUrl('/tracks');
      },
      error: (error: HttpErrorResponse | { error?: { message?: string }; status?: number }) => {
        this.loading.set(false);
        console.error('[RegisterPage] Échec de l’inscription', error);

        if (error.status === 409) {
          this.errorMessage.set('Cet email est déjà associé à un compte existant.');
        } else if (error.status === 400) {
          this.errorMessage.set(
            error.error?.message ??
              'Données invalides : vérifiez que le nom fait au moins 2 caractères et le mot de passe 8 caractères.',
          );
        } else if (error.status === 0) {
          this.errorMessage.set('Serveur inaccessible. Vérifiez que le backend est démarré.');
        } else {
          this.errorMessage.set(
            error.error?.message ?? "Une erreur est survenue lors de l'inscription.",
          );
        }
      },
    });
  }
}

