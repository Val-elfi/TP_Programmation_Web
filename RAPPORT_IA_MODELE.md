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

