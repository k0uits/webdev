import { Request, Response } from "express";
import {
    getUsers,
    removeUserById,
    updateUserById,
    setPasswordById,
    findUserById,
} from "../models/userModel";
import bcrypt from "bcryptjs";

export async function renderAdminPage(req: Request, res: Response) {
    const me: any = (req as any).user || null;
    if (!me || (me.role || "user") !== "admin") {
        return res.status(403).render("error", { message: "Accès refusé (admin requis)" });
    }
    const users = await getUsers();
    return res.render("admin", { user: me, users, message: null });
}

export async function deleteUser(req: Request, res: Response) {
    const me: any = (req as any).user || null;
    if (!me || (me.role || "user") !== "admin") {
        return res.status(403).render("error", { message: "Accès refusé (admin requis)" });
    }
    const id = String(req.params.id || "");
    const ok = await removeUserById(id);
    const users = await getUsers();
    return res.render("admin", {
        user: me,
        users,
        message: ok ? "Utilisateur supprimé ✅" : "Suppression impossible ❌",
    });
}

export async function updateUser(req: Request, res: Response) {
    const me: any = (req as any).user || null;
    if (!me || (me.role || "user") !== "admin") {
        return res.status(403).render("error", { message: "Accès refusé (admin requis)" });
    }

    const id = String(req.params.id || "");
    const { nom, email, role } = req.body as {
        nom?: string;
        email?: string;
        role?: "user" | "admin";
    };

    // Mise à jour du compte ciblé
    const updated = await updateUserById(id, {
        nom: nom ?? undefined,
        email: email ?? undefined,
        role: role === "admin" || role === "user" ? role : undefined,
    });

    const users = await getUsers();

    // Si l’admin vient de se rétrograder lui-même en "user"
    if (updated && String(me.id) === id && updated.role === "user") {
        // déconnexion immédiate
        return res.redirect("/");
    }

    return res.render("admin", {
        user: me,
        users,
        message: updated ? "Utilisateur mis à jour ✅" : "Mise à jour impossible ❌",
    });
}

export async function updateUserPassword(req: Request, res: Response) {
    const me: any = (req as any).user || null;
    if (!me || (me.role || "user") !== "admin") {
        return res.status(403).render("error", { message: "Accès refusé (admin requis)" });
    }
    const id = String(req.params.id || "");
    const { password } = req.body as { password?: string };
    let msg = "Mot de passe mis à jour ✅";

    if (!password || password.length < 8) {
        msg = "Mot de passe trop court (≥ 6) ❌";
    } else {
        const exists = await findUserById(id);
        if (!exists) {
            msg = "Utilisateur introuvable ❌";
        } else {
            const hash = await bcrypt.hash(password, 10);
            const ok = await setPasswordById(id, hash);
            if (!ok) msg = "Échec de la mise à jour du mot de passe ❌";
        }
    }

    const users = await getUsers();
    return res.render("admin", { user: me, users, message: msg });
}
