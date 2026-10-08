# Rapport d'usage de l'IA - TP1

Pour chaque mission, détailler et fournir des explications concernant : objectif; prompt principal; plan proposé par l'agent; vérifications réalisées par le binôme; erreurs ou propositions rejetées; fichiers effectivement modifiés; preuve de fonctionnement; ce que chaque membre sait maintenant expliquer sans l'agent.

---

MISSION 1 :
Prompt : 

Maintenant que tu as les best practices, les consignes de ce qu'il faut respecter, j'aimerais que tu completes ou réecrit la partie utilisateur du frontend, j'aimerais avant toute chose IMPORTANT : Le composant ne doit pas appeler directement HttpClient: il passe par AuthService. Utiliser inject()et conserver une séparation claire entre interface, service et API.

Première chose a faire, un formulaire réactifs pour l'inscription et la connexion, en deuxième, un message de validation et d'erreur compréhensibles. On voit ensuite pour continuer , pour le moment fait moi ça stp

MISSION 1 Part 2 :

Prompt :
Pour continuer j'aimerais que tu fasses : 
appels de /api/auth/registeret /api/auth/login;
 sauvegarde du JWT côté navigateur, sans jamais l'afficher dans les logs ;
mise à jour du Signal currentUser;
redirection après une connexion ou une inscription réussie ;
bouton de déconnexion avec Nettoyage de l'état local ;
chargement de /api/users/melorsque le profil est demandé ;
modification du nom avec PUT /api/users/me;
gestion d'un 401, avec retour vers /loginsi le token est invalide ou expiré.

Je répète cette consigne importante : 
Le composant ne doit pas appeler directement HttpClient: il passe par AuthService. Utiliser inject()et conserver une séparation claire entre interface, service et API.


Question pour la mission 1 : 

À propos, quel modèle utilisez-vous dans votre assistant IA ? Comment savoir combien vous avez consommé de tokens ? Qui peut vous conseiller quel est le meilleur modèle pour une tâche donnée ?

Le modèle est Gemini 3.8 Flash, un modele de google a faible latence et une haute précision. 
Dans l'IDE Antigravity les outils CLI et les extensions CLAUDE et Gemini permettent de suivre la consommation de tokens. 
Pour recevoir des conseils sur les meilleurs modèles pour une tâche il y a des benchmarks publics et indépendants comme :
LMSYS Chatbot Arena ou SWE-bench


Questions : quelles sont les différentes routes du backend qui sont utilisées ? Soyez capable de répondre à la question : « où s'effectue la tâche « mise à jour du profil utilisateur », dans quels fichiers côté back et côté front ? »

