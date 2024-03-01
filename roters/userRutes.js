import { Router } from "express";
import userController from "../controllers/userController.js";
import loanControllers from "../controllers/loanControllers.js";

const router = Router();

router.get("/", userController.home);
router.get("/register", userController.userRegisterform);
router.get("/login", userController.userLoginForm);

router.get("/user-home", userController.userHome);

router.get("/new-publication", loanControllers.newPublication);
export default router;