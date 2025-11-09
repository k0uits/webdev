# Projet MVC Node.js / TypeScript

## Description
Ce projet met en œuvre une architecture **MVC (Model - View - Controller)** avec **Node.js** et **Express**, développée en **TypeScript**.  
L’objectif est de séparer clairement la logique métier (models), la logique de contrôle (controllers), et la partie interface/utilisateur (views).

---

## Structure du projet

```
Projet_final/
├── package.json           # Dépendances et scripts NPM
├── tsconfig.json          # Configuration TypeScript
├── src/
│   ├── public/            # Fichiers CSS, JS
│   ├── validators/        # Fonctions de validation des données (ex : formulaires, requêtes)
│   ├── models/            # Schémas et classes métiers
│   ├── controllers/       # Gestion de la logique applicative
│   ├── routes/            # Définition des routes Express
│   ├── view/              # Templates (EJS)
│   ├── server.ts          # Point d’entrée du serveur (lance app.listen)
│   └── app.ts             # Configuration de l’application Express (middlewares, routes, etc.)
```

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
|-----------|--------------|
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

## Auteur
Projet développé par Antonin GERY, Mathys PHILIPPIN, Khai LE
© 2025 - Tous droits réservés.
