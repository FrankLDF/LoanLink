import { Router } from "express";
import userController from "../controllers/userController.js";
import loanControllers from "../controllers/loanControllers.js";

const router = Router();

router.get("/", userController.home);

router.get("/before-register", userController.beforeRegister);
router.post("/before-register", userController.callRegister);
router.get("/register", userController.userRegisterform);
router.post("/register", userController.addUser);


router.get("/login", userController.userLoginForm);
router.post("/login", userController.verifyUser);


router.get("/user-home", userController.isLoggedIn, userController.userHome);
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      // Maneja el error si es necesario
      console.error(err);
    }
    res.redirect("/"); // Redirige al usuario a la página de inicio o a donde desees
  });
});

router.get("/new-publication", userController.isLoggedIn, loanControllers.newPublication);
router.post("/new-publication", loanControllers.addPublication);
router.get("/loan-clients", loanControllers.loanClients);
export default router;