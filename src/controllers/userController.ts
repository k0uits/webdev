import { type Request, type Response, type NextFunction } from "express";
import { validationResult } from "express-validator";
import { getUsers, addUser, findUserByEmail, type User } from "../models/userModel";
import bcrypt from "bcryptjs";

// --- Connexion utilisateur ---
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { email, password } = req.body as { email: string; password: string };
    const user = await findUserByEmail(email);

    // vérifie que l'utilisateur existe
    if (!user) {
      return res.status(401).json({ ok: false, message: "Identifiants invalides" });
    }

    // compare le mot de passe haché
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ ok: false, message: "Identifiants invalides" });
    }

    req.session.regenerate((err) => {
      if (err) return next(err);
      (req.session as any).userId = user.id;

      // Stocker un snapshot complet de l'utilisateur dans la session (sans mot de passe)
      const sessionUser: any = {
        id: user.id,
        nom: user.nom,
        email: user.email
      };

      if (user.role) {
        sessionUser.role = user.role;
      } else {
        sessionUser.role = "user";
      }
      (req.session as any).user = sessionUser;

      req.session.save((err2) => {
        if (err2) return next(err2);

        // Préparer la réponse sans utiliser || pour le rôle
        let roleSafe = "user";
        if (user.role) {
          roleSafe = user.role;
        }

        return res.json({
          ok: true,
          redirect: "/",
          user: { id: user.id, nom: user.nom, email: user.email, role: roleSafe },
        });
      });
    });
  } catch (err) {
    next(err);
  }
}

// --- Inscription d’un utilisateur ---
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { nom, email, password } = req.body as { nom: string; email: string; password: string };

    const exists = await findUserByEmail(email);
    if (exists) {
      return res.status(409).json({ ok: false, message: "Cet email est déjà utilisé" });
    }

    // hachage du mot de passe avant sauvegarde
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
      id: Date.now(),
      nom,
      email,
      password: hashedPassword,
      role: "user",
    };

    await addUser(newUser);

    return res.status(201).json({
      ok: true,
      redirect: "/login",
      message: "Compte créé avec succès",
      user: { id: newUser.id, nom: newUser.nom, email: newUser.email },
    });
  } catch (err) {
    next(err);
  }
}


export function logout(req: Request, res: Response, _next: NextFunction) {
  // nom du cookie de session : par défaut "connect.sid"
  const cookieName = "connect.sid";

  // Purge explicite des infos utilisateur en session avant destroy
  (req.session as any).userId = undefined;
  (req.session as any).user = undefined;

  req.session.destroy(() => {
    res.clearCookie(cookieName);
    return res.redirect("/login");
  });
}
