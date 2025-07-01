import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { createSession, getSessionById, getSessionForClass } from "../controllers/session.controller.js";

const router = Router()

router.route("/create-session").post(verifyJWT, authorizeRoles("Teacher"), createSession)
router.route("/get-session-class/:classId").get(verifyJWT, getSessionForClass)
router.route("/get-session/:sessionId").get(verifyJWT, getSessionById)

export default router