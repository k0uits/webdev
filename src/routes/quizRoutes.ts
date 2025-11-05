import { Router, } from "express";
import { getCreatePage, listQuizzes, createQuiz, getQuizById, deleteQuiz  } from "../controllers/quizController";
import { ensureAuthenticated } from "../middleware/auth";

const router = Router();

router.get("/quizzes/mine", ensureAuthenticated, (req, res) => {
  const anyReq: any = req;
  res.render("myallquiz", { user: anyReq.user, mode: "mine" });
});

router.get("/quizzes/all", (req, res) => {
  const anyReq: any = req;
  res.render("myallquiz", { user: anyReq.user || null, mode: "all" });
});

// Page de création (formulaire)
router.get("/quizzes/new", getCreatePage);

router.get("/quizzes/:id", getQuizById);

// API : liste des quiz
router.get("/quizzes", listQuizzes);

// API : création d’un quiz
router.post("/quizzes", createQuiz);

// Suppression d'un quiz
router.delete("/quizzes/:id", deleteQuiz);

router.post("/quizzes",ensureAuthenticated , createQuiz);

// suppression réservée aux connectés (logique fine dans deleteQuiz)
router.delete("/quizzes/:id", ensureAuthenticated, deleteQuiz);


export default router;