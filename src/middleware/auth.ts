import { Request, Response, NextFunction } from "express";
import { getUsers } from "../models/userModel";

export async function attachUser(req: Request, _res: Response, next: NextFunction) {
    const raw = (req.session as any)?.userId;
    const id = Number(raw);
    if (!id) return next();

    try {
        const users = await getUsers();
        const u = users.find(x => Number(x.id) === id);
        if (u) (req as any).user = u;
    } catch { }

    next();
}

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    const anyReq: any = req;
    if (anyReq.user) {
        return next();
    }

    return res.status(401).json({ message: "Authentification requise" });
}

export function ensureAuthenticatedPage(req: Request, res: Response, next: NextFunction) {
    const anyReq: any = req;
    if (anyReq.user) {
        return next();
    }

    return res.redirect("/login");
}