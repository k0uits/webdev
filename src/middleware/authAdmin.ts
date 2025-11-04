import { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    if (!user) {
        return res.redirect("/login");  // pas connecté
    }
    if ((user.role || "user") !== "admin") {
        return res.status(403).render("error", { message: "Accès refusé : vous n’êtes pas administrateur." });
    }
    next();
}