Quiz App (TP4 – Intégration sécurité)

Application Express + TypeScript + MongoDB (MVC) avec authentification (bcrypt + JWT).

Scripts
- `npm run dev` : démarrer en développement
- `npm run build` : compiler TypeScript
- `npm start` : lancer la version compilée

Configuration
Variables d'environnement utilisées (via `process.env`):
- `MONGO_URI` : URI MongoDB (ex: mongodb://localhost:27017/quizApp)
- `PORT` : port HTTP (par défaut 3000)
- `JWT_SECRET` : secret pour signer les JWT (fallback dev: "dev-secret")

Routes
Auth
- **POST** `/api/auth/register` : { name, email, password }
- **POST** `/api/auth/login` : { email, password }
- **GET** `/api/auth/profile` : nécessite header `Authorization: Bearer <token>`

Users (CRUD existant si utilisé)
- **GET** `/api/users` etc. (optionnel selon TP3)

Sécurité (TP4)
- Hash du mot de passe avec `bcrypt` (pre-save Mongoose)
- Génération & vérification de JWT via `jsonwebtoken`
- Middleware d'auth (`src/middleware/authMiddleware.ts`) pour protéger les routes

IMPORTANT
- Pour tester la connection entre le front end et le back end en ligne, coller ca dans la console du localhost du front end:

fetch("http://localhost:3000/health")
    .then(res => res.json())
    .then(console.log)

N'oubliez pas de lancer les deux serveurs avant