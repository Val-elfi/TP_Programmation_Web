# Rapport d'usage de l'IA - TP1

Pour chaque mission, détailler et fournir des explications concernant : objectif; prompt principal; plan proposé par l'agent; vérifications réalisées par le binôme; erreurs ou propositions rejetées; fichiers effectivement modifiés; preuve de fonctionnement; ce que chaque membre sait maintenant expliquer sans l'agent.

---

## Mission 1 (Partie Backend) : Analyse, sécurisation et test de la route `PUT /api/users/me` (Profil utilisateur)

### 1. Objectif
- Sécuriser et fiabiliser la route backend de mise à jour du profil utilisateur (`PUT /api/users/me`).
- Vérifier la conformité avec `API_CONTRACT.md` et les bonnes pratiques de développement backend (`backend/best-practices.md`, `backend/AGENTS.md`).
- Valider les données reçues (`name`) en amont avant toute écriture en base MongoDB.
- Mettre en place des tests automatisés couvrant les cas d'authentification (`401`) et de validation (`400`).

### 2. Prompt principal
```text
Lis backend/AGENTS.md, backend/best-practices.md et les parties pertinentes de
API_CONTRACT.md. Analyse d’abord la route concernée, décris son flux et propose
les fichiers à modifier. Ne change pas le contrat API sans mettre à jour
`API_CONTRACT.md` dans la même mission et ne touche jamais aux secrets. Après
validation, implémente une modification limitée, lance les tests et signale
chaque erreur.
```

### 3. Plan proposé par l'agent
1. **Cartographie et description du flux de la requête** :
   `Client HTTP -> Middleware express.json() -> Middleware auth (vérification JWT) -> Handler PUT /api/users/me -> Modèle Mongoose User -> MongoDB Atlas -> Sérialisation toPublic() -> Réponse HTTP 200`.
2. **Identification des fichiers cibles** :
   - `backend/src/app.js` pour la validation précoce du champ `name`.
   - `backend/test/api.test.js` pour les tests automatisés de non-régression.
3. **Attente de validation explicite du binôme** avant toute modification de code.
4. **Implémentation limitée et exécution des tests automatisés** (`npm test`).

### 4. Vérifications réalisées par le binôme
- Vérification que le contrat API (`API_CONTRACT.md`) est strictement respecté : la méthode (`PUT`), la route (`/api/users/me`), l'en-tête (`Authorization: Bearer <token>`) et le format de réponse (`200 User`) restent identiques.
- Vérification qu'aucun secret (`.env`, `JWT_SECRET`, identifiants MongoDB) n'a été altéré ou consigné dans les logs.
- Validation humaine de la proposition avant modification effective des fichiers sources.
- Contrôle des résultats des tests Node.js via le terminal.

### 5. Erreurs ou propositions rejetées
- **Rejet de la modification directe en base sans validation applicative** : initialement, une valeur invalide pour `name` reposait uniquement sur les validateurs Mongoose en écriture. Le rejet d'une entrée vide ou trop courte (< 2 caractères) dès la couche contrôleur/route Express permet d'éviter un aller-retour réseau inutile vers MongoDB Atlas et produit un message d'erreur plus explicite.
- **Préservation stricte des secrets** : interdiction absolue de logger le corps complet de la requête ou le jeton JWT.

### 6. Fichiers effectivement modifiés
- `backend/src/app.js` : ajout du nettoyage (`trim()`) et de la validation de la taille minimale (>= 2 caractères) de `req.body.name` avant l'appel `User.findByIdAndUpdate`.
- `backend/test/api.test.js` : ajout des tests automatisés pour `PUT /api/users/me` :
  - Rejet sans en-tête `Authorization` (`401`).
  - Rejet avec un jeton corrompu/invalide (`401`).
  - Rejet avec un nom vide ou trop court (`400`).

### 7. Preuve de fonctionnement
Exécution de la commande `npm test` dans `backend/` :
```text
> gpc-api@3.0.0 test
> node --test

✔ health sans dépendre de MongoDB
✔ schémas Mongoose et relation
✔ PUT /api/users/me refuse une requête sans en-tête Authorization (401)
✔ PUT /api/users/me refuse un jeton invalide (401)
✔ PUT /api/users/me refuse un nom manquant ou inférieur à 2 caractères (400)
ℹ tests 5
ℹ pass 5
ℹ fail 0
```

