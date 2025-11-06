import express from "express";
import { requireAdmin } from "../middleware/authAdmin";
import { renderAdminPage, deleteUser, updateUser, updateUserPassword  } from "../controllers/adminController";

const router = express.Router();

router.get("/admin", requireAdmin, renderAdminPage);
router.post("/admin/users/:id/delete", requireAdmin, deleteUser);
router.post("/admin/users/:id/update", requireAdmin, updateUser);
router.post("/admin/users/:id/password", requireAdmin, updateUserPassword);

export default router;
