import { Router, type Request, type Response, type NextFunction } from "express";
import { validationResult } from "express-validator";
import { login, register, logout } from "../controllers/userController";
import { loginRules, registerRules } from "../validators/userValidator";

const router = Router();

// Middleware de validation réutilisable (typer pour éviter 'any')
const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  next();
};

// Login
router.post("/login", loginRules, validate, login);

// Register
router.post("/users", registerRules, validate, register);

// Logout
router.get("/logout", logout);

export default router;