### 8. Ce que chaque membre sait maintenant expliquer sans l'agent
- **Trajet d'une requête HTTP sécurisée** :
  1. Le client Angular envoie une requête HTTP `PUT /api/users/me` avec le header `Authorization: Bearer <JWT>` et le corps `{ "name": "..." }`.
  2. Le middleware `auth` dans Express extrait le JWT après le mot-clé `Bearer`, vérifie cryptographiquement sa signature et son expiration via `jwt.verify(..., SECRET)`.
  3. Le middleware `auth` injecte l'identifiant MongoDB de l'utilisateur dans `req.auth.sub`.
  4. Le handler vérifie que le champ `name` est valide avant d'exécuter `User.findByIdAndUpdate()`.
  5. Le document utilisateur est mis à jour dans MongoDB, puis transformé via la méthode `toPublic()` du modèle Mongoose pour renvoyer uniquement les champs autorisés (`id`, `name`, `email`, `createdAt`), en excluant expressément le champ `passwordHash`.
- **Localisation du code** :
  - Côté frontend : `ProfilePageComponent.save()` (`profile-page.ts`) -> `AuthService.update()` (`auth.service.ts`).
  - Côté backend : `app.put("/api/users/me")` (`app.js`) -> `User.findByIdAndUpdate` (`models/User.js`).

---

## Mission 1 (Partie Frontend) : Formulaires réactifs pour l'inscription et la connexion avec messages de validation

### 1. Objectif
- Réécrire et fiabiliser la gestion utilisateur côté Angular : inscription (`RegisterPageComponent`) et connexion (`LoginPageComponent`).
- Utiliser impérativement des Reactive Forms (`FormGroup`, `FormControl`, `Validators`).
- Garantir qu'aucun composant n'appelle directement `HttpClient` : tout appel passe obligatoirement par `AuthService` injecté via `inject()`.
- Fournir des messages d'erreur et de validation explicites, compréhensibles et contextualisés (champ requis, format email, longueur minimale de mot de passe et de nom, codes d'erreur backend 400, 401, 409, indisponibilité réseau).

### 2. Prompt principal
```text
Maintenant que tu as les best practices, les consignes de ce qu'il faut respecter, j'aimerais que tu completes ou réecrit la partie utilisateur du frontend, j'aimerais avant toute chose IMPORTANT : Le composant ne doit pas appeler directement HttpClient: il passe par AuthService. Utiliser inject()et conserver une séparation claire entre interface, service et API.

Première chose a faire, un formulaire réactifs pour l'inscription et la connexion, en deuxième, un message de validation et d'erreur compréhensibles. On voit ensuite pour continuer , pour le moment fait moi ça stp
```

### 3. Plan proposé par l'agent
1. **Refonte de `LoginPageComponent`** :
   - Mise en place du `FormGroup` avec validateurs : `email` (`required`, `email`) et `password` (`required`, `minLength(8)`).
   - Getters pour accès direct et typé dans le template HTML.
   - Contrôle à la soumission : `if (this.form.invalid) { this.form.markAllAsTouched(); return; }`.
   - État réactif de chargement (`loading`) et d'erreur (`errorMessage`) par Signals.
   - Délégation complète de la requête à `AuthService.login()`.
   - Template avec messages de validation sous chaque champ et bandeau d'alerte pour les retours HTTP (401, 0, etc.).
2. **Refonte de `RegisterPageComponent`** :
   - Mise en place du `FormGroup` avec validateurs : `name` (`required`, `minLength(2)`), `email` (`required`, `email`) et `password` (`required`, `minLength(8)`).
   - Getters pour `name`, `email`, `password`.
   - Contrôle à la soumission avec `markAllAsTouched()`.
   - Délégation complète à `AuthService.register()`.
   - Gestion spécifique des retours HTTP : `409` (email déjà existant), `400` (format invalide), `0` (backend non joignable).
3. **Styles dédiés (`login-page.css` et `register-page.css`)** :
   - Indicateurs visuels pour les champs invalides (`.input-invalid`).
   - Typographie rouge accessible pour les messages d'erreur sous champ (`.field-error`).
   - Bandeau d'alerte clair pour les erreurs de service/serveur (`.alert-error`).
4. **Vérification de compilation** :
   - Validation via `npm run build` dans `frontend-starter/`.

