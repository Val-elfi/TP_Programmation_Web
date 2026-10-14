import { Component, inject, OnDestroy, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 Mo
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
];

@Component({
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent implements OnDestroy {
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
  /** Piste audio actuellement sélectionnée pour la lecture. */
  readonly currentTrack = signal<Track | null>(null);
  /** Message d'erreur dédié à la lecture audio. */
  readonly audioError = signal<string | null>(null);
  /** Signal indiquant qu'un upload est en cours. */
  readonly uploading = signal(false);
  /** Message de succès après upload. */
  readonly uploadSuccess = signal<string | null>(null);
  /** Message d'erreur d'upload dédié. */
  readonly uploadError = signal<string | null>(null);

  readonly title = new FormControl('', { nonNullable: true });
  file?: File;

  /** Nombre de pistes par page (4 pour une grille 2x2 propre et aérée). */
  private readonly limit = 4;

  constructor() {
    this.load();
  }

  /** Sélection et validation locale du fichier audio à importer. */
  choose(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0];

    // Réinitialisation des messages
    this.uploadSuccess.set(null);
    this.uploadError.set(null);

    if (!selected) {
      this.file = undefined;
      return;
    }

    // Validation 1 : Vérification de la taille (max 25 Mo)
    if (selected.size > MAX_FILE_SIZE) {
      this.uploadError.set('Le fichier sélectionné dépasse la taille limite autorisée de 25 Mo.');
      this.file = undefined;
      input.value = '';
      return;
    }

    // Validation 2 : Vérification du type MIME
    if (selected.type && !ALLOWED_MIME_TYPES.includes(selected.type)) {
      this.uploadError.set('Format de fichier non supporté. Formats acceptés : MP3, WAV, OGG, M4A.');
      this.file = undefined;
      input.value = '';
      return;
    }

    this.file = selected;
    console.debug('[TracksPage] Fichier valide sélectionné :', selected.name, `${(selected.size / (1024 * 1024)).toFixed(2)} Mo`);
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

  /** Upload d'une piste via TrackService après validation préalable. */
  upload(): void {
    if (!this.file) {
      this.uploadError.set('Veuillez sélectionner un fichier audio.');
      return;
    }

    if (this.file.size > MAX_FILE_SIZE) {
      this.uploadError.set('Le fichier sélectionné dépasse la taille limite autorisée de 25 Mo.');
      return;
    }

    if (this.file.type && !ALLOWED_MIME_TYPES.includes(this.file.type)) {
      this.uploadError.set('Format de fichier non supporté. Formats acceptés : MP3, WAV, OGG, M4A.');
      return;
    }

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
    this.audioError.set(null);
    this.currentTrack.set(track);

    this.service.audio(track.id).subscribe({
      next: (blob) => {
        console.debug('[TracksPage] Audio chargé', track.id);
        const previousUrl = this.audioUrl();
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
        this.audioUrl.set(URL.createObjectURL(blob));
      },
      error: (err) => {
        console.error('[TracksPage] Lecture impossible', err.status);
        if (err.status === 404) {
          this.audioError.set(`Le fichier audio pour « ${track.title} » est introuvable sur le serveur (404).`);
        } else if (err.status === 401 || err.status === 403) {
          this.audioError.set('Vous n\'êtes pas autorisé à écouter cette piste audio.');
        } else {
          this.audioError.set(`Impossible de charger le fichier audio de « ${track.title} ».`);
        }
      },
    });
  }

  /**
   * Nettoyage des ressources à la destruction du composant pour éviter les fuites mémoire.
   */
  ngOnDestroy(): void {
    const url = this.audioUrl();
    if (url) {
      console.debug('[TracksPage] Révocation de l\'ObjectURL à la destruction du composant');
      URL.revokeObjectURL(url);
    }
  }

  /** Formate la taille du fichier en Ko ou Mo selon son volume. */
  formatSize(bytes: number): string {
    if (!bytes && bytes !== 0) return '0 Ko';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} Ko`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  }
}
