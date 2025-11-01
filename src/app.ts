import express from "express";
import path from "path";
import userRoutes from "./routes/userRoutes";
import quizRoutes from "./routes/quizRoutes";
import adminRoutes from "./routes/adminRoutes";
import session from "express-session";
import { attachUser } from "./middleware/auth";
import fs from "fs";

const app = express();
const SQLiteStore = require("connect-sqlite3")(session);
const sessionDir = path.join(process.cwd(), ".cache");

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "view"));

// Parsers + static
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// --- Session AVANT les routes
app.use(session({
    store: new SQLiteStore({
        dir: sessionDir,          // 👈 dossier garanti existant
        db: "sessions.sqlite",    // nom du fichier
        // option utile en dev multi-reload:
        concurrentDB: true
    }),
    secret: "change-this-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 } // 1h
}));

// --- Reconstruit req.user depuis la session
app.use(attachUser);

// --- Expose l'user aux vues EJS
app.use((req, res, next) => {
    (res.locals as any).user = (req as any).user || null;
    next();
});

// --- Routes (APRÈS les middlewares ci-dessus)
app.use("/", userRoutes);
app.use("/", quizRoutes);
app.use("/", adminRoutes);

// --- Pages
app.get("/", (req, res) => {
    res.render("home", { user: (req as any).user || null });
});

app.get("/login", (_req, res) => { res.render("login"); });
app.get("/register", (_req, res) => { res.render("register"); });

app.get("/profile", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const user = (req as any).user || null;
    res.render("profile", { user });
});

export default app;