### 4. Vérifications réalisées par le binôme
- **Séparation stricte des responsabilités** : inspection du code TypeScript pour confirmer l'absence d'import et d'appel à `HttpClient` dans les composants (seul `AuthService` est injecté via `inject(AuthService)`).
- **Validation réactive** : tentative de soumission de formulaires vides ou invalides pour vérifier l'affichage immédiat des messages d'erreur sans appel réseau prématuré.
- **Retours serveur** : vérification que les messages d'erreur serveur (ex. `401 Unauthorized` ou `409 Conflict`) sont traduits en phrases claires pour l'utilisateur final.
- **Compilation** : exécution de `ng build` avec succès.

### 5. Erreurs ou propositions rejetées
- **Rejet de l'appel direct à `HttpClient` depuis le composant** : cela briserait la séparation des couches et rendrait le composant difficile à tester.
- **Rejet des valeurs en dur dans le formulaire de login** : initialement, des valeurs de démonstration étaient codées en dur dans le code Angular, ce qui est contraire aux bonnes pratiques de sécurité du projet.
- **Rejet des messages d'erreur génériques** : remplacement du simple `Erreur` par des messages précis indiquant la cause exacte (mot de passe trop court, email invalide, identifiants incorrects).

### 6. Fichiers effectivement modifiés
- `frontend-starter/src/app/components/login-page/login-page.ts` : formulaires réactifs, getters, gestion d'erreurs HTTP détaillées.
- `frontend-starter/src/app/components/login-page/login-page.html` : labels accessibles, messages d'erreurs par champ et bandeau d'alerte.
- `frontend-starter/src/app/components/login-page/login-page.css` : styles pour inputs invalides et messages d'erreurs.
- `frontend-starter/src/app/components/register-page/register-page.ts` : formulaires réactifs, gestion de la création de compte.
- `frontend-starter/src/app/components/register-page/register-page.html` : champs nom, email, mot de passe avec validation réactive.
- `frontend-starter/src/app/components/register-page/register-page.css` : styles de formulaire et alertes.
- `RAPPORT_IA_MODELE.md` : mise à jour avec le compte-rendu de la mission frontend.

### 7. Preuve de fonctionnement
Compilation Angular (`npm run build` dans `frontend-starter/`) :
```text
> gpc-angular-starter@1.0.0 build
> ng build

√ Building...
Initial chunk files | Names         |  Raw size | Estimated transfer size
main.js             | main          | 298.85 kB |                78.50 kB
styles.css          | styles        |   1.28 kB |               493 bytes

                    | Initial total | 300.13 kB |                79.00 kB

Application bundle generation complete. [1.691 seconds]
```

### 8. Ce que chaque membre sait maintenant expliquer sans l'agent
- Comment fonctionne un formulaire réactif Angular (`FormGroup` / `FormControl`) et comment lier les champs avec `formControlName`.
- Comment vérifier l'état d'un champ avec `invalid && touched` pour ne pas afficher d'erreur avant que l'utilisateur n'ait interagi avec le champ.
- Pourquoi `markAllAsTouched()` est utile lors de la soumission pour mettre en évidence tous les champs incorrects si l'utilisateur clique directement sur le bouton.
- Pourquoi l'utilisation de `inject()` remplace avantageusement l'injection par constructeur dans les composants standalone modernes d'Angular.

---

## Mission 1 (Partie Frontend - Suite) : Authentification complète, Gestion du JWT, Profil et Déconnexion

### 1. Objectif
- Connecter les formulaires d'inscription et de connexion aux endpoints `/api/auth/register` et `/api/auth/login`.
- Assurer la sauvegarde sécurisée du JWT dans le `localStorage` du navigateur sans jamais l'exposer ni le journaliser dans la console.
- Mettre à jour le Signal réactif `currentUser` pour synchroniser l'affichage utilisateur dans toute l'application.
- Assurer la redirection automatique vers `/tracks` après une authentification réussie.
- Ajouter un bouton de déconnexion dans l'entête avec nettoyage intégral de l'état local (`localStorage` et Signals).
- Charger automatiquement le profil `/api/users/me` dès l'ouverture de la page profil.
- Permettre la modification du nom d'utilisateur avec `PUT /api/users/me` et répercuter le changement immédiatement.
- Gérer les erreurs HTTP `401` via un intercepteur pour déconnecter automatiquement l'utilisateur et le renvoyer vers `/login` si son jeton est invalide ou expiré.
- Respecter scrupuleusement la séparation des couches : aucun composant n'appelle directement `HttpClient`, tout passe par `AuthService` injecté avec `inject()`.

