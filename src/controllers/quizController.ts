import { Request, Response } from "express";
import { readQuizzes, writeQuizzes, Quiz, Question } from "../models/quizModel";
import fs from "fs";
import path from "path";

const QUIZZ_PATH = path.join(__dirname, "../../data/quizz.json");
const CATEGORIES_PATH = path.join(__dirname, "../../data/categories.json");

// --- Fonction utilitaire pour renvoyer une réponse d’erreur HTTP ---
function bad(res: Response, code: number, message: string) {
  return res.status(code).json({ message });
}

// --- Affiche la page de création de quiz (vue "create") ---
export function getCreatePage(_req: Request, res: Response) {
  res.render("create");
}

function ensureCategoriesFile() {
  if (!fs.existsSync(CATEGORIES_PATH)) {
    fs.writeFileSync(CATEGORIES_PATH, "[]", "utf-8");
  }
}

function readCategories(): string[] {
  ensureCategoriesFile();
  const raw = fs.readFileSync(CATEGORIES_PATH, "utf-8");
  return raw.trim() ? JSON.parse(raw) : [];
}

function writeCategories(list: string[]) {
  fs.writeFileSync(CATEGORIES_PATH, JSON.stringify(list, null, 2), "utf-8");
}

// --- Renvoie la liste complète des quiz au format JSON ---
export function listQuizzes(_req: Request, res: Response) {
  try {
    const chemin = path.join(__dirname, "../../data/quizz.json");
    if (!fs.existsSync(chemin)) {
      fs.writeFileSync(chemin, "[]", { encoding: "utf-8" });
    }
    const raw = fs.readFileSync(chemin, "utf-8");
    let quizzes: any[] = [];
    try {
      quizzes = raw.trim() ? JSON.parse(raw) : [];
    } catch {
      // si corrompu → on réinitialise proprement
      fs.writeFileSync(chemin, "[]", "utf-8");
      quizzes = [];
    }

    const out = quizzes.map((q: any) => ({
      id: q.id,
      titre: q.titre,
      auteurId: q.auteurId ?? q.auteurid ?? null,
      categorie: q.categorie || ""   // 👈 IMPORTANT pour le filtre
    }));

    return res.status(200).json(out);
  } catch (err: any) {
    return bad(res, 500, "Erreur lecture quizz.json");
  }
}

// --- Crée un nouveau quiz à partir des données envoyées dans la requête ---
export function createQuiz(req: Request, res: Response) {
  try {
    const { id, titre, questions, categorie } = req.body;

    if (!id || !titre || !Array.isArray(questions))
      return bad(res, 400, "Champs manquants ou invalides");

    const rawCat = (categorie || "").toString().trim();

    const me = (req as any).user;
    if (!me) return bad(res, 401, "Authentification requise");

    const quizzes = readQuizzes();
    if (quizzes.some(q => q.id === id))
      return bad(res, 409, "Un quiz avec cet id existe déjà");

    const newQuiz: Quiz = {
      id,
      titre,
      questions: questions as Question[],
      faita: new Date().toISOString(),
      categorie: rawCat,
      auteurId: String(me.id)
    };

    quizzes.push(newQuiz);
    writeQuizzes(quizzes);
    return res.status(201).json({ message: "Quiz créé.", quiz: newQuiz });
  } catch (err: any) {
    return bad(res, 500, "Erreur création quiz");
  }
}


export function getQuizById(req: Request, res: Response): void {

  try {
    const data = fs.readFileSync(QUIZZ_PATH, "utf-8");
    const quizzes = data.trim() ? JSON.parse(data) : [];
    const quiz = quizzes.find((q: any) => q.id === req.params.id);

    if (!quiz) {
      res.status(404).json({ error: "Quiz introuvable." });
      return;
    }

    const quizSansCorrection = {
      id: quiz.id,
      titre: quiz.titre,
      questions: quiz.questions.map((q: any) => ({
        id: q.id,
        enonce: q.enonce,
        types: q.types,
        choisir: q.choisir // on garde les propositions, mais pas la solution
      })),
    };

    res.status(200).json(quizSansCorrection);
  } catch (err: any) {
    res.status(500).json({ error: "Erreur lecture quizz.json", detail: err.message });
  }
}

