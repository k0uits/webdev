import { Request, Response } from "express";
import { getUsers, removeUserById, updateUserFields } from "../models/userModel";

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
    const { nom, email, role } = req.body as { nom: string; email: string; role: string };

    if (!id || Number.isNaN(id)) return res.status(400).send("ID invalide");
    if (!nom?.trim() || !email?.trim()) return res.status(400).send("Champs manquants");

    const ok = await updateUserFields(id, nom.trim(), email.trim(), role?.trim() || "user");
    if (!ok) return res.status(404).send("Utilisateur introuvable");

    // redirige avec message
    return res.redirect("/admin?message=Modifications enregistrées avec succès");
}