### 2. Prompt principal
```text
Pour continuer j'aimerais que tu fasses : 
appels de /api/auth/register et /api/auth/login ;
sauvegarde du JWT côté navigateur, sans jamais l'afficher dans les logs ;
mise à jour du Signal currentUser ;
redirection après une connexion ou une inscription réussie ;
bouton de déconnexion avec Nettoyage de l'état local ;
chargement de /api/users/me lorsque le profil est demandé ;
modification du nom avec PUT /api/users/me ;
gestion d'un 401, avec retour vers /login si le token est invalide ou expiré.

Je répète cette consigne importante : 
Le composant ne doit pas appeler directement HttpClient: il passe par AuthService. Utiliser inject() et conserver une séparation claire entre interface, service et API.
```

### 3. Plan proposé par l'agent
1. **Évolution de `AuthService` (`src/app/shared/services/auth.service.ts`)** :
   - Initialisation du profil au démarrage si un token est déjà présent dans le `localStorage`.
   - Méthode `storeAuthentication(response)` : stockage du token et de l'utilisateur sans aucun log de la valeur du JWT.
   - Méthode `logout()` : suppression de la clé `gpc_token` et réinitialisation des Signals `token` et `currentUser` à `null`.
   - Méthodes `profile()` (`GET /api/users/me`) et `update(name)` (`PUT /api/users/me`) avec mise à jour du Signal `currentUser`.
2. **Gestion centralisée du code 401 dans `authInterceptor` (`src/app/shared/interceptors/auth.interceptor.ts`)** :
   - Injection de l'en-tête `Authorization: Bearer <token>`.
   - Utilisation de `catchError` pour intercepter les erreurs HTTP `401` (hors route de login).
   - Nettoyage automatique de la session via `auth.logout()` et redirection vers `/login`.
3. **Chargement et mise à jour du profil dans `ProfilePageComponent` (`src/app/components/profile-page/`)** :
   - Implémentation du hook de cycle de vie `OnInit` pour appeler `load()` automatiquement.
   - Formulaire réactif pour le champ `name` avec validation (obligatoire, min. 2 caractères).
   - Méthode `save()` appelant `auth.update(name)` avec gestion des états d'enregistrement (`saving`), des alertes de succès et d'erreur.
4. **Bouton de déconnexion et salutation dans `AppComponent` (`src/app/components/app/`)** :
   - Injection de `AuthService` et `Router`.
   - Affichage conditionnel dans la barre de navigation : si authentifié, affichage du nom de l'utilisateur (`auth.currentUser()?.name`), des liens internes et du bouton "Déconnexion".
5. **Validation complète** :
   - Compilation Angular avec `npm run build`.
   - Vérification de non-régression sur les tests backend (`npm test`).

### 4. Vérifications réalisées par le binôme
- **Vérification de sécurité sur le JWT** : contrôle méticuleux de tous les appels `console.debug` / `console.log` : aucun jeton JWT n'est affiché dans la console navigateur. Seuls les identifiants publics (`user.id`) sont manipulés pour le traçage.
- **Vérification de la séparation des couches** : confirmation qu'aucun composant (`LoginPageComponent`, `RegisterPageComponent`, `ProfilePageComponent`, `AppComponent`) n'injecte ni n'utilise `HttpClient`.
- **Vérification du flux de déconnexion** : test du clic sur "Déconnexion" -> inspection de l'onglet Application (Local Storage) confirmant la disparition de `gpc_token`, mise à jour immédiate de la barre de navigation et redirection vers `/login`.
- **Vérification du Signal `currentUser`** : modification du nom sur la page profil -> le nom affiché dans la barre de navigation en haut de l'écran est instantanément mis à jour grâce à la réactivité des Signals Angular.
- **Vérification de l'interception 401** : simulation d'un jeton altéré -> l'intercepteur intercepte le `401`, purge le `localStorage` et redirige sans boucle infinie vers `/login`.

### 5. Erreurs ou propositions rejetées
- **Rejet de l'interception 401 sur `/api/auth/login`** : si l'utilisateur saisit un mauvais mot de passe sur la page de connexion, l'API renvoie un 401. Déclencher un `logout()` et une redirection dans l'intercepteur dans ce cas précis masquerait le message d'erreur du formulaire. L'intercepteur exclut donc explicitement l'URL de connexion.
- **Rejet du rechargement manuel du profil** : l'utilisateur ne doit pas avoir à cliquer sur un bouton pour voir ses données de profil lorsqu'il arrive sur la page ; le chargement s'exécute automatiquement via `ngOnInit()`.

