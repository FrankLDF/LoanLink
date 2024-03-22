// exportar conexion a la BD
import { conection, query } from "../model/db-conection.js";
import passport from "passport";

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

const loanClients = (req, res) => {
  let dataExample = [];
  res.render("loan-clients", {
    titulo: "prestamos-activos",
    nombre: "Ernesto Celestino Hernandez",
    pagosPendientes: "5",
    estado: "Activo",
  });
};

export default {
  newPublication,
  addPublication,
  loanClients,
};
