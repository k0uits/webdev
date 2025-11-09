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
      image: q.image || null,
      auteurId: q.auteurId ?? q.auteurid ?? null,
      categorie: q.categorie ?? q.category ?? ""
    }));

    return res.status(200).json(out);
  } catch (err: any) {
    return bad(res, 500, "Erreur lecture quizz.json");
  }
}

// --- Crée un nouveau quiz à partir des données envoyées dans la requête ---
export function createQuiz(req: Request, res: Response) {
  try {
    const { id, titre, image, questions, categorie } = req.body;

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
      image: (image || "").trim(), // ✅ ajout du lien d’image
      questions: questions as Question[],
      faita: new Date().toISOString(),
      categorie: rawCat,

      ownerId: String(me.id),
      auteurId: String(me.id),
      createdBy: String(me.id),
      userId: String(me.id)
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

// --- GET /quizzes/:id/edit ---
export async function getEditPage(req: Request, res: Response) {
  const anyReq: any = req;
  if (!anyReq.user) {
    return res.status(401).send("Authentification requise");
  }

  const id = String(req.params.id);
  const chemin = path.join(__dirname, "../../data/quizz.json");
  if (!fs.existsSync(chemin)) {
    fs.writeFileSync(chemin, "[]", { encoding: "utf-8" });
  }

  const raw = fs.readFileSync(chemin, "utf-8");
  const quizzes = raw.trim() ? JSON.parse(raw) : [];
  let found = null;
  for (let i = 0; i < quizzes.length; i++) {
    if (String(quizzes[i].id) === id) {
      found = quizzes[i];
      break;
    }
  }
  if (!found) {
    return res.status(404).send("Quiz introuvable");
  }

  /*// autorisation: admin ou propriétaire
  let isAdmin = false;
  if (anyReq.user.role && String(anyReq.user.role) === "admin") {
    isAdmin = true;
  }

  let isOwner = false;
  if (found.ownerId !== undefined && found.ownerId !== null) {
    isOwner = String(found.ownerId) === String(anyReq.user.id);
  } else {
    if (found.ownerEmail && anyReq.user.email) {
      isOwner = String(found.ownerEmail) === String(anyReq.user.email);
    }
  }

  if (!isAdmin && !isOwner) {
    return res.status(403).send("Vous n'avez pas le droit de modifier ce quiz");
  }*/

  // autorisation: admin ou propriétaire (compat multi-champs)
  let isAdmin = false;
  if (anyReq.user && anyReq.user.role && String(anyReq.user.role) === "admin") {
    isAdmin = true;
  }

  let isOwner = false;
  if (anyReq.user) {
    const uid = String(anyReq.user.id);

    // ID possibles
    const ids: any[] = [];
    if (found.ownerId !== undefined && found.ownerId !== null) ids.push(found.ownerId);
    if (found.auteurId !== undefined && found.auteurId !== null) ids.push(found.auteurId);
    if (found.createdBy !== undefined && found.createdBy !== null) ids.push(found.createdBy);
    if (found.userId !== undefined && found.userId !== null) ids.push(found.userId);

    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i]) === uid) {
        isOwner = true;
        break;
      }
    }
  }

  if (!isAdmin && !isOwner) {
    return res.status(403).send("Vous n'avez pas le droit de modifier ce quiz");
  }



  // rendre la vue d'édition
  return res.render("edit", { user: anyReq.user, quiz: found });
}

