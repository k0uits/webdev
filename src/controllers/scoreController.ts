// src/controllers/scoreController.ts
import { Request, Response } from "express";
import { readQuizzes } from "../models/quizModel";
import { addPoints } from "../models/userModel";

function bad(res: Response, code: number, message: string) {
    return res.status(code).json({ message });
}

export async function awardScore(req: Request, res: Response) {
    try {
        const me: any = (req as any).user || null;
        if (!me) return bad(res, 401, "Authentification requise");

        const { quizId, answers } = req.body || {};
        if (!quizId || !answers || typeof answers !== "object") {
            return bad(res, 400, "Paramètres invalides");
        }

        const quizzes = readQuizzes();
        const quiz = quizzes.find(q => q.id === quizId);
        if (!quiz) return bad(res, 404, "Quiz introuvable");

        let score = 0;
        for (const q of quiz.questions) {
            const a = answers[q.id];
            const expected = (q.correction || []).slice().sort().join("|");
            if (Array.isArray(a)) {
                const got = a.slice().sort().join("|");
                if (got === expected) score++;
            } else if (typeof a === "string") {
                if (a === expected) score++;
            }
        }

        // 🚀 ajoute vraiment les points
        const updated = await addPoints(String(me.id), score);
        if (!updated) return bad(res, 404, "Utilisateur introuvable");

        return res.status(200).json({ message: "Points ajoutés", gained: score, total: updated.points });
    } catch (e) {
        console.error("awardScore:", e);
        return bad(res, 500, "Erreur attribution points");
    }
}
