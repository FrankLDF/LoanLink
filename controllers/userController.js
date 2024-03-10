// importar BD conection
import { conection, query } from "../model/db-conection.js";

import passport from "passport";
// controllers
// vista inicial de la app
const home = (req, res) => {
  res.render("home", { titulo: "LoanLink" });
};

//Llamada a la vista before register
const beforeRegister = (req, res) => {
  res.render("before-register", { titulo: "LoanLink-register" });
 }

// Llama la funcion register
const callRegister = (req, res) => {
  const { tipo_usuario } = req.body
  res.redirect("/register?tipo="+tipo_usuario)
 } 

// llamada a vista de registro de usuarios
const userRegisterform = (req, res) => {
  const tipo_usuario  = req.query.tipo;
  res.render("user-register", { titulo: "LoanLink-register", tipoUsuario: tipo_usuario });
};

// registro de user a db
const addUser = async (req, res, next) => {
  const { tipo_usuario, nombre, apellido, nacionalidad, telefono, tipo_documento, documento, direccion, correo_electronico, pass, confirmpass, client_id, client_secret } = req.body
  if (pass !== confirmpass) {
    // Si no son iguales, renderizar la vista de registro con un mensaje de error
    return res.render("user-register", {error:"Las contraseñas no coinciden, intenta nuevamente colocando los datos correctos",});
  }
  try {
    const existingUser = await query(
      "SELECT * FROM usuarios WHERE documento = ? OR correo_electronico = ? OR client_id = ? OR client_secret = ?",
      [documento, correo_electronico, client_id, client_secret]
    );
    if (existingUser.length > 0) {
      return res.render("user-register", {
        error:
          "Ya existe un usuario con alguna de estas credenciales: Numero de documento, correo electronico o credenciales Paypal",
      });
    }
    const tipo_usuario_int = parseInt(tipo_usuario);
    const tipo_documento_int = parseInt(tipo_documento);
    await query(
      "INSERT INTO usuarios (nombre, apellido, nacionalidad, tipo_documento, documento, telefono, direccion, tipo_usuario, client_id, client_secret, contrasena, correo_electronico) Values (?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        nombre,
        apellido,
        nacionalidad,
        tipo_documento_int,
        documento,
        telefono,
        direccion,
        tipo_usuario_int,
        client_id,
        client_secret,
        pass,
        correo_electronico,
      ]
    );
    let newUser = await query(
      "SELECT * FROM usuarios WHERE correo_electronico = ? LIMIT 1",
      [correo_electronico]
    );
    newUser = newUser[0];
    // Autenticar al usuario después del registro exitoso
    req.login(newUser, (err) => {
      if (err) {
        console.error(`Error al iniciar sesión: ${err.message}`);
        return next(err);
      }
      return res.redirect("/user-home");
    });
  } catch (error) {
    console.error(`error al ejecutar las consulta: ${error.message}`);
    next(error);
  }
  
};

// llamada de vista de login
const userLoginForm = (req, res) => {
  res.render("user-login", { titulo: "LoanLink-login" });
};

const verifyUser = (req, res, next) => {
  console.log(req.body)
  // Utiliza el middleware de Passport para autenticar al usuario
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      // Si hay un error en la autenticación, pasa el error al siguiente middleware
      return next(err);
    }
    if (!user) {
      // Si el usuario no existe o las credenciales son incorrectas, redirige al usuario a la página de inicio de sesión con un mensaje de error
      return res.render("user-login", { error: info.message });
    }
    // Si las credenciales son correctas, inicia la sesión del usuario
    req.login(user, (err) => {
      if (err) {
        // Si hay un error al iniciar sesión, pasa el error al siguiente middleware
        return next(err);
      }
      // Si se inicia sesión correctamente, redirige al usuario a la página de inicio de usuario
      return res.redirect("/user-home");
    });
  })(req, res, next); // Ejecuta la función de autenticación de Passport

};

// llamada de vista del home de usuarios ya registrado
const userHome = async (req, res) => {
  const user = req.user;
  const publications = await query(
    `SELECT publicacion_prestamos.* FROM publicacion_prestamos JOIN usuarios ON publicacion_prestamos.id_usuario = usuarios.id_usuario WHERE usuarios.id_usuario = ${user[0].id_usuario}`
  );
  const ofertas = await query(`SELECT * FROM publicacion_prestamos;`);
  const ofertasPublicadas = ofertas.map(row => {
      return {
        id_publicacion_prestamo: row.id_publicacion_prestamo,
        id_usuario: row.id_usuario,
        nombre_prestamista: row.nombre_prestamista,
        descripcion: row.descripcion,
        tasa_interes: row.tasa_interes,
        cant_min: row.cant_min,
        cant_max: row.cant_max,
        requisitos: row.requisitos,
      };
  })
  
  
  if (user) {
    res.render("user-home", {
      titulo: "LoanLink-home",
      user,
      publications,
      ofertasPublicadas,
    });
  } else {
    // Manejo de caso en que no se encuentran los datos del usuario
    res.redirect("/login");
  }
};

const isLoggedIn = (req, res, next) => {
  // Si el usuario ha iniciado sesión, continúa con la siguiente función en la ruta
  if (req.isAuthenticated()) {
    return next();
  }
  // Si el usuario no ha iniciado sesión, redirige al inicio de sesión
  res.redirect("/login");
};

export default {
  home,
  beforeRegister,
  callRegister,
  userRegisterform,
  addUser,
  userLoginForm,
  verifyUser,
  userHome,
  isLoggedIn,
};
