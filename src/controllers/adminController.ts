import { Request, Response } from "express";
import { getUsers, removeUserById, updateUserFields, setPasswordById } from "../models/userModel";
import bcrypt from "bcryptjs";

export async function renderAdminPage(req: Request, res: Response) {
    const users = await getUsers();
    const message = req.query.message as string | undefined; // on récupère le message éventuel
    res.render("admin", { users, message });
}

export async function deleteUser(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) return res.status(400).send("ID invalide");

    const ok = await removeUserById(id);
    if (!ok) return res.status(404).send("Utilisateur introuvable");

    return res.redirect("/admin?message=Utilisateur supprimé avec succès");
}

export async function updateUser(req: Request, res: Response) {
    const id = Number(req.params.id);
    type Role = "user" | "admin";
    const { nom, email, role } = req.body as { nom: string; email: string; role?: string };

    const rawRole = (role ?? "").toString().trim().toLowerCase();
    const safeRole: Role = rawRole === "admin" ? "admin" : "user";

    const ok = await updateUserFields(
        id,
        nom.trim(),
        email.trim(),
        safeRole
    );

    if (!id || Number.isNaN(id)) return res.status(400).send("ID invalide");
    if (!nom?.trim() || !email?.trim()) return res.status(400).send("Champs manquants");


    if (!ok) return res.status(404).send("Utilisateur introuvable");


    // redirige avec message
    return res.redirect("/admin?message=Modifications enregistrées avec succès");
}

export async function updateUserPassword(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { password = "", passwordConfirm = "" } = (req.body ?? {}) as { password?: string; passwordConfirm?: string };

    if (!id || Number.isNaN(id)) return res.status(400).send("ID invalide");

    const errors: string[] = [];
    if (!password || typeof password !== "string") errors.push("Mot de passe requis.");
    if (!passwordConfirm || typeof passwordConfirm !== "string") errors.push("Confirmation requise.");
    if (password && password.length < 8) errors.push("Le mot de passe doit contenir au moins 8 caractères.");
    if (password !== passwordConfirm) errors.push("Les mots de passe ne correspondent pas.");

    if (errors.length) {
        // On renvoie vers l’admin avec un message concis (tu peux aussi les afficher inline si tu veux)
        const msg = encodeURIComponent(errors.join(" "));
        return res.redirect(`/admin?message=${msg}`);
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const ok = await setPasswordById(id, hash);
        if (!ok) return res.status(404).send("Utilisateur introuvable");
        return res.redirect("/admin?message=Mot de passe mis à jour ✅");
    } catch (e) {
        console.error("updateUserPassword error:", e);
        return res.status(500).send("Erreur serveur");
    }
}
