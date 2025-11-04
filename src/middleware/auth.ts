import { Request, Response, NextFunction } from "express";
import { getUsers } from "../models/userModel";

export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const raw = (req.session as any)?.userId;
    const id = Number(raw); // userId peut être une string → force en number
    if (!id) return next();

    const users = await getUsers();
    const found = users.find(u => Number(u.id) === id);

    if (found) {
      // On s'assure que req.user a bien les propriétés utiles
      (req as any).user = {
        id: found.id,
        email: found.email,
        nom: found.nom,
        role: found.role || "user" // on met "user" par défaut si non défini
      };
    }
  } catch (err) {
    console.error("Erreur attachUser:", err);
  }

  next();
}
