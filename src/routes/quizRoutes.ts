import { Router } from "express";
import { getCreatePage, listQuizzes, createQuiz, getQuizById, deleteQuiz, showQuizPage, getCategories, addCategory, deleteCategory } from "../controllers/quizController";
import { ensureAuthenticated, ensureAuthenticatedPage } from "../middleware/auth";
import { requireAdmin } from "../middleware/authAdmin";

const router = Router();

router.get("/quizzes/mine", ensureAuthenticatedPage, (req, res) => {
    const anyReq: any = req;
    res.render("myallquiz", { user: anyReq.user, mode: "mine" });
});

router.get("/quizzes/all", (req, res) => {
    const anyReq: any = req;
    res.render("myallquiz", { user: anyReq.user || null, mode: "all" });
});

// Page de création (formulaire)
router.get("/quizzes/new", ensureAuthenticatedPage, getCreatePage);

router.get("/quizzes/api/:id", getQuizById);

router.get("/quizzes/:id", showQuizPage);

// API : liste des quiz
router.get("/quizzes", listQuizzes);

// API : création d'un quiz
router.post("/quizzes", createQuiz);

// Suppression d'un quiz
router.delete("/quizzes/:id", deleteQuiz);

router.post("/quizzes", ensureAuthenticated, createQuiz);

// suppression réservée aux connectés (logique fine dans deleteQuiz)
router.delete("/quizzes/:id", ensureAuthenticated, deleteQuiz);

// Catégories
router.get("/categories", getCategories);
router.post("/categories", ensureAuthenticated, requireAdmin, addCategory);

// suppression catégorie réservée aux admins
router.delete("/categories/:name", ensureAuthenticated, requireAdmin, deleteCategory);

export default router;