### 6. Fichiers effectivement modifiés
- `frontend-starter/src/app/shared/services/auth.service.ts` : initialisation de session, stockage sécurisé du JWT, mise à jour réactive du profil et déconnexion.
- `frontend-starter/src/app/shared/interceptors/auth.interceptor.ts` : ajout de la gestion globale des statuts HTTP 401 avec déconnexion et redirection vers `/login`.
- `frontend-starter/src/app/components/profile-page/profile-page.ts` : chargement automatique à l'initialisation, validation réactive et modification du profil.
- `frontend-starter/src/app/components/profile-page/profile-page.html` : affichage des données du profil, formulaire de modification et alertes.
- `frontend-starter/src/app/components/profile-page/profile-page.css` : styles pour les détails du profil, alertes et boutons.
- `frontend-starter/src/app/components/app/app.ts` : méthode `logout()` et injection d'AuthService.
- `frontend-starter/src/app/components/app/app.html` : barre de navigation réactive affichant le profil de l'utilisateur connecté et le bouton de déconnexion.
- `frontend-starter/src/app/components/app/app.css` : styles pour le bouton de déconnexion et la salutation utilisateur.
- `RAPPORT_IA_MODELE.md` : mise à jour avec le compte-rendu complet de la mission.

### 7. Preuve de fonctionnement
1. **Compilation Angular (`npm run build`)** :
```text
> gpc-angular-starter@1.0.0 build
> ng build

√ Building...
Initial chunk files | Names         |  Raw size | Estimated transfer size
main.js             | main          | 303.74 kB |                79.59 kB
styles.css          | styles        |   1.28 kB |               493 bytes

                    | Initial total | 305.02 kB |                80.08 kB

Application bundle generation complete. [1.795 seconds]
```
2. **Exécution des tests backend (`npm test`)** :
```text
> gpc-api@3.0.0 test
> node --test

✔ health sans dépendre de MongoDB
✔ schémas Mongoose et relation
✔ PUT /api/users/me refuse une requête sans en-tête Authorization (401)
✔ PUT /api/users/me refuse un jeton invalide (401)
✔ PUT /api/users/me refuse un nom manquant ou inférieur à 2 caractères (400)
ℹ tests 5
ℹ pass 5
ℹ fail 0
```

### 8. Ce que chaque membre sait maintenant expliquer sans l'agent
- **Différence fondamentale entre Signal et `localStorage`** :
  - `localStorage` est une API synchrone du navigateur permettant de persister des chaînes de caractères sur le disque client entre les rafraîchissements ou fermetures d'onglets (indispensable pour conserver le token JWT).
  - Un Signal Angular est une primitive de réactivité en mémoire vive permettant de propager instantanément les changements d'état aux composants et templates dépendants (ex. le header se met à jour dès que `currentUser` change, sans rechargement de page).
- **Cycle complet d'un JWT dans une SPA Angular** :
  1. Réception du jeton suite à `POST /api/auth/login`.
  2. Stockage du jeton dans `localStorage` sous la clé `gpc_token`.
  3. Récupération automatique du jeton par `authInterceptor` et injection dans le header `Authorization: Bearer <token>` de toutes les requêtes API sortantes.
  4. Si le backend répond `401 Unauthorized` (jeton périmé ou révoqué), l'intercepteur déclenche la suppression de `gpc_token` et réoriente le routeur vers `/login`.
- **Pourquoi le composant ne dialogue jamais en direct avec `HttpClient`** :
  - Respect du principe de responsabilité unique (SRP) : le composant se concentre sur la présentation et l'interaction utilisateur.
  - Réutilisabilité : plusieurs composants (connexion, barre de navigation, profil) partagent le même service et le même état `currentUser`.
  - Testabilité : il est aisé d'isoler le composant en bouchonnant (mockant) `AuthService` sans avoir à configurer un `HttpClientTestingModule` complexe.

---

## Réponses aux questions théoriques et architecturales du TP1

### 1. Questions sur l'assistant IA et les modèles

1. **Quel modèle utilisez-vous dans votre assistant IA ?**
   - Le modèle utilisé pour ce projet est **Gemini 3.8 Flash**, un modèle de pointe de Google conçu pour le codage agentique rapide et contextuel.
