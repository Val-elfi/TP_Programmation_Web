# Rapport d'usage de l'IA — TP1 et TP2

Pour chaque mission, détailler et fournir des explications concernant : objectif, prompt principal, plan proposé par l'agent, vérifications réalisées par le binôme, erreurs ou propositions rejetées, fichiers effectivement modifiés, preuve de fonctionnement, et ce que chaque membre sait maintenant expliquer sans l'agent.

---

# TP1 — Authentification et Gestion de Profil Utilisateur

### 1. Mission 1 (Partie 1 & 2) : Authentification et Profil réactif
- **Objectif** : Implémenter les formulaires réactifs d'inscription, connexion et mise à jour de profil avec gestion des erreurs, stockage sécurisé du JWT, mise à jour réactive via Signal Angular, intercepteur d'autorisation et déconnexion avec nettoyage d'état.
- **Prompts principaux** :
  ```text
  Prompt 1 : Maintenant que tu as les best practices, les consignes de ce qu'il faut respecter, j'aimerais que tu complètes ou réécrives la partie utilisateur du frontend. IMPORTANT : Le composant ne doit pas appeler directement HttpClient: il passe par AuthService. Utiliser inject() et conserver une séparation claire entre interface, service et API. Formulaires réactifs pour l'inscription et la connexion, messages de validation et d'erreur compréhensibles.
  
  Prompt 2 : Appels de /api/auth/register et /api/auth/login ; sauvegarde du JWT côté navigateur, sans jamais l'afficher dans les logs ; mise à jour du Signal currentUser ; redirection après une connexion ou une inscription réussie ; bouton de déconnexion avec nettoyage de l'état local ; chargement de /api/users/me lorsque le profil est demandé ; modification du nom avec PUT /api/users/me ; gestion d'un 401 avec retour vers /login si le token est invalide ou expiré.
  ```
- **Plan proposé par l'agent** :
  1. Créer `AuthService` encapsulant les appels `HttpClient` vers `/api/auth/*` et `/api/users/me`.
  2. Gérer le token dans `localStorage` et exposer `currentUser` via `signal()`.
  3. Mettre en place `authInterceptor` pour injecter automatiquement l'en-tête `Authorization: Bearer <token>` et intercepter les erreurs 401.
  4. Développer les composants `login-page`, `register-page` et `profile-page` avec formulaires réactifs (`FormGroup`, `FormControl`, `Validators`).
- **Fichiers modifiés** :
  - `frontend-starter/src/app/shared/services/auth.service.ts`
  - `frontend-starter/src/app/shared/interceptors/auth.interceptor.ts`
  - `frontend-starter/src/app/components/login-page/*`
  - `frontend-starter/src/app/components/register-page/*`
  - `frontend-starter/src/app/components/profile-page/*`
  - `frontend-starter/src/app/components/app/*`
- **Preuve de fonctionnement** :
  - `npm run build` : compilation sans erreur.
  - Tests backend : `npm test` validé à 100% (5/5 tests passés).

### Questions d'architecture TP1
1. **Quel modèle utilisez-vous dans votre assistant IA ?**
   - **Gemini 3.8 Flash** via Google DeepMind / Antigravity IDE, choisi pour sa rapidité d'exécution et sa précision en programmation agentique.
2. **Comment savoir combien vous avez consommé de tokens ?**
   - Dans l'interface Antigravity / console développeur via les journaux de session et métriques de tokens en entrée/sortie (prompt tokens et completion tokens).
3. **Qui peut vous conseiller quel est le meilleur modèle pour une tâche donnée ?**
   - Les benchmarks publics indépendants (*LMSYS Chatbot Arena*, *SWE-bench*), la documentation constructeur et les recommandations pédagogiques du cours.
