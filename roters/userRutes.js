import { Router } from "express";
import userController from "../controllers/userController.js";
import loanControllers from "../controllers/loanControllers.js";
import clientControllers from "../controllers/clientControllers.js";

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

router.get("/solicita-prestamo/:idP", userController.isLoggedIn, clientControllers.solicitarPrestamo);
router.post("/solicita-prestamo/:idP/:idc", userController.isLoggedIn, clientControllers.addSolicitud);

router.get("/notificaciones", userController.isLoggedIn, userController.notificationView);
router.get("/ver-notificacion/:idN", userController.isLoggedIn, userController.verNotificacion)
router.get("/rechazar-notificacion/:id", userController.isLoggedIn, userController.rechazarNotificacion)
export default router;