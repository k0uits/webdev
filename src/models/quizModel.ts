import fs from "fs";
import path from "path";

// --- Définition des types et interfaces pour structurer les données du quiz ---
export type TypeQuestion = "simple" | "multiple";

export interface Choix { id: string; texte: string; }
export interface Question {
  id: string;
  enonce: string;
  types: TypeQuestion;
  choisir: Choix[];
  correction: string[];
}
export interface Quiz {
  id: string;
  titre: string;
  questions: Question[];
  faita: string;
  categorie?: string;
  image?: string;

  auteurId?: string;
  ownerId?: string;
  createdBy?: string;
  userId?: string;
}

// --- Définition du chemin vers le fichier de stockage des quiz ---
const DATA_PATH = path.join(__dirname, "../../data/quizz.json");

// --- Vérifie que le fichier de données existe, sinon le crée vide ---
export function ensureDataFile() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, "[]", "utf-8");
  }
}

// --- Lit et renvoie la liste des quiz à partir du fichier JSON ---
export function readQuizzes(): Quiz[] {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
}

// --- Écrit (met à jour) la liste complète des quiz dans le fichier JSON ---
export function writeQuizzes(q: Quiz[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(q, null, 2), "utf-8");
}
