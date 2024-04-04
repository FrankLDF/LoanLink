// importar BD conection
import { conection, query } from "../model/db-conection.js";
import clientControllers from "./clientControllers.js";

import passport from "passport";
// controllers
//funcion de notificacion
async function sendNotificacion(
  id_destinatario,
  id_solicitud,
  contenido,
  tipo_notificacion
) {
  try {
    const fecha = clientControllers.obtenerFecha();

    await query(
      `INSERT INTO notificaciones (id_destinatario, id_solicitud, contenido_notificacion, fecha_notificacion, tipo_notificacion) VALUES (?,?,?,?,?)`,
      [id_destinatario, id_solicitud, contenido, fecha, tipo_notificacion]
    );
  } catch (err) {
    console.error(err.message);
  }
}
async function verNotificacion(req, res) {
  try {
    const id = req.params.idN,
      nuevoEstado = 2;
    await query(
      `UPDATE notificaciones SET estado_notificacion = ? WHERE id_notificacion = ?`,
      [nuevoEstado, id]
    );
    res.redirect("/notificaciones");
  } catch (error) {
    console.error(error.message)
  }
  
  
}
async function rechazarNotificacion(req, res) {
  try {
    const id = req.params.id,
      nuevoEstado = 2;
    await query(
      `UPDATE notificaciones SET estado_notificacion = ? WHERE id_notificacion = ?`,
      [nuevoEstado, id]
    );
    const solicitud = await query(`SELECT id_solicitud FROM notificaciones WHERE id_notificacion = ${id}`)
    const id_solicitud = solicitud[0].id_solicitud,
      fecha_respuesta = clientControllers.obtenerFecha(),
      estado_solicitud = 3;
    await query(`UPDATE solicitud_prestamos SET fecha_respuesta = ? , estado_solicitud = ? WHERE id_solicitud_prestamo = ?`, [fecha_respuesta, estado_solicitud, id_solicitud]);

    const usuario = await query(`SELECT usuarios.nombre FROM usuarios JOIN notificaciones ON notificaciones.id_destinatario = usuarios.id_usuario WHERE notificaciones.id_notificacion = ${id}`)

    const solicituPrestamo = await query(`SELECT id_usuario, monto_solicitado FROM solicitud_prestamos WHERE id_solicitud_prestamo = ${id_solicitud}`)
    
    const id_destinatario = solicituPrestamo[0].id_usuario
    const contenido = `EL prestamista: ${usuario[0].nombre} ha rechazado su solicitud de prestamo de RD$${solicituPrestamo[0].monto_solicitado}.00`;

    await sendNotificacion(id_destinatario,null,contenido,1)

    res.redirect("/notificaciones");
    
  } catch (error) {
    console.error(error.message)
  }
}
async function aceptarNotificacion(req, res) {
  
}


const notificationView = async (req, res) => {
  const user = req.user;
  const notificaciones = await query(
    `SELECT notificaciones.* FROM notificaciones JOIN usuarios ON notificaciones.id_destinatario = usuarios.id_usuario WHERE usuarios.id_usuario = ${user[0].id_usuario} ORDER BY notificaciones.fecha_notificacion DESC`
  );

  for (const notificacion of notificaciones) {
    notificacion.fechaFormateada = new Date(notificacion.fecha_notificacion);
  }
  res.render("notifications-view", {
    titulo:'LoanLink-notificaciones',
    notificaciones,
  });
};

// vista inicial de la app
const home = (req, res) => {
  res.render("home", { titulo: "LoanLink" });
};

//Llamada a la vista before register
const beforeRegister = (req, res) => {
  res.render("before-register", { titulo: "LoanLink-register" });
};

// Llama la funcion register
const callRegister = (req, res) => {
  const { tipo_usuario } = req.body;
  res.redirect("/register?tipo=" + tipo_usuario);
};

// llamada a vista de registro de usuarios
const userRegisterform = (req, res) => {
  const tipo_usuario = req.query.tipo;
  res.render("user-register", {
    titulo: "LoanLink-register",
    tipoUsuario: tipo_usuario,
  });
};

// registro de user a db
const addUser = async (req, res, next) => {
  const {
    tipo_usuario,
    nombre,
    apellido,
    nacionalidad,
    telefono,
    tipo_documento,
    documento,
    direccion,
    correo_electronico,
    pass,
    confirmpass,
    client_id,
    client_secret,
  } = req.body;
  if (pass !== confirmpass) {
    // Si no son iguales, renderizar la vista de registro con un mensaje de error
    return res.render("user-register", {
      error:
        "Las contraseñas no coinciden, intenta nuevamente colocando los datos correctos",
    });
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
  const ofertasPublicadas = ofertas.map((row) => {
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
  });

  const notificacioness = await query(
    `SELECT notificaciones.* FROM  notificaciones JOIN usuarios ON notificaciones.id_destinatario = usuarios.id_usuario WHERE usuarios.id_usuario = ${user[0].id_usuario} AND notificaciones.estado_notificacion = 1`
  );

  if (user) {
    res.render("user-home", {
      titulo: "LoanLink-home",
      user,
      publications,
      ofertasPublicadas,
      notificacioness,
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

const mensajeView = (req, res) => {
  res.render('mensajes',{titulo:"LoanLink-Message"});
}

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
  sendNotificacion,
  notificationView,
  verNotificacion,
  rechazarNotificacion,
  aceptarNotificacion,
  mensajeView,
};
