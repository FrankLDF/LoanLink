import { Router } from "express";
import userController from "../controllers/userController.js";
import loanControllers from "../controllers/loanControllers.js";
import clientControllers from "../controllers/clientControllers.js";
import payController from "../controllers/payController.js";
import pagoPrestamoController from "../controllers/pagoPrestamoController.js";

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
router.post("/new-publication", userController.isLoggedIn ,loanControllers.addPublication);
router.get("/loan-clients", userController.isLoggedIn, loanControllers.loanClients);
router.get("/prestamo-info/:idPr", userController.isLoggedIn, loanControllers.prestamoInfo);

router.get("/solicita-prestamo/:idP", userController.isLoggedIn, clientControllers.solicitarPrestamo);
router.post("/solicita-prestamo/:idP/:idc", userController.isLoggedIn, clientControllers.addSolicitud);
router.get("/prestamos-activos", userController.isLoggedIn,clientControllers.prestamosClientes)
router.get("/detalles-prestamo/:idPr", userController.isLoggedIn, clientControllers.cInfoPrestamo);
router.get("/pago-prestamo/:idP", userController.isLoggedIn, pagoPrestamoController.pagoPrestamo);
router.get("/capture-pago/:idP", userController.isLoggedIn, pagoPrestamoController.capturePago);
router.get("/cancel-pago/:idP", userController.isLoggedIn, pagoPrestamoController.cancelPago);

router.get("/notificaciones", userController.isLoggedIn, userController.notificationView);
router.get("/ver-notificacion/:idN", userController.isLoggedIn, userController.verNotificacion);
router.get("/rechazar-notificacion/:id", userController.isLoggedIn, userController.rechazarNotificacion);
router.get("/detalle-notificacion/:idN", userController.isLoggedIn, loanControllers.detalleNotificacion);
router.get("/aceptar-notificacion/:idN", userController.isLoggedIn, payController.aceptaSolicitud);
router.get("/capture-order/:idN", userController.isLoggedIn, payController.captureOrder);
router.get("/cancel-order", userController.isLoggedIn, payController.cancelOrder);


router.get("/chat", userController.isLoggedIn, userController.mensajeView);

export default router;