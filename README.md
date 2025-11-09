# Projet MVC Node.js / TypeScript

## Description
Ce projet met en œuvre une architecture MVC (Model - View - Controller) avec Node.js, Express et TypeScript.
L’objectif est de séparer clairement la logique métier (models), la logique de contrôle (controllers) et la partie interface utilisateur (views) afin d’assurer une structure claire, maintenable et évolutive.

🌐 Fonctionnalités principales

🧠 Création, gestion et lecture de quiz
Les utilisateurs peuvent créer leurs propres quiz, les modifier, les supprimer, ou répondre à ceux des autres.
Chaque quiz contient un titre, des questions à choix simple ou multiple, et une catégorie (ex. : Géographie, Histoire, Informatique, etc.).

👤 Système d’authentification complet
Les utilisateurs peuvent s’inscrire, se connecter et gérer leur profil (nom, email, mot de passe).
Les sessions sont gérées via express-session et stockées localement grâce à connect-sqlite3.

🛡️ Gestion des rôles (user / admin)
Les administrateurs disposent de droits supplémentaires : suppression d’utilisateurs, gestion des catégories, ou modération des quiz.

🏷️ Catégories de quiz
Les quiz sont classés par catégorie, facilitant la recherche et la navigation.
Les administrateurs peuvent ajouter ou supprimer des catégories.

🏆 Système de points et classement
Chaque utilisateur gagne des points en fonction de ses bonnes réponses.
Un leaderboard (classement) affiche les trois meilleurs joueurs sur la page d’accueil, suivi du classement général.

🎨 Interface dynamique avec EJS et JavaScript
Les vues (EJS) affichent dynamiquement les données envoyées par les contrôleurs, avec des composants interactifs :
carrousel de quiz, filtres de recherche, formulaires dynamiques, et affichage des résultats.

💾 Persistance locale en JSON
Les données (utilisateurs, quiz, catégories, etc.) sont stockées sous forme de fichiers JSON dans le dossier data/.
Cela permet de gérer le projet sans base de données externe.

---

## Installation

1. **Cloner le projet**
   ```bash
   git clone https://github.com/k0uits/webdev.git
   cd Projet_final
   ```

2. **Installer les dépendances**
   ```bash
   npm run setup
   ```

3. **Lancer le serveur**
   ```bash
   npm run dev
   ```

---

## Identifiants utilisateurs

| Role | Identifiant | Mot de Passe |
|-----------|-----------|--------------|
| Administrateur | admin@gmail.com | admin123 |
| Utilisateur | celine@gmail.com | celine123 |

---

## Fonctionnement du modèle MVC

- **Model (Modèle)** : gère les données, les requêtes vers la base de données et les règles métiers.
- **View (Vue)** : affiche les données à l’utilisateur à l’aide d’un moteur de template (EJS, Pug…).
- **Controller (Contrôleur)** : fait le lien entre le modèle et la vue. Il traite les requêtes HTTP et renvoie les réponses.

Exemple d’un flux :
```
Navigateur → Route → Contrôleur → Modèle → Vue → Réponse HTTP
```

---

## Scripts utiles

| Commande | Description |
|-----------|--------------|
| `npm run setup` | Telecharge tous les modules requis et donne toutes les autorisations nécessaires |
| `npm run dev` | Lance le serveur avec `ts-node-dev` (rechargement automatique) |

---

## Dépendances principales
- **Express** : serveur web
- **TypeScript** : typage statique
- **EJS** : moteur de vues
- **Nodemon / ts-node-dev** : redémarrage automatique en développement
- **express-session** : gestion des sessions utilisateur (connexion persistante)
- **connect-sqlite3** : stockage des sessions dans une base SQLite locale
- **bcryptjs** : hachage sécurisé des mots de passe utilisateurs
- **sqlite3** : dépendance nécessaire pour le stockage des sessions
- **cookie-parser (optionnel)** : lecture et gestion simplifiée des cookies

---

## Structure du projet

```
Projet Final/
│
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── jsconfig.json
│
├── src/
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── controllers/
│   │   ├── adminController.ts
│   │   ├── authController.ts
│   │   ├── quizController.ts
│   │   └── userController.ts
│   │
│   ├── models/
│   │   ├── userModel.ts
│   │   ├── quizModel.ts
│   │   ├── categoryModel.ts
│   │   └── resultModel.ts
│   │
│   ├── routes/
│   │   ├── adminRoutes.ts
│   │   ├── authRoutes.ts
│   │   ├── quizRoutes.ts
│   │   └── userRoutes.ts
│   │
│   ├── middleware/
│   │   └── authMiddleware.ts
│   │
│   ├── utils/
│   │   ├── db.ts
│   │   └── helpers.ts
│   │
│   ├── views/
│   │   ├── admin.ejs
│   │   ├── login.ejs
│   │   ├── profile.ejs
│   │   ├── register.ejs
│   │   ├── quiz.ejs
│   │   ├── error.ejs
│   │   └── layout.ejs
│   │
│   └── data/
│       ├── users.json
│       ├── categories.json
│       ├── quizz.json
│       └── results.json
│
└── public/
    ├── css/
    │   ├── home.css
    │   ├── admin.css
    │   ├── quiz.css
    │   └── profile.css
    │
    ├── js/
    │   ├── main.js
    │   ├── quiz.js
    │   └── admin.js
    │
    └── images/
        ├── logo.png
        ├── favicon.ico
        └── background.jpg

```

---

## Auteur
Projet développé par Antonin GERY, Mathys PHILIPPIN, Khai LE
© 2025 - Tous droits réservés.
