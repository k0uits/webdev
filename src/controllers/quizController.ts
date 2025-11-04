import { Request, Response } from "express";
import { readQuizzes, writeQuizzes, Quiz, Question } from "../models/quizModel";
import fs from "fs";
import path from "path";

const QUIZZ_PATH = path.join(__dirname, "../../data/quizz.json");

// --- Fonction utilitaire pour renvoyer une réponse d’erreur HTTP ---
function bad(res: Response, code: number, message: string) {
  return res.status(code).json({ message });
}

// --- Affiche la page de création de quiz (vue "create") ---
export function getCreatePage(_req: Request, res: Response) {
  res.render("create");
}

// --- Renvoie la liste complète des quiz au format JSON ---
export function listQuizzes(_req: Request, res: Response) {
  try {
    const chemin = path.join(__dirname, "../../data/quizz.json");
    if (!fs.existsSync(chemin)) {
      fs.writeFileSync(chemin, "[]", { encoding: "utf-8" });
    }
    const data = fs.readFileSync(chemin, "utf-8");
    const quizzes = data.trim() ? JSON.parse(data) : [];

    const titles = quizzes.map((q: any) => ({
      id: q.id,
      titre: q.titre,
      auteurId: q.auteurId ?? q.auteurid ?? null, // tolérant pour anciens enregistrements
    }));

    return res.status(200).json(titles);
  } catch (err: any) {
    return bad(res, 500, "Erreur lecture quizz.json");
  }
}


// --- Crée un nouveau quiz à partir des données envoyées dans la requête ---
export function createQuiz(req: Request, res: Response) {
  try {
    const { id, titre, questions } = req.body;

    if (!id || !titre || !Array.isArray(questions))
      return bad(res, 400, "Champs manquants ou invalides");

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
      auteurId: String(me.id),     // ← ICI on affecte l’auteur
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
