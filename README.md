# Guitar Practice Cloud — package étudiant

Ce dépôt contient uniquement les ressources nécessaires aux trois TP :
`backend/` et `frontend-starter/`, ainsi que les sujets et documents utiles.

## Prérequis

- Node.js 22 ou plus récent ;
- un compte MongoDB Atlas par binôme ;
- Git et un navigateur récent.
- Un IDE de qualité
- Recommandé : un abonnement à un 

Consulter [ATLAS_SETUP.md](ATLAS_SETUP.md) pour créer la base de données.

## Démarrer le backend

```bash
cd backend
cp .env.example .env
```

Renseigner dans `.env` l’URI MongoDB Atlas et le secret JWT. Ne jamais publier
ce fichier ni copier un secret dans le code Angular.

```bash
npm install
npm start
```

Le backend écoute normalement sur `http://localhost:3000`.

## Démarrer le frontend

Dans un autre terminal :

```bash
cd frontend-starter
npm install
npm start
```

Ouvrir `http://localhost:4200`. Le compte de démonstration est
`demo@example.com` / `Demo1234!`.

## Documents de travail

- [SUJET_ETUDIANT_TP1.md](SUJET_ETUDIANT_TP1.md), [SUJET_ETUDIANT_TP2.md](SUJET_ETUDIANT_TP2.md) et [SUJET_ETUDIANT_TP3.md](SUJET_ETUDIANT_TP3.md) : missions des trois séances ;
- [API_CONTRACT.md](API_CONTRACT.md) : endpoints, authentification et formats échangés ;
- [RAPPORT_IA_MODELE.md](RAPPORT_IA_MODELE.md) : modèle de compte rendu.
- [CONSEILS_POUR_UTIISER_ASSISTANT_AI.md](CONSEILS_POUR_UTIISER_ASSISTANT_AI.md) : utiliser correctement un assistant IA, quel que soit l’outil choisi.

Le backend contient également ses propres consignes pour les assistants :
[`backend/AGENTS.md`](backend/AGENTS.md), [`backend/CLAUDE.md`](backend/CLAUDE.md),
[`backend/GEMINI.md`](backend/GEMINI.md) et
[`backend/best-practices.md`](backend/best-practices.md). Elles couvrent
Node.js, Express, Mongoose, MongoDB, l’authentification, Multer, les uploads,
les logs et les tests.

Les fichiers audio présents dans `frontend-starter/fichiers-audio-de-test/` sont
des fixtures fournies pour les essais. Aucun fichier uploadé, dossier de
dépendances (`node_modules`), fichier `.env` ou identifiant local n’est inclus.



-----------------------


Fichier	Rôle & Utilité


frontend-starter/AGENTS.md
Directives et standards de développement pour le frontend Angular 22 standalone. Il impose l'organisation des composants (1 composant par dossier avec son TS, HTML et CSS), l'utilisation d'API modernes (inject(), Signals, Formulaires réactifs, syntaxe de contrôle de flux @if / @for), le placement du code partagé dans src/app/shared, l'interdiction de modifier backend/ depuis le frontend, et l'interdiction d'exposer des secrets/mots de passe dans le client.


backend/CLAUDE.md
Consignes opérationnelles pour l'assistant IA Claude Code sur la partie backend. Il insiste sur le travail incrémental par petites étapes, le respect de la chaîne d'exécution route Express -> middleware -> handler -> Mongoose -> MongoDB et du flux Multer pour l'upload. Il prescrit également la mise à jour obligatoire du contrat d'API en cas d'évolution.


backend/GEMINI.md
Consignes opérationnelles pour Gemini CLI côté backend. Complémentaire à CLAUDE.md, il rappelle de s'appuyer sur async/await, de retourner des erreurs explicites, de logger sans exposer de secrets, de valider strictement les fichiers uploadés (taille, extension MIME, nommage) et de lancer les tests avant de valider toute modification.


backend/best-practices.md
Guide de référence des bonnes pratiques d'ingénierie logicielle backend. Il couvre la configuration (.env hors Git), l'architecture Express (middlewares, codes HTTP RESTful), la sécurité Mongoose (indexation, validation, requêtes non injectables, pas de mot de passe en clair), la gestion des fichiers volumineux avec Multer (stockage disque isolé, nettoyage des orphelins), et la sécurité JWT.


