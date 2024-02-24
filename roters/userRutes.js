import { Router } from "express";
import userController from "../controllers/userController.js";

const router = Router();

router.get("/", userController.userHome);
router.get("/login", userController.userLoginForm);

export default router;