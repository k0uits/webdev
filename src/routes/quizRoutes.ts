import { Router, } from "express";
import { getCreatePage, listQuizzes, createQuiz, getQuizById, deleteQuiz  } from "../controllers/quizController";
import { attachUser } from "../middleware/auth";

const router = Router();



// Page de création (formulaire)
router.get("/quizzes/new", getCreatePage);

router.get("/quizzes/:id", getQuizById);

// API : liste des quiz
router.get("/quizzes", listQuizzes);

// API : création d’un quiz
router.post("/quizzes", createQuiz);

// Suppression d'un quiz
router.delete("/quizzes/:id", deleteQuiz);

router.post("/quizzes",attachUser , createQuiz);

// suppression réservée aux connectés (logique fine dans deleteQuiz)
router.delete("/quizzes/:id", attachUser, deleteQuiz);

export default router;