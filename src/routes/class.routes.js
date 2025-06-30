import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addStudentToClass, createClass, getAllClassesForStudents, getAllClassesForTeacher, getClassDetails } from "../controllers/class.controller.js";

const router = Router()

router.route("/create-class").post(verifyJWT, createClass)
router.route("/get-classForTeacher/:teacherId").get(verifyJWT, getAllClassesForTeacher)
router.route("/get-class-details/:classId").get(verifyJWT, getClassDetails)
router.route("/add-student/:classId").get(verifyJWT, addStudentToClass)
router.route("/get-classForStudent").get(verifyJWT, getAllClassesForStudents)

export default router