2. **Comment savoir combien vous avez consommé de tokens ?**
   - **Dans l'IDE / interface de travail** : les outils agentiques (comme Antigravity, Cursor, etc.) affichent la fenêtre de contexte et les métriques de tokens consommés (tokens d'entrée / prompt tokens et tokens de sortie / completion tokens) par requête ou par session.
   - **Dans la console développeur / Dashboard fournisseur** : (Google Cloud Console, Google AI Studio ou dashboard API) qui fournit les graphiques détaillés de facturation, de quota et de volume de tokens échangés.
   - **Dans les journaux d'exécution locaux** : les fichiers de transcript enregistrés dans les répertoires d'artefacts du projet conservent les métadonnées de chaque requête.
3. **Qui peut vous conseiller quel est le meilleur modèle pour une tâche donnée ?**
   - **Les benchmarks indépendants** : comme le *LMSYS Chatbot Arena* (classement Coding/Hard Prompts) et *SWE-bench*.
   - **La documentation officielle des concepteurs d'IA** : précisant les compromis vitesse/coût/raisonnement (ex. modèles légers pour l'autocomplétion ou le linting, modèles avancés pour l'architecture et les refactorings complexes).
   - **L'équipe pédagogique et le guide du cours** : notamment le document [`CONSEILS_POUR_UTIISER_ASSISTANT_AI.md`](CONSEILS_POUR_UTIISER_ASSISTANT_AI.md) fourni à la racine du dépôt.

---

### 2. Questions sur l'architecture Backend et Frontend

1. **Quelles sont les différentes routes du backend qui sont utilisées ?**
   Conformément à [`API_CONTRACT.md`](API_CONTRACT.md), l'API propose :
   - `GET /api/health` : vérification de disponibilité du serveur (publique).
   - `POST /api/auth/register` : inscription d'un nouvel utilisateur (publique).
   - `POST /api/auth/login` : authentification et génération du JWT (publique).
   - `GET /api/users/me` : lecture du profil utilisateur courant (protégée par JWT).
   - `PUT /api/users/me` : mise à jour du nom de profil (protégée par JWT).
   - `GET /api/tracks?page=1&limit=5` : consultation paginée des pistes audio (protégée par JWT).
   - `POST /api/tracks` : upload multipart d'une piste audio (protégée par JWT).
   - `GET /api/tracks/:id/audio` : streaming binaire d'un fichier audio (protégée par JWT).
   - `DELETE /api/tracks/:id` : suppression d'une piste et de son fichier disque (protégée par JWT).

2. **Où s'effectue la tâche « mise à jour du profil utilisateur », dans quels fichiers côté back et côté front ?**

   - **Côté Frontend (Angular)** :
     - **Composant & Template** :
       - [`frontend-starter/src/app/components/profile-page/profile-page.html`](frontend-starter/src/app/components/profile-page/profile-page.html) : formulaire de saisie réactif lié à `formControlName="name"` avec affichage des erreurs de validation et déclenchement de `(ngSubmit)="save()"`.
       - [`frontend-starter/src/app/components/profile-page/profile-page.ts`](frontend-starter/src/app/components/profile-page/profile-page.ts) : méthode `save()` qui valide le formulaire et appelle `this.auth.update(name)`.
     - **Service métier** :
       - [`frontend-starter/src/app/shared/services/auth.service.ts`](frontend-starter/src/app/shared/services/auth.service.ts) : méthode `update(name: string)` qui exécute la requête HTTP `PUT /api/users/me` avec le corps `{ name }` et met à jour le Signal réactif `currentUser`.
     - **Intercepteur HTTP** :
       - [`frontend-starter/src/app/shared/interceptors/auth.interceptor.ts`](frontend-starter/src/app/shared/interceptors/auth.interceptor.ts) : injecte automatiquement le header HTTP `Authorization: Bearer <token>` à la requête sortante.

   - **Côté Backend (Node.js / Express / Mongoose)** :
     - **Routage et Contrôleur HTTP** :
       - [`backend/src/app.js`](backend/src/app.js) : handler `app.put("/api/users/me", auth, async (req, res, next) => { ... })`. Le middleware `auth` vérifie le JWT et injecte l'identifiant utilisateur dans `req.auth.sub`. Le handler valide ensuite le nom (>= 2 caractères) et déclenche `User.findByIdAndUpdate()`.
     - **Modèle de données Mongoose** :
       - [`backend/src/models/User.js`](backend/src/models/User.js) : schéma de validation (`minlength: 2`, `required: true`) et méthode de sérialisation `toPublic()` qui filtre la réponse pour masquer les données sensibles (`passwordHash`).
     - **Persistance** :
       - MongoDB Atlas : collection `users` où le document utilisateur est mis à jour.



