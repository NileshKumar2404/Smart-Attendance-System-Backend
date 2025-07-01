import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { addStudentToClass, createClass, getAllClassesForStudents, getAllClassesForTeacher, getClassDetails } from "../controllers/class.controller.js";

const router = Router()

router.route("/create-class").post(verifyJWT, authorizeRoles("Teacher"), createClass)
router.route("/get-classForTeacher/:teacherId").get(verifyJWT, authorizeRoles("Teacher"), getAllClassesForTeacher)
router.route("/get-class-details/:classId").get(verifyJWT, getClassDetails)
router.route("/add-student/:classId").post(verifyJWT, authorizeRoles("Teacher"), addStudentToClass)
router.route("/get-classForStudent").get(verifyJWT, authorizeRoles("Student"), getAllClassesForStudents)

export default router