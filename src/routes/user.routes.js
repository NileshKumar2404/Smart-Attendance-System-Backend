import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { changeCurrentPassword, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails } from "../controllers/user.controller.js";

const router = Router()

router.route("/register-user").post(registerUser)
router.route("/login-user").post(loginUser)
router.route("/logout-user").post(verifyJWT, logoutUser)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/refresh-accessToken").post(verifyJWT, refreshAccessToken)
router.route("/update-account-details").post(verifyJWT, updateAccountDetails)

export default router;