// --- POST /quizzes/:id/edit ---
export async function updateQuiz(req: Request, res: Response) {
  const anyReq: any = req;
  if (!anyReq.user) {
    return res.status(401).json({ ok: false, message: "Authentification requise" });
  }

  const id = String(req.params.id);
  const body = req.body || {};

  // validations minimales
  const titre = (body.titre || "").toString().trim();
  const categorie = (body.categorie || "").toString().trim();
  const questions = Array.isArray(body.questions) ? body.questions : [];

  if (!titre) return res.status(400).json({ ok: false, message: "Titre requis" });
  if (!categorie) return res.status(400).json({ ok: false, message: "Catégorie requise" });
  if (questions.length === 0) {
    return res.status(400).json({ ok: false, message: "Au moins une question est requise" });
  }

  const fs = await import("fs");
  const path = await import("path");
  const chemin = path.join(__dirname, "../../data/quizz.json");
  if (!fs.existsSync(chemin)) {
    fs.writeFileSync(chemin, "[]", { encoding: "utf-8" });
  }

  const raw = fs.readFileSync(chemin, "utf-8");
  const quizzes = raw.trim() ? JSON.parse(raw) : [];

  // retrouver l'objet existant
  let index = -1;
  for (let i = 0; i < quizzes.length; i++) {
    if (String(quizzes[i].id) === id) {
      index = i;
      break;
    }
  }
  if (index === -1) {
    return res.status(404).json({ ok: false, message: "Quiz introuvable" });
  }

  const existing = quizzes[index];

  /*// autorisation: admin ou propriétaire (ownerId/auteurId ou ownerEmail/auteurEmail)
  let isAdmin = false;
  if (anyReq.user.role && String(anyReq.user.role) === "admin") {
    isAdmin = true;
  }

  let isOwner = false;
  if (existing.ownerId !== undefined && existing.ownerId !== null) {
    isOwner = String(existing.ownerId) === String(anyReq.user.id);
  } else if (existing.auteurId !== undefined && existing.auteurId !== null) {
    isOwner = String(existing.auteurId) === String(anyReq.user.id);
  } else {
    // fallback email si ton ancien schéma stockait l’email
    if (existing.ownerEmail && anyReq.user.email) {
      isOwner = String(existing.ownerEmail) === String(anyReq.user.email);
    } else if (existing.auteurEmail && anyReq.user.email) {
      isOwner = String(existing.auteurEmail) === String(anyReq.user.email);
    }
  }

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ ok: false, message: "Vous n'avez pas le droit de modifier ce quiz" });
  }*/

  // autorisation: admin ou propriétaire (compat multi-champs)
  let isAdmin = false;
  if (anyReq.user && anyReq.user.role && String(anyReq.user.role) === "admin") {
    isAdmin = true;
  }

  let isOwner = false;
  if (anyReq.user) {
    const uid = String(anyReq.user.id);

    const ids: any[] = [];
    if (existing.ownerId !== undefined && existing.ownerId !== null) ids.push(existing.ownerId);
    if (existing.auteurId !== undefined && existing.auteurId !== null) ids.push(existing.auteurId);
    if (existing.createdBy !== undefined && existing.createdBy !== null) ids.push(existing.createdBy);
    if (existing.userId !== undefined && existing.userId !== null) ids.push(existing.userId);

    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i]) === uid) {
        isOwner = true;
        break;
      }
    }
  }

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ ok: false, message: "Vous n'avez pas le droit de modifier ce quiz" });
  }

  // >>>>>>>>> CORRECTION CRITIQUE ICI <<<<<<<<<
  // On conserve tout l'objet existant (dont les champs de propriété),
  // et on met à jour uniquement titre/categorie/questions.
  const updated = { ...existing };
  updated.titre = titre;
  updated.categorie = categorie;
  updated.questions = questions;
  if (typeof body.image === "string") {
    const trimmed = body.image.trim();
    // si vide → on supprime l'image
    updated.image = trimmed.length > 0 ? trimmed : null;
  } else {
    updated.image = existing.image || null;
  }
  // on NE CHANGE PAS updated.id
  // on NE TOUCHE PAS aux champs de propriété (ownerId, ownerEmail, auteurId, auteurEmail, etc.)

  quizzes[index] = updated;
  fs.writeFileSync(chemin, JSON.stringify(quizzes, null, 2), { encoding: "utf-8" });

  return res.json({ ok: true, message: "Quiz mis à jour" });
}


