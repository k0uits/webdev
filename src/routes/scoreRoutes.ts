import { Router } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { awardScore } from "../controllers/scoreController";
import { getLeaderboard } from "../controllers/userController";

const router = Router();

// attribue les points après un quiz
router.post("/score/award", ensureAuthenticated, awardScore);

// renvoie le classement (pour la home)
router.get("/leaderboard", getLeaderboard);


export default router;
