import { Router, } from "express";
import { getCreatePage, listQuizzes, createQuiz, getQuizById, deleteQuiz  } from "../controllers/quizController";

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

export default router;