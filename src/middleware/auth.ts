import { Request, Response, NextFunction } from "express";
import { getUsers } from "../models/userModel";

export async function attachUser(req: Request, _res: Response, next: NextFunction) {
    const raw = (req.session as any)?.userId;
    const id = Number(raw);                 // userId peut être une string → force en number
    if (!id) return next();

    try {
        const users = await getUsers();
        const u = users.find(x => Number(x.id) === id);
        if (u) (req as any).user = u;         // place l’utilisateur sur req.user
    } catch { /* ignore */ }

    next();
}
