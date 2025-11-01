import { body, type ValidationChain } from "express-validator";

// --- Règles de validation pour le login ---
// Vérifie que l'email est valide et que le mot de passe est présent
export const loginRules: ValidationChain[] = [
  body("email").isEmail().withMessage("Email invalide"),
  body("password").isString().notEmpty().withMessage("Mot de passe requis"),
];

// --- Règles de validation pour l'inscription ---
// Vérifie la validité des champs avant création d’un compte utilisateur
export const registerRules = [
  body("nom").trim().notEmpty().withMessage("Le nom est requis"),
  body("email").isEmail().withMessage("Email invalide").normalizeEmail(),
  body("password")
    .isString()
    .isLength({ min: 6 })
    .withMessage("Mot de passe trop court"),
  body("passwordConfirm")
    // Vérifie que la confirmation du mot de passe correspond au mot de passe principal
    .custom((v, { req }) => {
      if (v !== req.body.password)
        throw new Error("Les mots de passe ne correspondent pas");
      return true;
    }),
];