API_CONTRACT.md
Le contrat d'interface HTTP unique entre le client Angular et le serveur Express. Il documente toutes les URLs préfixées par /api, les méthodes HTTP, les charges utiles (body), les réponses, les codes d'erreur et les exigences d'authentification (Authorization: Bearer <token>).



-----------------------


Etapes clés :
Composant UI : [

login-page.html
] intercepte la soumission via (ngSubmit)="submit()" sur le formulaire réactif FormGroup.
Action du composant : [

LoginPageComponent.submit()
] extrait les identifiants et s'abonne avec subscribe({ next, error }) conformément à 

frontend-starter/AGENTS.md
.
Service Auth : [

AuthService.login()
] effectue le POST /api/auth/login et persiste le token dans localStorage ainsi que dans un Signal réactif.
Backend Express & Mongoose : Dans [

backend/src/app.js
], l'utilisateur est extrait avec +passwordHash, vérifié via la méthode d'instance de 

User
, puis un JWT signé avec le secret process.env.JWT_SECRET est retourné.


----------------


Routes publiques : 
🟢 Les Routes Publiques (Sans Authentification)
Ces routes sont accessibles sans jeton. Tout appelant peut les solliciter :

Méthode	Route complète	Requête / Corps attendu	Réponse principale	Rôle / Usage
GET	/api/health	Aucun	200 { "status": "ok" }	Sonde de santé permettant de vérifier que le serveur backend est en ligne et répond.
POST	/api/auth/register	{ "name": "...", "email": "...", "password": "..." }	201 { "token": "...", "user": { ... } }	Inscription d'un nouvel utilisateur. Crée le compte dans MongoDB (mot de passe haché) et renvoie directement un token JWT.
POST	/api/auth/login	{ "email": "...", "password": "..." }	200 { "token": "...", "user": { ... } }	Connexion d'un utilisateur existant. Vérifie les identifiants et génère un jeton JWT valide 2 heures.


Routes protégées :

Méthode	Route complète	Paramètres / Corps	Réponse principale	Sécurité & Rôle
GET	/api/users/me	En-tête Authorization	200 User	Retourne le profil public de l'utilisateur extrait du token (req.auth.sub).
PUT	/api/users/me	{ "name": "..." } + JWT	200 User	Met à jour le nom de l'utilisateur connecté identifié par son JWT.
GET	/api/tracks	Query params : ?page=1&limit=5 + JWT	200 Page<Track> (items, page, limit, total, pages)	Liste paginée des pistes appartenant exclusivement à l'utilisateur connecté (ownerId: req.auth.sub).
POST	/api/tracks	multipart/form-data : champ fichier audio, champ texte title + JWT	201 Track	Upload d'un fichier audio (MP3, WAV, OGG, M4A, ≤ 25 Mo) via Multer, stocké sur disque avec métadonnées dans MongoDB.
GET	/api/tracks/:id/audio	Paramètre d'URL :id + JWT	200 (Flux audio binaire)	Téléchargement / streaming de la piste. Le serveur vérifie que la piste appartient bien à l'utilisateur (ownerId: req.auth.sub) avant d'envoyer le fichier.
DELETE	/api/tracks/:id	Paramètre d'URL :id + JWT	204 No Content	Suppression de la piste (métadonnées MongoDB + suppression physique du fichier sur le disque). Réservé au propriétaire de la piste.


--------------------

Tableau récapitulatif à insérer dans votre rapport
Vous pouvez copier ce tableau prêt à l'emploi dans votre rapport :

Événement	Méthode	URL	Statut	Présence Authorization	Corps JSON (Payload)	Réponse JSON
Connexion réussie	POST	/api/auth/login	200	Non	{"email":"demo@example.com", "password":"***"}	{"token":"***", "user":{...}}
Connexion refusée	POST	/api/auth/login	401	Non	{"email":"demo@example.com", "password":"***"}	{"message":"Identifiants incorrects"}
Lecture profil	GET	/api/users/me	200	Oui (Bearer ***)	(aucun)	{"id":"...", "name":"...", "email":"..."}
Modification profil	PUT	/api/users/me	200	Oui (Bearer ***)	{"name":"NouveauNom"}
