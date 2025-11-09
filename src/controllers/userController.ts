import { type Request, type Response, type NextFunction } from "express";
import { validationResult } from "express-validator";
import { getUsers, addUser, findUserByEmail, type User, findUserById, updateUserById, setPasswordById, removeUserById } from "../models/userModel";
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

      req.session.save((err2) => {
        if (err2) return next(err2);
        return res.json({
          ok: true,
          redirect: "/",
          user: { id: user.id, nom: user.nom, email: user.email, role: user.role || "user" },
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
      id: String(Date.now()),
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

  req.session.destroy(() => {
    res.clearCookie(cookieName);
    return res.redirect("/login");
  });
}

// (A) Mettre à jour nom + email
export async function updateProfile(req: Request, res: Response, _next: NextFunction) {
  const me = (req as any).user;
  if (!me) return res.redirect("/login");

  const { nom, email } = req.body as { nom?: string; email?: string };

  // validations simples
  const errors: string[] = [];
  if (!nom || !nom.trim()) errors.push("Le nom est requis.");
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push("Email invalide.");

  // empêcher l'usage d'un email déjà pris par quelqu'un d'autre
  if (email && email !== me.email) {
    const existing = await findUserByEmail(email);
    if (existing && Number(existing.id) !== Number(me.id)) {
      errors.push("Cet email est déjà utilisé.");
    }
  }

  if (errors.length) {
    return res.status(400).render("profile", { user: me, message: errors.join(" ") });
  }

  const updated = await updateUserById(me.id, { nom: nom!.trim(), email: email!.trim() });
  if (!updated) {
    return res.status(500).render("profile", { user: me, message: "Échec de la mise à jour." });
  }

  // rafraîchir req.user pour la vue courante (attachUser le fera aux prochaines requêtes)
  (req as any).user = updated;
  return res.render("profile", { user: updated, message: "Profil mis à jour ✅" });
}

// (B) Changer le mot de passe (avec double vérif)
export async function changePassword(req: Request, res: Response, _next: NextFunction) {
  const me = (req as any).user;
  if (!me) return res.redirect("/login");

  const { currentPassword, newPassword, confirmPassword } = req.body as {
    currentPassword?: string; newPassword?: string; confirmPassword?: string;
  };

  const errors: string[] = [];
  if (!currentPassword) errors.push("Mot de passe actuel requis.");
  if (!newPassword || newPassword.length < 6) errors.push("Nouveau mot de passe trop court (≥ 6).");
  if (newPassword !== confirmPassword) errors.push("La confirmation ne correspond pas.");

  if (errors.length) {
    return res.status(400).render("profile", { user: me, message: errors.join(" ") });
  }

  // vérifier l'ancien mot de passe
  const ok = await bcrypt.compare(currentPassword!, me.password);
  if (!ok) {
    return res.status(400).render("profile", { user: me, message: "Ancien mot de passe incorrect." });
  }

  const hash = await bcrypt.hash(newPassword!, 10);
  const done = await setPasswordById(me.id, hash);
  if (!done) {
    return res.status(500).render("profile", { user: me, message: "Échec de la mise à jour du mot de passe." });
  }

  return res.render("profile", { user: { ...me, password: hash }, message: "Mot de passe modifié ✅" });
}

// (C) Supprimer le compte (avec confirmation + vérif du mot de passe)
export async function deleteAccount(req: Request, res: Response, _next: NextFunction) {
  const me = (req as any).user;
  if (!me) return res.redirect("/login");

  const { confirm, password } = req.body as { confirm?: string; password?: string };
  if (confirm !== "DELETE") {
    return res.status(400).render("profile", { user: me, message: "Tapez DELETE pour confirmer la suppression." });
  }
  if (!password) {
    return res.status(400).render("profile", { user: me, message: "Mot de passe requis pour supprimer le compte." });
  }

  const ok = await bcrypt.compare(password, me.password);
  if (!ok) {
    return res.status(400).render("profile", { user: me, message: "Mot de passe incorrect." });
  }

  const removed = await removeUserById(me.id);
  if (!removed) {
    return res.status(500).render("profile", { user: me, message: "Impossible de supprimer le compte." });
  }

  // détruire la session et rediriger
  const cookieName = "connect.sid";
  req.session.destroy(() => {
    res.clearCookie(cookieName);
    return res.redirect("/login");
  });
}

// --- Récupère le classement des utilisateurs par points ---
export async function getLeaderboard(_req: Request, res: Response) {
  const users = (await getUsers()).map(u => ({
    id: String(u.id),
    nom: u.nom,
    role: u.role || "user",
    points: Number(u.points || 0),
  }));
  users.sort((a, b) => b.points - a.points);
  res.json(users);
}

export async function showProfile(req: Request, res: Response) {
  const me = (req as any).user;
  if (!me) return res.redirect("/login");
  const fresh = await findUserById(String(me.id));
  const user = fresh ? { ...fresh, points: Number(fresh.points || 0) } : { ...me, points: 0 };
  return res.render("profile", { user, message: null });
}