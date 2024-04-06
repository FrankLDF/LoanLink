import { conection, query } from "../model/db-conection.js";
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
    const contenido = `${req.user[0].nombre} ${req.user[0].apellido} ha solicitado un prestamo de: $${monto_solicitado}`;

    await query("START TRANSACTION");
    const result = await query(
      `INSERT INTO solicitud_prestamos (id_usuario, id_tipo_prestamo, id_publicacion, monto_solicitado, plazo_deseado, motivo_prestamo, empleo_actual, contacto_empleador, cargo_posicion, ingresos_mensuales, nombre_referencia, contacto_referencia, fecha_solicitud, estado_solicitud) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
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

    const id_solicitud = result.insertId;
    console.log(`El ID de la solicitus es: ${id_solicitud}`)

    // generar una notificacion de la nueva solicitud
    const destinatario = await query(
      `SELECT usuarios.id_usuario FROM usuarios JOIN publicacion_prestamos ON usuarios.id_usuario = publicacion_prestamos.id_usuario WHERE publicacion_prestamos.id_publicacion_prestamo = ${id_publicacion}`
    );


    // llamando la función que agrega las notificaciones
    await userController.sendNotificacion(
      destinatario[0].id_usuario,
      id_solicitud,
      contenido,
      2,
    );

    await query("COMMIT");

    res.render("solicita-prestamo", {
      exito:
        "Solicitud enviada correctamente!, espere respuesta del prestamista correspondiente",
    });
  } catch (error) {
    await query("ROLLBACK");
    res.render("solicita-prestamo", { error: error.message });
  }
};

const prestamosClientes = async (req, res) => {
  const prestamista = req.user[0];
  const prestamosActivos = await query(
    `SELECT prestamos.*, usuarios.nombre, usuarios.apellido FROM prestamos INNER JOIN usuarios ON prestamos.id_prestamista = usuarios.id_usuario WHERE prestamos.id_cliente = ${prestamista.id_usuario} AND prestamos.estado = 1 `
  );
  res.render('prestamos-clientes', {titulo: "Prestamos Activos", prestamosActivos})
}

const cInfoPrestamo = async (req, res) => {
  const idPrestamo = req.params.idPr;

  const dataPrestamo = await query(
    `SELECT prestamos.*, usuarios.* FROM prestamos INNER JOIN usuarios ON usuarios.id_usuario = prestamos.id_prestamista WHERE id_prestamo = ${idPrestamo}`
  );
  res.render('c-info-prestamo', {titulo:"Detalles prestamo", dataPrestamo})
}


// exportando las funciones aqui
export default {
  solicitarPrestamo,
  addSolicitud,
  obtenerFecha,
  prestamosClientes,
  cInfoPrestamo,
};
