import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { getAttendanceForSession, getAttendanceForStudent, MarkAttendance } from "../controllers/attendance.controller.js";


const router = Router()

router.route("/mark-attendance").post(verifyJWT, authorizeRoles("Student"), MarkAttendance)
router.route("/get-attendance-session/:sessionId").get(verifyJWT, authorizeRoles("Teacher"), getAttendanceForSession)
router.route("/get-attendance-student").get(verifyJWT, authorizeRoles("Student"), getAttendanceForStudent)


export default router