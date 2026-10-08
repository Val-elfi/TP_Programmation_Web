import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent {
  private readonly service = inject(TrackService);

  /** Liste des pistes de la page courante. */
  readonly tracks = signal<Track[]>([]);
  /** Numéro de la page courante (commence à 1). */
  readonly page = signal(1);
  /** Nombre total de pages disponibles côté serveur. */
  readonly pages = signal(1);
  /** Indique si une requête HTTP est en cours. */
  readonly loading = signal(false);
  /** Message d'erreur lisible, null si aucune erreur. */
  readonly error = signal<string | null>(null);
  /** URL blob pour la lecture audio en cours. */
  readonly audioUrl = signal('');
  /** Signal indiquant qu'un upload est en cours. */
  readonly uploading = signal(false);
  /** Message de succès après upload. */
  readonly uploadSuccess = signal<string | null>(null);
  /** Message d'erreur d'upload. */
  readonly uploadError = signal<string | null>(null);

  readonly title = new FormControl('', { nonNullable: true });
  file?: File;

  /** Nombre de pistes par page, cohérent avec le backend (max 20). */
  private readonly limit = 5;

  constructor() {
    this.load();
  }

  /** Sélection du fichier audio à importer. */
  choose(event: Event): void {
    this.file = (event.target as HTMLInputElement).files?.[0];
    // On efface les messages précédents lors d'une nouvelle sélection
    this.uploadSuccess.set(null);
    this.uploadError.set(null);
    console.debug('[TracksPage] Fichier sélectionné', this.file?.name);
  }

  /**
   * Charge les pistes de la page courante via TrackService.
   * Chaque changement de page déclenche une nouvelle requête HTTP.
   * Aucun découpage local n'est effectué.
   */
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.list(this.page(), this.limit).subscribe({
      next: (response) => {
        console.debug('[TracksPage] Pistes chargées', response.items.length);
        this.tracks.set(response.items);
        this.pages.set(response.pages);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[TracksPage] Chargement impossible', err.status);
        if (err.status === 0) {
          this.error.set('Impossible de joindre le serveur. Vérifiez votre connexion.');
        } else if (err.status === 401) {
          this.error.set('Session expirée. Veuillez vous reconnecter.');
        } else {
          this.error.set('Impossible de charger les pistes. Réessayez plus tard.');
        }
        this.loading.set(false);
      },
    });
  }

  /** Navigation vers une page donnée avec rechargement HTTP. */
  go(page: number): void {
    if (page < 1 || page > this.pages()) return;
    this.page.set(page);
    this.load();
  }

  /** Upload d'une piste via TrackService. */
  upload(): void {
    if (!this.file) return;

    this.uploading.set(true);
    this.uploadSuccess.set(null);
    this.uploadError.set(null);

    this.service.upload(this.file, this.title.value || this.file.name).subscribe({
      next: (track) => {
        console.debug('[TracksPage] Piste envoyée', track.id);
        this.uploadSuccess.set(`Piste « ${track.title} » importée avec succès.`);
        this.title.setValue('');
        this.file = undefined;
        this.uploading.set(false);
        // Retour à la page 1 pour voir la piste nouvellement ajoutée
        this.page.set(1);
        this.load();
      },
      error: (err) => {
        console.error('[TracksPage] Envoi impossible', err.status);
        if (err.status === 0) {
          this.uploadError.set('Impossible de joindre le serveur.');
        } else if (err.status === 400) {
          this.uploadError.set('Format de fichier invalide ou données manquantes.');
        } else if (err.status === 413) {
          this.uploadError.set('Le fichier est trop volumineux (maximum 25 Mo).');
        } else {
          this.uploadError.set('Erreur lors de l\'envoi. Réessayez plus tard.');
        }
        this.uploading.set(false);
      },
    });
  }

  /** Lecture d'une piste via TrackService (streaming blob). */
  play(track: Track): void {
    this.service.audio(track.id).subscribe({
      next: (blob) => {
        console.debug('[TracksPage] Audio chargé', track.id);
        const previousUrl = this.audioUrl();
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        this.audioUrl.set(URL.createObjectURL(blob));
      },
      error: (err) => console.error('[TracksPage] Lecture impossible', err.status),
    });
  }

  /** Formate la taille du fichier en Ko avec une décimale. */
  formatSize(bytes: number): string {
    return (bytes / 1024).toFixed(1);
  }
}
