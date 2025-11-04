import { Router, type Request, type Response, type NextFunction } from "express";
import { validationResult } from "express-validator";
import { login, register, logout, updateProfile, changePassword, deleteAccount } from "../controllers/userController";
import { loginRules, registerRules } from "../validators/userValidator";

const router = Router();

// Valide les règles express-validator quand elles sont présentes
const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ ok: false, errors: errors.array() });
  next();
};

// Auth simple (req.user est rempli par attachUser)
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).user) return res.redirect("/login");
  next();
};

// Login / Register / Logout
router.post("/login", loginRules, validate, login);
router.post("/users", registerRules, validate, register);
router.get("/logout", logout);

// Profil : update identités, changer mot de passe, supprimer compte
router.post("/profile/update", requireAuth, updateProfile);
router.post("/profile/password", requireAuth, changePassword);
router.post("/profile/delete", requireAuth, deleteAccount);

export default router;