export function deleteQuiz(req: Request, res: Response) {
  const id = req.params.id;

  try {

    const raw = fs.readFileSync(QUIZZ_PATH, "utf-8");
    let quizzes: Quiz[] = [];

    if (raw.trim().length > 0) {
      quizzes = JSON.parse(raw);
    }

    // Recherche sans helper/ternaire
    let index = -1;
    let i = 0;
    while (i < quizzes.length) {
      if (quizzes[i].id === id) {
        index = i;
        break;
      }
      i = i + 1;
    }

    if (index === -1) {
      return res.status(404).json({ message: "Quiz introuvable" });
    }

    // Retirer l’élément trouvé
    quizzes.splice(index, 1);

    // Réécrire le fichier joliment
    fs.writeFileSync(QUIZZ_PATH, JSON.stringify(quizzes, null, 2), "utf-8");

    return res.status(200).json({ message: "Quiz supprimé", id: id });
  } catch (err) {
    console.error("Erreur suppression quiz:", err);
    return res.status(500).json({ message: "Erreur serveur pendant la suppression" });
  }
}

export function showQuizPage(req: Request, res: Response): void {
  try {
    const data = fs.readFileSync(QUIZZ_PATH, "utf-8");
    const quizzes = data.trim() ? JSON.parse(data) : [];
    const from = req.query.from as string || null;
    const quiz = quizzes.find((q: any) => q.id === req.params.id);

    if (!quiz) {
      res.status(404).render("error", { message: "Quiz introuvable." });
      return;
    }

    res.render("quizDetail", { quiz, from });
  } catch (err: any) {
    res.status(500).render("error", { message: "Erreur lecture quizz.json" });
  }
}

/** GET /categories — liste les catégories persistées */
export function getCategories(_req: Request, res: Response) {
  try {
    return res.json(readCategories());
  } catch (e) {
    console.error("getCategories:", e);
    return res.status(500).json({ message: "Erreur lecture catégories" });
  }
}

/** POST /categories — ajoute une catégorie (admin uniquement) */
export function addCategory(req: Request, res: Response) {
  try {
    const me: any = (req as any).user || null;
    if (!me || (me.role || "user") !== "admin") {
      return res.status(403).json({ message: "Accès refusé (admin requis)" });
    }

    const name = (req.body?.name || "").toString().trim();
    if (!name) return res.status(400).json({ message: "Nom requis" });

    const norm = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const list = readCategories();
    if (list.some(c => norm(c) === norm(name))) {
      return res.status(409).json({ message: "Catégorie déjà existante" });
    }

    list.push(name);
    writeCategories(list);
    return res.status(201).json({ message: "Catégorie ajoutée", name });
  } catch (e) {
    console.error("addCategory:", e);
    return res.status(500).json({ message: "Erreur ajout catégorie" });
  }
}

/** DELETE /categories/:name — supprime une catégorie (admin) */
export function deleteCategory(req: Request, res: Response) {
  try {
    const me: any = (req as any).user || null;
    if (!me || (me.role || "user") !== "admin") {
      return res.status(403).json({ message: "Accès refusé (admin requis)" });
    }

    const name = (req.params?.name || req.body?.name || "").toString().trim();
    if (!name) return res.status(400).json({ message: "Nom requis" });

    const norm = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const list = readCategories();
    const idx = list.findIndex(c => norm(c) === norm(name));
    if (idx < 0) return res.status(404).json({ message: "Catégorie introuvable" });

    // IMPORTANT: compter les usages
    const quizzes = readQuizzes(); // <-- assure-toi d'importer readQuizzes depuis quizModel
    const usedBy = quizzes.filter(q => q.categorie && norm(q.categorie) === norm(name)).length;

    const force = String(req.query.force || "").toLowerCase();
    const doForce = force === "1" || force === "true" || force === "yes";

    if (usedBy > 0 && !doForce) {
      return res.status(409).json({
        message: `Catégorie utilisée par ${usedBy} quiz. Ajoute ?force=1 pour forcer la suppression.`
      });
    }

    list.splice(idx, 1);
    writeCategories(list);
    return res.status(200).json({ message: "Catégorie supprimée", name });
  } catch (e) {
    console.error("deleteCategory:", e);
    return res.status(500).json({ message: "Erreur suppression catégorie" });
  }
}