4. **Où s'effectue la tâche « mise à jour du profil utilisateur » ?**
   - **Frontend** :
     - Composant : `profile-page.ts` (méthode `save()`) et `profile-page.html`.
     - Service : `auth.service.ts` (méthode `update(name)` appelant `PUT /api/users/me`).
     - Intercepteur : `auth.interceptor.ts` (ajout du header `Authorization`).
   - **Backend** :
     - Route et contrôleur : `backend/src/app.js` (handler `app.put("/api/users/me", auth, ...)`).
     - Modèle de persistance : `backend/src/models/User.js` (validation Mongoose et `findByIdAndUpdate`).

---

# TP2 — Bibliothèque, Upload et Lecture Audio

## Mission 2 — Bibliothèque paginée côté serveur

### 1. Objectif
Implémenter la bibliothèque audio paginée côté serveur avec `TrackService.list(page, limit)`, gestion réactive par Signals (`tracks`, `page`, `pages`, `loading`, `error`), navigation précédente/suivante désactivée aux bornes et nouvelle requête HTTP à chaque changement de page (interdiction formelle de découper localement en mémoire).

### 2. Plan proposé par l'agent
1. Vérifier `TrackService.list(page, limit)` pour qu'il injecte bien `params: { page, limit }` vers `GET /api/tracks`.
2. Déclarer les Signals dans `TracksPageComponent` : `tracks = signal<Track[]>([])`, `page = signal(1)`, `pages = signal(1)`, `loading = signal(false)`, `error = signal<string | null>(null)`.
3. Câbler la méthode `load()` qui interroge le service et met à jour les signaux.
4. Construire le template avec la nouvelle syntaxe `@if`, `@for`, `@empty` et les boutons Précédent/Suivant contrôlés par `go(page)`.

### 3. Fichiers modifiés
- `frontend-starter/src/app/shared/services/track.service.ts`
- `frontend-starter/src/app/components/tracks-page/tracks-page.ts`
- `frontend-starter/src/app/components/tracks-page/tracks-page.html`

---

## Mission 3 — Validation, Upload et Lecture Audio Sécurisée

### 1. Objectifs
1. **Validation locale du fichier audio** : contrôler en amont côté client la taille (≤ 25 Mo) et le type MIME audio valide avant toute requête HTTP pour épargner la bande passante et offrir un retour immédiat.
2. **Cycle de vie et fuites mémoire** : révoquer l'ancienne `ObjectURL` à chaque changement de piste et révoquer l'`ObjectURL` active à la destruction du composant via `OnDestroy` / `ngOnDestroy()`.
3. **État de lecture et erreurs** : afficher le morceau en cours de lecture (`currentTrack`), gérer les erreurs de lecture audio avec un signal dédié (`audioError`), et sécuriser le streaming binaire (`Blob`).
4. **Refonte responsive des cartes** : afficher les pistes sous forme de grille adaptative de cards modernes et accessibles (CSS Grid 2x2 propre, 4 pistes par page pour un rendu visuel net sans débordement) avec titre, nom original, format, taille en Ko/Mo, date formatée via `DatePipe`, et mise en évidence de la piste en lecture.

