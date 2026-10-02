import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePageComponent implements OnInit {
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
  });

  get name() {
    return this.form.controls.name;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.profile().subscribe({
      next: (user) => {
        this.loading.set(false);
        console.debug('[ProfilePage] Profil chargé', user.id);
        this.form.setValue({ name: user.name });
      },
      error: (error: HttpErrorResponse | { error?: { message?: string } }) => {
        this.loading.set(false);
        console.error('[ProfilePage] Chargement impossible', error);
        this.errorMessage.set('Impossible de charger le profil utilisateur.');
      },
    });
  }

  save(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name } = this.form.getRawValue();
    this.saving.set(true);

    this.auth.update(name).subscribe({
      next: (user) => {
        this.saving.set(false);
        console.debug('[ProfilePage] Profil mis à jour', user.id);
        this.successMessage.set('Nom d’utilisateur mis à jour avec succès !');
      },
      error: (error: HttpErrorResponse | { error?: { message?: string } }) => {
        this.saving.set(false);
        console.error('[ProfilePage] Enregistrement impossible', error);
        this.errorMessage.set(
          error.error?.message ?? 'Impossible de mettre à jour le profil.',
        );
      },
    });
  }
}

