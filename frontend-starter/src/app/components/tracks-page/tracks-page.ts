import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
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

const COVERS_STORAGE_KEY = 'gpc_track_covers';

@Component({
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent implements OnDestroy {
  private readonly service = inject(TrackService);

  /** Liste brute des pistes reçue du backend pour la page courante. */
  readonly tracks = signal<Track[]>([]);
  /** Numéro de la page courante (commence à 1). */
  readonly page = signal(1);
  /** Nombre total de pages disponibles côté serveur. */
  readonly pages = signal(1);
  /** Nombre total d'éléments dans la bibliothèque. */
  readonly total = signal(0);
  /** Nombre de pistes par page (5 par défaut). */
  readonly limit = signal(5);

  /** Indique si une requête HTTP est en cours. */
  readonly loading = signal(false);
  /** Message d'erreur lisible, null si aucune erreur. */
  readonly error = signal<string | null>(null);
  /** URL blob pour la lecture audio en cours. */
  readonly audioUrl = signal('');
  /** Piste audio actuellement sélectionnée pour la lecture. */
  readonly currentTrack = signal<Track | null>(null);
  /** Indique si le lecteur audio est en train de jouer activement. */
  readonly isPlaying = signal(false);
  /** Indique si l'autoplay a été bloqué par la politique de sécurité du navigateur. */
  readonly autoplayBlocked = signal(false);
  /** Message d'erreur dédié à la lecture audio. */
  readonly audioError = signal<string | null>(null);

  /** Signal indiquant qu'un upload est en cours. */
  readonly uploading = signal(false);
  /** Pourcentage de progression de l'upload (0 à 100%). */
  readonly uploadProgress = signal<number>(0);
  /** Message de succès après upload. */
  readonly uploadSuccess = signal<string | null>(null);
  /** Message d'erreur d'upload dédié. */
  readonly uploadError = signal<string | null>(null);

  /** ID de la piste en cours de suppression (évite les doubles clics). */
  readonly deletingId = signal<string | null>(null);
  /** Notification SnackBar (succès ou erreur). */
  readonly snackbar = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  /** Recherche textuelle par titre ou nom de fichier. */
  readonly searchQuery = signal('');
  /** Critère de tri sélectionné. */
  readonly sortBy = signal<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'size-asc' | 'size-desc'>('date-desc');
  /** Filtre de taille de fichier. */
  readonly sizeFilter = signal<'all' | 'small' | 'medium' | 'large'>('all');

  /** Dictionnaire des images de couverture personnalisées par ID de piste. */
  readonly covers = signal<Record<string, string>>({});

  readonly title = new FormControl('', { nonNullable: true });
  file?: File;
  coverFile?: File;

  /** Indice du premier élément affiché sur la page. */
  readonly startIndex = computed(() => {
    if (this.total() === 0) return 0;
    return (this.page() - 1) * this.limit() + 1;
  });

  /** Indice du dernier élément affiché sur la page. */
  readonly endIndex = computed(() => {
    return Math.min(this.page() * this.limit(), this.total());
  });

  /** Pistes filtrées et triées de manière réactive. */
  readonly displayedTracks = computed(() => {
    let list = [...this.tracks()];

    // 1. Filtre textuel
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter((t) =>
        t.title.toLowerCase().includes(query) || t.originalName.toLowerCase().includes(query),
      );
    }

    // 2. Filtre de taille
    const size = this.sizeFilter();
    if (size === 'small') {
      list = list.filter((t) => t.size < 1024 * 1024); // < 1 Mo
    } else if (size === 'medium') {
      list = list.filter((t) => t.size >= 1024 * 1024 && t.size <= 5 * 1024 * 1024); // 1-5 Mo
    } else if (size === 'large') {
      list = list.filter((t) => t.size > 5 * 1024 * 1024); // > 5 Mo
    }

    // 3. Tri
    const sort = this.sortBy();
    list.sort((a, b) => {
      switch (sort) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'size-asc':
          return a.size - b.size;
        case 'size-desc':
          return b.size - a.size;
        default:
          return 0;
      }
    });

    return list;
  });

  constructor() {
    this.loadCovers();
    this.load();
  }

  /** Charge le dictionnaire des images de couverture depuis le localStorage. */
  private loadCovers(): void {
    try {
      const saved = localStorage.getItem(COVERS_STORAGE_KEY);
      if (saved) {
        this.covers.set(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('[TracksPage] Impossible de lire les couvertures locales', e);
    }
  }

  /** Retourne l'URL data:image de couverture pour une piste donnée, ou null si non personnalisée. */
  getCover(trackId: string): string | null {
    return this.covers()[trackId] || null;
  }

  /** Enregistre une image de couverture en base64 pour une piste. */
  saveCover(trackId: string, base64: string): void {
    const updated = { ...this.covers(), [trackId]: base64 };
    this.covers.set(updated);
    try {
      localStorage.setItem(COVERS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[TracksPage] Stockage local de couverture saturé', e);
    }
  }

  /** Supprime l'image de couverture personnalisée d'une piste. */
  removeCover(track: Track): void {
    const updated = { ...this.covers() };
    delete updated[track.id];
    this.covers.set(updated);
    try {
      localStorage.setItem(COVERS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[TracksPage] Erreur de suppression de couverture locale', e);
    }
    this.showSnackbar(`L'image personnalisée de « ${track.title} » a été supprimée (image par défaut rétablie).`, 'success');
  }

  /** Modification directe de l'image d'une piste via l'input file de la ligne. */
  onCoverChange(event: Event, track: Track): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showSnackbar('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).', 'error');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.saveCover(track.id, reader.result);
        this.showSnackbar(`Image de couverture mise à jour pour « ${track.title} ».`, 'success');
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  /** Sélection optionnelle d'une image de couverture lors de l'import. */
  chooseCover(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0];
    if (selected && !selected.type.startsWith('image/')) {
      this.uploadError.set('Le fichier de couverture doit être une image.');
      input.value = '';
      this.coverFile = undefined;
      return;
    }
    this.coverFile = selected;
  }

  /** Sélection et validation locale du fichier audio à importer. */
  choose(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0];

    // Réinitialisation des messages et de la progression
    this.uploadSuccess.set(null);
    this.uploadError.set(null);
    this.uploadProgress.set(0);

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
   */
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.list(this.page(), this.limit()).subscribe({
      next: (response) => {
        console.debug('[TracksPage] Pistes chargées', response.items.length);
        this.tracks.set(response.items);
        this.pages.set(response.pages);
        this.total.set(response.total);
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

  /** Changement du nombre d'éléments par page. */
  onLimitChange(limit: number): void {
    this.limit.set(limit);
    this.page.set(1);
    this.load();
  }

  /** Navigation vers une page donnée avec rechargement HTTP. */
  go(page: number): void {
    if (page < 1 || page > this.pages()) return;
    this.page.set(page);
    this.load();
  }

  /** Affiche un message SnackBar temporaire (auto-dismiss après 4s). */
  private snackbarTimeoutId?: number;
  showSnackbar(message: string, type: 'success' | 'error' = 'success'): void {
    if (this.snackbarTimeoutId) {
      clearTimeout(this.snackbarTimeoutId);
    }
    this.snackbar.set({ message, type });
    this.snackbarTimeoutId = window.setTimeout(() => {
      this.snackbar.set(null);
    }, 4000);
  }

  /** Suppression sécurisée d'une piste avec confirmation et gestion d'erreurs. */
  deleteTrack(track: Track): void {
    if (this.deletingId()) return;

    const confirmed = window.confirm(`Voulez-vous vraiment supprimer le morceau « ${track.title} » ?`);
    if (!confirmed) return;

    this.deletingId.set(track.id);

    this.service.delete(track.id).subscribe({
      next: () => {
        console.debug('[TracksPage] Piste supprimée avec succès', track.id);
        this.showSnackbar(`Piste « ${track.title} » supprimée avec succès.`, 'success');

        // Si le morceau supprimé était en cours d'écoute, arrêter et révoquer l'URL
        if (this.currentTrack()?.id === track.id) {
          const currentUrl = this.audioUrl();
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
          }
          this.audioUrl.set('');
          this.currentTrack.set(null);
        }

        // Si la page actuelle ne contenait que ce morceau et qu'on est au-delà de la page 1, reculer d'une page
        if (this.tracks().length <= 1 && this.page() > 1) {
          this.page.set(this.page() - 1);
        }

        this.deletingId.set(null);
        this.load();
      },
      error: (err) => {
        console.error('[TracksPage] Erreur lors de la suppression', err.status);
        if (err.status === 404) {
          this.showSnackbar(`La piste « ${track.title} » a déjà été supprimée ou est introuvable.`, 'error');
          this.load();
        } else if (err.status === 403 || err.status === 401) {
          this.showSnackbar(`Vous n'avez pas l'autorisation de supprimer « ${track.title} ».`, 'error');
        } else {
          this.showSnackbar(`Impossible de supprimer « ${track.title} ». Réessayez plus tard.`, 'error');
        }
        this.deletingId.set(null);
      },
    });
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
    this.uploadProgress.set(0);
    this.uploadSuccess.set(null);
    this.uploadError.set(null);

    this.service.upload(this.file, this.title.value || this.file.name).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const percent = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
          this.uploadProgress.set(percent);
          console.debug('[TracksPage] Upload en cours :', percent, '%');
        } else if (event.type === HttpEventType.Response) {
          const track = event.body as Track;
          console.debug('[TracksPage] Upload terminé avec succès :', track.id);
          this.uploadProgress.set(100);

          // Si une image de couverture avait été sélectionnée lors de l'import, la lier à la piste
          if (this.coverFile) {
            const reader = new FileReader();
            const fileToSave = this.coverFile;
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                this.saveCover(track.id, reader.result);
              }
            };
            reader.readAsDataURL(fileToSave);
            this.coverFile = undefined;
          }

          this.uploadSuccess.set(`Piste « ${track.title} » importée avec succès.`);
          this.title.setValue('');
          this.file = undefined;
          this.uploading.set(false);
          // Retour à la page 1 pour voir la piste nouvellement ajoutée
          this.page.set(1);
          this.load();
        }
      },
      error: (err) => {
        console.error('[TracksPage] Envoi impossible', err.status);
        this.uploadProgress.set(0);
        this.uploading.set(false);
        if (err.status === 0) {
          this.uploadError.set('Impossible de joindre le serveur.');
        } else if (err.status === 400) {
          this.uploadError.set('Format de fichier invalide ou données manquantes.');
        } else if (err.status === 413) {
          this.uploadError.set('Le fichier est trop volumineux (maximum 25 Mo).');
        } else {
          this.uploadError.set('Erreur lors de l\'envoi. Réessayez plus tard.');
        }
      },
    });
  }

  /** Lecture / Pause d'une piste via TrackService (streaming blob). */
  play(track: Track): void {
    // Si la piste cliquée est déjà la piste chargée
    if (this.currentTrack()?.id === track.id && this.audioUrl()) {
      const audio = document.querySelector<HTMLAudioElement>('.audio-player audio');
      if (audio) {
        if (this.isPlaying()) {
          audio.pause();
        } else {
          audio.play().catch((err) => {
            console.warn('[TracksPage] Lecture manuelle bloquée :', err);
            this.autoplayBlocked.set(true);
          });
        }
        return;
      }
    }

    this.audioError.set(null);
    this.autoplayBlocked.set(false);
    this.currentTrack.set(track);

    this.service.audio(track.id).subscribe({
      next: (blob) => {
        console.debug('[TracksPage] Audio chargé', track.id, 'Taille:', blob.size, 'Type:', blob.type);
        const previousUrl = this.audioUrl();
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
        // Force le type MIME audio si absent ou générique pour le décodeur du navigateur
        const audioBlob = blob.type ? blob : new Blob([blob], { type: track.mimeType || 'audio/mpeg' });
        this.audioUrl.set(URL.createObjectURL(audioBlob));
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

  /** Déclenchement automatique de la lecture dès que le média est prêt. */
  onAudioCanPlay(audio: HTMLAudioElement): void {
    audio.volume = 1;
    audio.muted = false;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying.set(true);
          this.autoplayBlocked.set(false);
        })
        .catch((err) => {
          console.warn('[TracksPage] Autoplay bloqué par la politique du navigateur :', err);
          this.autoplayBlocked.set(true);
        });
    }
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