### 2. Prompts principaux utilisés pour cette mission
- **Prompt 1 (Validation locale d'upload)** :
  ```text
  Contexte : Projet Angular avec Signals. Formulaire d'upload audio TP2.
  Objectif : Sécuriser et valider la sélection du fichier côté client avant tout envoi HTTP vers le backend.
  Consignes :
  1. Validation locale : vérifier que la taille <= 25 Mo et que le type MIME correspond à un format audio valide (MP3, WAV, OGG, M4A).
  2. Gestion des signaux : uploadError dédié, bloquer l'envoi HTTP si invalide, réinitialiser dès qu'un fichier valide est sélectionné.
  3. Extrait TS et template HTML avec message sous l'input file.
  ```
- **Prompt 2 (Lecture audio, OnDestroy et gestion d'erreurs)** :
  ```text
  Contexte : Composant Angular utilisant Signals, élément <audio> et URL.createObjectURL.
  Objectif : Finaliser la lecture audio sécurisée, le cycle de vie mémoire et les retours d'erreurs.
  Consignes :
  1. Cycle de vie : implémenter OnDestroy pour révoquer l'ObjectURL finale via URL.revokeObjectURL(this.audioUrl()) et révoquer l'ancienne URL avant chaque nouvelle lecture.
  2. État du morceau en cours : signal currentTrack = signal<Track | null>(null), affichage du titre et format dans le template.
  3. Gestion d'erreurs : signal audioError pour remplacer console.error et afficher un message clair en UI.
  ```
- **Prompt 3 (Refonte visuelle des Cards en responsive)** :
  ```text
  Contexte : Template Angular de bibliothèque musicale avec @for.
  Objectif : Afficher les pistes sous forme de cartes responsives, modernes et accessibles.
  Consignes :
  1. Données : Titre, nom original, format audio, taille formatée en Ko/Mo, date d'ajout formatée (DatePipe), bouton de lecture.
  2. Responsive : CSS Grid responsive (1 col mobile, 2 à 3 col desktop), mise en évidence visuelle de la carte en cours d'écoute.
  ```

### 3. Fichiers effectivement modifiés
- `frontend-starter/src/app/components/tracks-page/tracks-page.ts` : validation locale, signaux `uploadError`, `audioError`, `currentTrack`, implémentation de `OnDestroy`, méthode `formatSize()`, import de `DatePipe`.
- `frontend-starter/src/app/components/tracks-page/tracks-page.html` : placement des alertes, intégration du `DatePipe`, grille de cartes `.tracks-grid`, affichage du lecteur avec métadonnées en cours.
- `frontend-starter/src/app/components/tracks-page/tracks-page.css` : grille CSS responsive avec media queries, animations, cartes avec état `.is-playing`, badges de format.
- `backend/src/app.js` : ajustement de `res.sendFile` avec `{ dotfiles: "allow" }` pour supporter les répertoires de projet contenant des points.

### 4. Preuve de fonctionnement
- Compilation Angular sans erreur (`npm run build` validé avec succès).
- Build production généré dans `frontend-starter/dist/gpc`.

---

## Réponses aux questions théoriques du TP2

### 1. Le backend envoie-t-il le fichier entier en mémoire ou progressivement depuis le disque (Node streams / chunking) ?
Le backend utilise la méthode Express `res.sendFile(audioPath, ...)` (dans `backend/src/app.js`). En interne, `res.sendFile` s'appuie sur le module `send` de Node.js, qui crée un **ReadStream** (`fs.createReadStream`). Le fichier est découpé en morceaux consécutifs (**chunks**) transmis au fur et à mesure à travers le flux de socket TCP HTTP (mécanisme de *backpressure* et de *streaming*). Le serveur **ne charge donc jamais l'intégralité du fichier en mémoire vive (RAM)**, ce qui permet de servir simultanément de gros fichiers audio sans risque de saturation mémoire (*Out Of Memory*).

### 2. Avec `HttpClient` et `responseType: "blob"`, à quel moment exact le composant reçoit-il le fichier ?
Contrairement à un élément HTML `<audio src="...">` natif capable de démarrer la lecture pendant que le buffering réseau se poursuit, un appel Angular `HttpClient.get('/api/tracks/:id/audio', { responseType: 'blob' })` attend la **réception complète du dernier octet de la réponse HTTP**. C'est seulement à la fermeture de la transaction HTTP que `HttpClient` instancie l'objet binaire `Blob` en mémoire JavaScript et déclenche l'émission dans l'Observable (`next(blob)`).

### 3. Si la bibliothèque contient 100 morceaux, les 100 fichiers audio sont-ils chargés en mémoire dès l'affichage de la liste ? Justifier par rapport au contrat d'API.
**Non, absolument aucun fichier audio n'est chargé en mémoire à l'affichage.** 
- Selon le contrat d'API (`GET /api/tracks?page=1&limit=5`), le serveur ne renvoie qu'un tableau JSON d'objets `Track` contenant des **métadonnées textuelles légères** (`id`, `title`, `originalName`, `mimeType`, `size`, `createdAt`).
- Les données binaires audio résident exclusivement sur le disque du serveur et ne sont sollicitées que de manière unitaire via `GET /api/tracks/:id/audio` lors d'un clic explicite sur le bouton « ▶ Écouter » d'une piste donnée.
- De plus, la pagination serveur découpe la collection : pour 100 morceaux en base, seules 5 métadonnées sont transmises à chaque page.

### 4. Quelle différence y aurait-il en matière de charge réseau et mémoire avec 100 éléments `<audio src="https://...">` ?
Si 100 balises `<audio src="...">` étaient instanciées simultanément dans le DOM :
- **Multiplication des requêtes concurrentes** : Même avec `preload="none"`, les moteurs de rendu de la plupart des navigateurs (Chrome, Firefox, Safari) effectuent des requêtes HTTP Range / HEAD anticipées pour extraire la durée totale, les métadonnées de codec et alimenter le buffer initial.
- **Surcharge réseau et mémoire** : 100 connexions concurrentes ouvertes risquent de saturer le pool de sockets du navigateur (limité à 6 connexions simultanées par domaine HTTP/1.1) et d'engorger la bande passante du serveur.
- **Échec de sécurité** : Les balises `<audio src="...">` émettent des requêtes directes du navigateur qui ne contiennent pas le header `Authorization: Bearer <token>`, provoquant 100 erreurs HTTP `401 Unauthorized`.

### 5. Pourquoi l'URL créée par `URL.createObjectURL` doit-elle être révoquée (gestion du cycle de vie mémoire du navigateur) ?
L'appel `URL.createObjectURL(blob)` enregistre une URL interne (ex. `blob:http://localhost:4200/550e8400...`) dans la table de références mémoire interne du navigateur liée au document hôte. Tant que cette URL existe :
- Le navigateur maintient une référence forte vers le bloc binaire en mémoire RAM.
- Le Garbage Collector a l'interdiction de libérer les mégaoctets occupés par le `Blob`.
- Sans appel explicite à `URL.revokeObjectURL(url)` lors du changement de piste ou lors de la destruction du composant (`ngOnDestroy()`), la mémoire consommée s'accumule indéfiniment à chaque lecture, menant à une **fuite de mémoire majeure (memory leak)** pouvant aller jusqu'au plantage de l'onglet client.

### 6. Pourquoi une URL directement placée dans l'attribut `<audio src="...">` ne reçoit-elle pas automatiquement le header Authorization JWT ?
Les requêtes déclenchées par les attributs natifs HTML (`src` sur `<img>`, `<audio>`, `<video>`, `<script>`) sont gérées directement par la couche réseau bas-niveau du navigateur. Elles ne transitent pas par la couche applicative JavaScript d'Angular :
- Ni `HttpClient`, ni les `HttpInterceptorFn` (`authInterceptor`) ne sont exécutés.
- Aucun intercepteur ne peut donc injecter dynamiquement le header `Authorization: Bearer <token>` stocké dans le `localStorage` / `signal`.
- Le seul moyen d'authentifier une ressource chargée par un attribut `src` natif sans intercepteur serait d'utiliser un cookie `HttpOnly` ou un jeton éphémère passé en paramètre d'URL (query param `?token=...`), d'où la nécessité de passer par `HttpClient` avec `responseType: "blob"` puis `URL.createObjectURL()`.

---

## Protocole pas-à-pas pour les captures Network DevTools (Preuves obligatoires)

Pour capturer les 3 preuves requises pour le livrable du TP2 :

### 1. Preuve 1 : Requête GET avec pagination (`?page=...&limit=...`)
1. Ouvrez votre application sur `http://localhost:4200/tracks`.
2. Ouvrez les DevTools de votre navigateur (**F12** ou **Ctrl + Shift + I**), onglet **Network** (Réseau).
3. Cochez le filtre **Fetch/XHR**.
4. Cliquez sur le bouton « **Suivant →** » ou « **← Précédent** » de la pagination.
5. Dans la liste des requêtes, cliquez sur la requête `tracks?page=2&limit=5`.
6. **Capture à réaliser** : Montrer l'onglet **Headers** avec :
   - *Request URL* : `http://localhost:4200/api/tracks?page=2&limit=5`
   - *Status Code* : `200 OK`
   - L'en-tête de requête *Authorization* : `Bearer eyJ...`
   - L'onglet *Response* affichant l'objet JSON contenant `items` (5 pistes), `page: 2`, `pages`, et `total`.

### 2. Preuve 2 : Requête POST multipart/form-data (Upload de fichier)
1. Toujours sur l'onglet **Network** avec le filtre **Fetch/XHR**.
2. Dans le formulaire « Importer », saisissez un titre (ex. « Piste Test Démo ») et sélectionnez un fichier audio (ex. `backing-track.mp3`).
3. Cliquez sur le bouton « **Envoyer** ».
4. Repérez la requête `POST tracks` avec le statut `201 Created`.
5. **Capture à réaliser** :
   - Dans l'onglet **Headers** : vérifier `Request Method: POST` et `Content-Type: multipart/form-data; boundary=...`.
   - Dans l'onglet **Payload** (ou Charge utile) : vérifier la présence des 2 champs du `FormData` :
     - `title` : valeur texte saisie.
     - `audio` : fichier binaire avec son nom d'origine et sa taille.
   - Dans l'onglet **Response** : la piste créée retournée par l'API avec son `id` généré.

### 3. Preuve 3 : Requête GET binaire sécurisée (`/api/tracks/:id/audio`)
1. Dans la liste des pistes, cliquez sur le bouton « **▶ Écouter** » d'une carte audio.
2. Dans l'onglet **Network**, repérez la requête `GET audio` (URL : `/api/tracks/<ID>/audio`).
3. **Capture à réaliser** :
   - Dans l'onglet **Headers** :
     - *Status Code* : `200 OK`.
     - *Request Headers* : `Authorization: Bearer <token>` (prouve que l'intercepteur a fonctionné sur la requête audio binaire).
     - *Response Headers* : `Content-Type: audio/mpeg` (ou `audio/wav`).
   - Vérifier que le lecteur audio dans l'interface s'affiche avec la piste en cours et démarre la lecture.

---

# TP3 — Fiabilisation et Enrichissement du Frontend

## Mission 5 — Suppression sécurisée d'une piste

### 1. Objectif
Permettre à l'utilisateur de supprimer définitivement une piste depuis sa carte avec confirmation utilisateur, protection anti-double-clic, notification SnackBar de succès/erreur, rafraîchissement dynamique de la liste (avec recul de page automatique si la page se vide), et révocation immédiate du lecteur audio si le morceau supprimé était en cours d'écoute.

### 2. Prompt utilisé
```text
Prompt 1 — Suppression sécurisée d'une piste (Mission 5)
Contexte : Projet Angular avec Signals et cartes de bibliothèque audio. Backend fournit DELETE /api/tracks/:id protégé par JWT.
Objectif : Permettre à l'utilisateur de supprimer une piste depuis sa carte avec confirmation, état de suppression et retour visuel.
Consignes :
1. Service TrackService : ajouter delete(id: string) appelant HttpClient.delete<void>(/api/tracks/${id}).
2. Composant TracksPageComponent : signal deletingId anti-double clic, confirmation préalable (window.confirm), notification SnackBar (auto-dismiss), rafraîchissement de liste et arrêt de lecture si piste active. Gestion des erreurs 404 et 403.
3. Template : bouton « 🗑️ Supprimer » avec désactivation et spinner/texte pendant la suppression.
```

### 3. Plan proposé et vérifications
- **Service** : Ajout de la méthode `delete(id: string)` dans `TrackService`.
- **Composant** : Ajout des signaux `deletingId = signal<string | null>(null)` et `snackbar = signal<{ message: string; type: 'success' | 'error' } | null>(null)`.
- **Sécurité et robustesse** :
  - Confirmation obligatoire pour prévenir les suppressions accidentelles.
  - Révocation de l'URL Blob et réinitialisation de `currentTrack` si le morceau supprimé était en cours de lecture.
  - Décrémentation de la page si l'utilisateur supprime la dernière piste de la page courante.

### 4. Fichiers modifiés
- `frontend-starter/src/app/shared/services/track.service.ts`
- `frontend-starter/src/app/components/tracks-page/tracks-page.ts`
- `frontend-starter/src/app/components/tracks-page/tracks-page.html`
- `frontend-starter/src/app/components/tracks-page/tracks-page.css`

---

## Mission 6 — Suivi de progression de l'upload audio

### 1. Objectif
Faire évoluer l'upload unitaire en une opération asynchrone observable avec suivi de progression en temps réel, calcul du pourcentage d'avancement, affichage d'une barre de progression interactive et verrouillage complet des contrôles du formulaire pour interdire les doubles soumissions.

### 2. Prompt utilisé
```text
Prompt 2 — Suivi de progression de l'upload audio (Mission 6)
Contexte : Composant d'upload audio Angular. Évolution pour afficher le pourcentage d'envoi.
Objectif : Écouter les événements de progression HTTP d'Angular et afficher une barre de progression en temps réel.
Consignes :
1. TrackService.upload() : configurer { reportProgress: true, observe: 'events' } et renvoyer Observable<HttpEvent<Track>>.
2. Signaux : uploadProgress = signal<number>(0), calcul du % sur HttpEventType.UploadProgress, traitement du succès sur HttpEventType.Response.
3. Template : <progress [value]="uploadProgress()" max="100"> avec libellé en direct et verrouillage des inputs.
```

### 3. Plan proposé et vérifications
- **Service** : Modification de `upload()` pour transmettre les options `reportProgress: true` et `observe: 'events'` à `HttpClient.post`.
- **Composant** : Signal `uploadProgress`, écoute des événements `HttpEventType.UploadProgress` (`(100 * loaded) / total`) et `HttpEventType.Response` (succès à 100%, réinitialisation du formulaire et rechargement de la bibliothèque).
- **Template & CSS** : Intégration d'une barre de progression animée avec gradient de couleur et désactivation de tous les champs de saisie (`[disabled]="uploading()"`).

### 4. Fichiers modifiés
- `frontend-starter/src/app/shared/services/track.service.ts`
- `frontend-starter/src/app/components/tracks-page/tracks-page.ts`
- `frontend-starter/src/app/components/tracks-page/tracks-page.html`
- `frontend-starter/src/app/components/tracks-page/tracks-page.css`

---

## Mission 7 — Tests automatisés Angular (Vitest & HttpTestingController)

### 1. Objectif
Mettre en place une suite de tests unitaires et d'intégration HTTP automatisés dans `frontend-starter`, totalement indépendants du backend Express et de la base MongoDB, vérifiant les contrats d'API, les paramètres de requêtes, les méthodes HTTP et l'injection des headers d'autorisation.

### 2. Prompt utilisé
```text
Prompt 3 — Tests automatisés Angular avec HttpTestingController (Mission 7)
Contexte : Suite de tests frontend-starter avec Vitest. Écrire au moins 3 tests isolés sans dépendre du backend ni de MongoDB.
Consignes :
1. track.service.spec.ts : Test 1 (list avec page & limit) et Test 2 (delete).
2. auth.interceptor.spec.ts : Test 3 (injection du Bearer token).
3. auth.service.spec.ts : Test bonus (login avec POST et sauvegarde du token).
4. Exécution et vérification avec npm test.
```

### 3. Fichiers de tests créés
1. `src/app/shared/services/track.service.spec.ts` :
   - Test 1 : `TrackService.list(2, 4)` transmet bien les query params `page=2` et `limit=4` sur `GET /api/tracks`.
   - Test 2 : `TrackService.delete(trackId)` exécute bien une requête `DELETE /api/tracks/:id`.
2. `src/app/shared/interceptors/auth.interceptor.spec.ts` :
   - Test 3 : `authInterceptor` ajoute bien le header `Authorization: Bearer <token>` si un jeton est présent.
   - Test 4 : `authInterceptor` ne transmet aucun header `Authorization` en l'absence de session.
3. `src/app/shared/services/auth.service.spec.ts` :
   - Test 5 : `AuthService.login()` envoie `POST /api/auth/login` avec le corps JSON attendu et persiste le token.

### 4. Preuve d'exécution des tests (`npm test`)
```text
> gpc-angular-starter@1.0.0 test
> ng test --watch=false

 RUN  v4.1.11 C:/.../frontend-starter

 ✓  gpc  src/app/shared/services/track.service.spec.ts (2 tests)
 ✓  gpc  src/app/shared/services/auth.service.spec.ts (1 test)
 ✓  gpc  src/app/shared/interceptors/auth.interceptor.spec.ts (2 tests)

 Test Files  3 passed (3)
      Tests  5 passed (5)
   Duration  52s
```

---

## Réponses aux questions théoriques du TP3 (Restitution orale)

### 1. Pourquoi la suppression passe-t-elle par un service et pourquoi le guard/l'interface ne suffisent pas à la sécuriser ?
- **Séparation des responsabilités (Service)** : Le composant gère uniquement l'affichage et l'interaction utilisateur. Tout appel HTTP passe obligatoirement par `TrackService` pour garantir la maintenabilité, la réutilisabilité et la possibilité de tester le composant avec des mocks sans dépendre d'un réseau réel.
- **Illusion de sécurité côté client** : Les guards de route Angular (`canActivate`) et les interfaces graphiques n'offrent qu'une protection ergonomique (masquer un bouton ou rediriger un visiteur anonyme). Tout utilisateur peut ouvrir la console du navigateur ou utiliser un client HTTP externe (curl, Postman) pour émettre directement un `DELETE /api/tracks/:id`. Seul le **backend** vérifie la validité cryptographique du JWT et contrôle en base de données que `track.ownerId === req.auth.sub`.

### 2. Comment le backend protège-t-il réellement la suppression ?
Dans `backend/src/app.js` (handler `app.delete("/api/tracks/:id", auth, ...)`), la protection repose sur deux verrous incontournables :
1. **Le middleware `auth`** : Valide la signature HMAC du JWT avec le secret serveur et extrait l'identifiant de l'utilisateur authentifié (`req.auth.sub`).
2. **La requête atomique Mongoose** :
   ```javascript
   const track = await Track.findOneAndDelete({
     _id: req.params.id,
     ownerId: req.auth.sub, // DOUBLE CONDITION OBLIGATOIRE
   });
   ```
   Si l'identifiant de la piste existe mais appartient à un autre utilisateur, la requête ne retourne aucun document (`track === null`). Le serveur renvoie un code `404 Not Found` (ou 403), protégeant les données sans même révéler l'existence de la piste d'autrui. Le fichier physique n'est supprimé du disque (`fs.unlinkSync`) que si cette vérification a réussi.

### 3. Comment Angular calcule-t-il le pourcentage d’upload avec `reportProgress` ?
Lorsque l'option `{ reportProgress: true, observe: 'events' }` est configurée sur `HttpClient.post()`, Angular écoute directement les événements d'envoi de la couche sous-jacente (`XMLHttpRequest.upload.onprogress` ou les flux Fetch).
- À chaque paquet d'octets transféré vers le serveur, le navigateur déclenche un événement contenant `event.loaded` (octets déjà envoyés) et `event.total` (taille totale calculée à partir du `Content-Length` du multipart).
- Angular encapsulate ces notifications sous forme d'objets `HttpEvent` avec `event.type === HttpEventType.UploadProgress`.
- La formule mathématique dans le composant est :
  $$\text{uploadProgress} = \text{Math.round}\left(\frac{100 \times \text{event.loaded}}{\text{event.total}}\right)$$

### 4. Pourquoi les tests HTTP avec `HttpTestingController` n’ont-ils pas besoin de backend ni de MongoDB ?
`HttpTestingController` est un mécanisme de **bouchonnage (mocking)** fourni par `@angular/common/http/testing`.
- Il remplace le backend réseau réel par un intercepteur en mémoire qui capture instantanément toutes les requêtes sortantes émises par `HttpClient`.
- Il permet au développeur d'inspecter l'URL, les paramètres (`page`, `limit`), les headers et la méthode HTTP (`DELETE`, `GET`), puis de simuler une réponse arbitraire avec `req.flush(données)`.
- Cela rend les tests **ultra-rapides, déterministes, reproductibles sur des serveurs d'intégration continue (CI)** et totalement indépendants de l'état d'une base de données ou de la disponibilité d'un serveur distant.

### 5. Que vérifie un test d’intercepteur ou de guard ?
- **Test d'intercepteur** : Vérifie que le pipeline HTTP modifie correctement les requêtes sortantes (ex: ajout automatique du header `Authorization: Bearer <token>` lorsque l'utilisateur est connecté, et absence de header si déconnecté) et gère correctement les codes d'erreur entrants (ex: interception d'une 401 pour déclencher `auth.logout()` et la redirection vers `/login`).
- **Test de guard** : Vérifie la logique de protection des routes de navigation (`canActivate`). Si l'utilisateur possède un token valide, le guard renvoie `true` ; si l'utilisateur n'a pas de token, il renvoie `false` (ou un `UrlTree`) et ordonne la redirection vers `/login`.

### 6. Quelle est la différence entre un test unitaire et un test d’intégration ?
- **Test unitaire** : Isole la plus petite unité de code possible (une fonction, une méthode de service) en remplaçant toutes ses dépendances externes par des doubles de test (mocks, stubs). Exemple : tester que `formatSize(2048)` renvoie `'2.0 Ko'`.
- **Test d’intégration** : Vérifie que plusieurs composants ou modules logiciels fonctionnent correctement ensemble lorsqu'ils sont interconnectés. Exemple : vérifier que l'appel d'une méthode de service traverse bien l'intercepteur HTTP, encode les paramètres, puis émet la réponse vers l'abonné dans le bon format.

---

## Protocole pas-à-pas pour les captures Network DevTools (Preuves TP3)

### 1. Preuve 1 : Requête DELETE d'une piste
1. Ouvrez l'application sur `http://localhost:4200/tracks` avec les DevTools ouverts (**F12**), onglet **Network** (filtre **Fetch/XHR**).
2. Sur l'une des cartes de votre bibliothèque, cliquez sur le bouton rouge « **🗑️** » (Supprimer).
3. Une boîte de dialogue de confirmation native s'affiche : confirmez en cliquant sur **OK**.
4. Dans la liste des requêtes Network, repérez la ligne :
   - *Name* : `<ID_DE_LA_PISTE>`
   - *Method* : `DELETE`
   - *Status* : `204 No Content` (ou `200 OK`).
5. **Capture à réaliser** :
   - Onglet **Headers** : URL `http://localhost:4200/api/tracks/<ID>`, `Request Method: DELETE`, et header `Authorization: Bearer <token>`.
   - L'interface Angular en arrière-plan montrant le message de succès vert SnackBar « Piste supprimée avec succès ».

### 2. Preuve 2 : Requête d'upload avec progression
1. Dans l'onglet **Network**, activez le bridage réseau (Throttling) en choisissant **Fast 3G** ou **Slow 3G** (pour ralentir l'envoi et observer la barre de progression).
2. Sélectionnez un fichier audio de 5 à 10 Mo dans le formulaire d'import.
3. Cliquez sur « **Envoyer** ».
4. Observez la barre de progression monter en temps réel (`Envoi en cours (45%)…`).
5. **Capture à réaliser** :
   - Prendre une capture d'écran pendant que la barre de progression est active (ex. à 50%) avec la requête `POST /api/tracks` en état *Pending* dans l'onglet Network.


