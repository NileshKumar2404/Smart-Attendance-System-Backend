import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { getAttendanceForSession, getAttendanceForStudent, MarkAttendance } from "../controllers/attendance.controller.js";


const router = Router()

router.route("/mark-attendance").post(verifyJWT, MarkAttendance)
router.route("/get-attendance-session/:sessionId").get(verifyJWT, getAttendanceForSession)
router.route("/get-attendance-student").get(verifyJWT, getAttendanceForStudent)


export default router