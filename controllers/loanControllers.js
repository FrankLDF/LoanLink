// exportar conexion a la BD
import { conection, query } from "../model/db-conection.js";

const newPublication = (req, res) => {
  const dataUser = req.user;
  if (dataUser) {
    res.render("new-publication", { titulo: "new-publication", dataUser });
  } else {
    // Manejo de caso en que no se encuentran los datos del usuario
    res.send("no hay datos");
  }
};

const addPublication = async (req, res, next) => {
  const id_usuario = req.user[0].id_usuario;
  const {
    nombre_prestamista,
    descripcion,
    tasa_interes,
    cant_min,
    cant_max,
    requisitos,
  } = req.body;
  try {
    await query(
      "INSERT INTO publicacion_prestamos (id_usuario, nombre_prestamista, descripcion, tasa_interes, cant_min, cant_max, requisitos) VALUES (?,?,?,?,?,?,?)",
      [
        id_usuario,
        nombre_prestamista,
        descripcion,
        tasa_interes,
        cant_min,
        cant_max,
        requisitos,
      ]
    );
    res.redirect("/user-home");
  } catch (error) {
    console.error(`error al ejecutar las consulta: ${error.message}`);
    next(error);
  }
};

const prestamoInfo = async (req, res) => {
  const idPrestamo = req.params.idPr;
  
  const dataPrestamo = await query(`SELECT prestamos.*, usuarios.* FROM prestamos INNER JOIN usuarios ON usuarios.id_usuario = prestamos.id_cliente WHERE id_prestamo = ${idPrestamo}`);
  
  res.render("prestamo-info", { titulo: "Info-prestamo", dataPrestamo});
};

const detalleNotificacion = async (req, res) => {
  try {
    const idNotificacion = req.params.idN;
    const personalInfo = await query(`
    SELECT usuarios.* 
    FROM usuarios
    JOIN solicitud_prestamos ON usuarios.id_usuario = solicitud_prestamos.id_usuario JOIN notificaciones ON solicitud_prestamos.id_solicitud_prestamo= notificaciones.id_solicitud WHERE notificaciones.id_notificacion= ${idNotificacion}`);
    const solicitudInfo = await query(`
      SELECT solicitud_prestamos.*
      FROM solicitud_prestamos
      JOIN notificaciones ON solicitud_prestamos.id_solicitud_prestamo = notificaciones.id_solicitud
      WHERE notificaciones.id_notificacion= ${idNotificacion}
    `);

    const dataPersonal = personalInfo[0],
      dataSolicitud = solicitudInfo[0];

    res.render("detalle-notificacion", {
      titulo: "solicitud-detalle",
      idNotificacion,
      dataPersonal,
      dataSolicitud,
    });
  } catch (error) {
    console.error(error.message);
  }
};

const loanClients = async (req, res) => {
  const prestamista = req.user[0];
  const prestamosActivos = await query(
    `SELECT prestamos.*, usuarios.nombre, usuarios.apellido FROM prestamos INNER JOIN usuarios ON prestamos.id_cliente = usuarios.id_usuario WHERE prestamos.id_prestamista = ${prestamista.id_usuario} AND prestamos.estado = 1 `
  );
  


  res.render("loan-clients", {
    prestamosActivos
  });
};

export default {
  newPublication,
  addPublication,
  loanClients,
  detalleNotificacion,
  prestamoInfo,
};
