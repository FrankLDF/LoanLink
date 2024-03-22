import { conection, query } from "../model/db-conection.js";
import passport from "passport";
import userController from "./userController.js";

// funcion para obtener fecha actual en formato DATETIME
  function obtenerFecha() {
    const ahora = new Date();
    const year = ahora.getFullYear();
    const month = ("0" + (ahora.getMonth() + 1)).slice(-2); // Agrega un cero delante si es necesario
    const day = ("0" + ahora.getDate()).slice(-2); // Agrega un cero delante si es necesario
    const hour = ("0" + ahora.getHours()).slice(-2); // Agrega un cero delante si es necesario
    const minute = ("0" + ahora.getMinutes()).slice(-2); // Agrega un cero delante si es necesario
    const second = ("0" + ahora.getSeconds()).slice(-2); // Agrega un cero delante si es necesario
    return (
      year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second
    );
}
 // Para llamar la vista de solicitud de prestamos
const solicitarPrestamo = async (req, res) => {
  const id_usuario = req.user[0].id_usuario;
  const id_publicacion_prestamo = req.params.idP,
    cliente = req.user[0];
  const prestamista = await query(
    `SELECT usuarios.nombre, usuarios.apellido FROM usuarios JOIN publicacion_prestamos ON usuarios.id_usuario = publicacion_prestamos.id_usuario WHERE publicacion_prestamos.id_publicacion_prestamo = ${id_publicacion_prestamo}`
  );
  const nombrePrestamista = `${prestamista[0].nombre} ${prestamista[0].apellido}`;
  res.render("solicita-prestamo", {
    cliente,
    id_publicacion_prestamo,
    nombrePrestamista,
    id_usuario,
  });
};
// para recibir la solicitud y insertar en la BD
const addSolicitud = async (req, res) => {
  try {
    const id_usuario = req.params.idc;
    const id_tipo_prestamo = 1;
    const id_publicacion = req.params.idP;
    const {
      monto_solicitado,
      plazo_deseado,
      motivo_prestamo,
      empleo_actual,
      contacto_empleador,
      cargo_posicion,
      ingresos_mensuales,
      nombre_referencia,
      contacto_referencia,
    } = req.body;
    const fecha_solicitud = obtenerFecha();
    const estado_solicitud = 1;
    await query(
      `INSERT INTO solicitud_prestamos (id_usuario, id_tipo_prestamo, id_publicacion, monto_solicitado, plazo_deseado, motivo_prestamo, empleo_actual, contacto_empleador, cargo_posicion, ingresos_mensuales, nombre_referencia, contacto_referencia, fecha_solicitud, estado_solicitud) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
        id_usuario,
        id_tipo_prestamo,
        id_publicacion,
        monto_solicitado,
        plazo_deseado,
        motivo_prestamo,
        empleo_actual,
        contacto_empleador,
        cargo_posicion,
        ingresos_mensuales,
        nombre_referencia,
        contacto_referencia,
        fecha_solicitud,
        estado_solicitud,
      ]
    );

    // generar una notificacion de la nueva solicitud
    const destinatario = await query(
      `SELECT usuarios.id_usuario FROM usuarios JOIN publicacion_prestamos ON usuarios.id_usuario = publicacion_prestamos.id_usuario WHERE publicacion_prestamos.id_publicacion_prestamo = ${id_publicacion}`
    );
    const id = await query('SELECT LAST_INSERT_ID() as id');
    const id_solicitud = id[0].id;
    const contenido = `${req.user[0].nombre} ${req.user[0].apellido} ha solicitado un prestamo de: $${monto_solicitado}`

    //llamando la funcion que agrega las notificaciones
    userController.sendNotificacion(destinatario[0].id_usuario,id_solicitud, contenido, 2 )
  
    res.render("solicita-prestamo", {exito: "Solicitud enviada correctamente!, espere respuesta del prestamista correspondiente" });
    
  } catch (error) {
    res.render("solicita-prestamo", { error: error.message });
    
  }
};


// exportando las funciones aqui
export default {
  solicitarPrestamo,
  addSolicitud,
  obtenerFecha,
};
