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
export function listQuizzes(req: Request, res: Response) {
  try {
    const chemin = path.join(__dirname, "../../data/quizz.json");
    if (!fs.existsSync(chemin)) {
      fs.writeFileSync(chemin, "[]", { encoding: "utf-8" });
    }
    const data = fs.readFileSync(chemin, "utf-8");
    const quizzes = data.trim() ? JSON.parse(data) : [];
    //const titles = quizzes.map((q: any) => ({ id: q.id, titre: q.titre }));

    const anyReq: any = req;
    const user = anyReq ? anyReq.user : undefined;

    const titles: any[] = [];

    for (let i = 0; i < quizzes.length; i++) {
      const q = quizzes[i];

      const item: any = {
        id: q.id,
        titre: q.titre
      };

      // Ajouter le propriétaire si existant
      if (q.ownerId !== undefined) {
        item.ownerId = q.ownerId;
      }
      if (q.ownerEmail !== undefined) {
        item.ownerEmail = q.ownerEmail;
      }

      // Calcul canDelete sans ternaire
      let canDelete = false;

      if (user && user.role && String(user.role) === "admin") {
        canDelete = true;
      } else {
        if (user) {
          let sameId = false;
          if (q.ownerId !== undefined && q.ownerId !== null) {
            sameId = String(user.id) === String(q.ownerId);
          }

          let sameEmail = false;
          if (q.ownerEmail) {
            sameEmail = String(user.email || "") === String(q.ownerEmail);
          }

          if (sameId || sameEmail) {
            canDelete = true;
          }
        }
      }

      item.canDelete = canDelete;

      titles.push(item);
    }


    res.status(200).json(titles);
    //res.json(readQuizzes());
  } catch (err: any) {
    return bad(res, 500, "Erreur lecture quizz.json");
  }
}

// --- Crée un nouveau quiz à partir des données envoyées dans la requête ---
export function createQuiz(req: Request, res: Response) {
  try {
    const { id, titre, questions } = req.body;

    // Vérification des champs obligatoires
    if (!id || !titre || !Array.isArray(questions))
      return bad(res, 400, "Champs manquants ou invalides");

    const quizzes = readQuizzes();

    // Empêche la création d’un quiz avec un identifiant déjà existant
    if (quizzes.some(q => q.id === id)) {
      return bad(res, 409, "Un quiz avec cet id existe déjà");
    }

    // === AJOUTER juste avant de construire/pousser newQuiz ===
    const anyReq: any = req;
    let ownerIdValue: any = undefined;
    let ownerEmailValue: string | undefined = undefined;

    if (anyReq && anyReq.user) {
      ownerIdValue = anyReq.user.id;
      if (anyReq.user.email) {
        ownerEmailValue = String(anyReq.user.email);
      }
    }

    // Création de l’objet quiz conforme au modèle
    const newQuiz: Quiz = {
      id,
      titre,
      questions: questions as Question[],
      faita: new Date().toISOString(), // Date d’ajout
      ownerId: ownerIdValue,
      ownerEmail: ownerEmailValue
    };

    // Ajout du nouveau quiz et écriture dans le fichier JSON
    quizzes.push(newQuiz);
    writeQuizzes(quizzes);

    // Réponse HTTP 201 (créé)
    res.status(201).json({ message: "Quiz créé.", quiz: newQuiz });
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

    const anyReq: any = req;
    if (!anyReq.user) {
      return res.status(401).json({ message: "Authentification requise" });
    }

    const quiz = quizzes[index];

    // admin ?
    let isAdmin = false;
    if (anyReq.user.role && String(anyReq.user.role) === "admin") {
      isAdmin = true;
    }

    if (!isAdmin) {
      // propriétaire par id/email
      let ownerId: string = "";
      if (quiz && quiz.ownerId !== undefined && quiz.ownerId !== null) {
        ownerId = String(quiz.ownerId);
      }

      let ownerEmail: string = "";
      if (quiz && quiz.ownerEmail) {
        ownerEmail = String(quiz.ownerEmail);
      } else {
        // compat éventuelle si tu avais déjà stocké un email à un autre champ
        if (quiz && quiz.email) {
          ownerEmail = String(quiz.email);
        }
      }

      let sameId = false;
      if (anyReq.user.id !== undefined && anyReq.user.id !== null) {
        sameId = String(anyReq.user.id) === ownerId;
      }

      let sameEmail = false;
      if (anyReq.user.email) {
        sameEmail = String(anyReq.user.email) === ownerEmail;
      }

      if (!sameId && !sameEmail) {
        return res.status(403).json({ message: "Vous n'avez pas le droit de supprimer ce quiz" });
      }
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
