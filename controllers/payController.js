import axios from "axios";
import { query } from "../model/db-conection.js";

import clientControllers from "./clientControllers.js";
import userController from "./userController.js";


const PAYPAL_API = "https://api-m.sandbox.paypal.com"; // Live https://api-m.paypal.com

const aceptaSolicitud = async (req, res) => {
  const idNotificacion = req.params.idN;
  const clientUser = await query(
    `
    SELECT usuarios.* 
    FROM usuarios 
    INNER JOIN solicitud_prestamos ON usuarios.id_usuario = solicitud_prestamos.id_usuario
    INNER JOIN notificaciones ON solicitud_prestamos.id_solicitud_prestamo = notificaciones.id_solicitud
    WHERE notificaciones.id_notificacion = ?`,
    [idNotificacion]
  );
  const solicitudInfo = await query(`
      SELECT solicitud_prestamos.*
      FROM solicitud_prestamos
      JOIN notificaciones ON solicitud_prestamos.id_solicitud_prestamo = notificaciones.id_solicitud
      WHERE notificaciones.id_notificacion= ${idNotificacion}
    `);

  const CLIENT = clientUser[0].client_id;
  const SECRET = clientUser[0].client_secret;
  const cantidad = solicitudInfo[0].monto_solicitado / 58.92;
  const MONTO = cantidad.toFixed(2);


  const order = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: MONTO,
        },
      },
    ],
    application_context: {
      brand_name: `Loan Link`,
      landing_page: "NO_PREFERENCE", // Default, para mas informacion https://developer.paypal.com/docs/api/orders/v2/#definition-order_application_context
      user_action: "PAY_NOW", // Accion para que en paypal muestre el monto del pago
      return_url: `http://localhost:3000/capture-order/${idNotificacion}`, // Url despues de realizar el pago
      cancel_url: `http://localhost:3000/cancel-order`, // Url despues de realizar el pago
    },
  };
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');

  const { data: {access_token} } = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, params, {
    auth: {
      username: CLIENT,
      password: SECRET
    }
  })

  const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders`, order, {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  })
  
  res.redirect(`${response.data.links[1].href}`);

};

const captureOrder = async (req, res) => {
  const idNotificacion = req.params.idN;
   const clientUser = await query(
     `
    SELECT usuarios.* 
    FROM usuarios 
    INNER JOIN solicitud_prestamos ON usuarios.id_usuario = solicitud_prestamos.id_usuario
    INNER JOIN notificaciones ON solicitud_prestamos.id_solicitud_prestamo = notificaciones.id_solicitud
    WHERE notificaciones.id_notificacion = ?`,
     [idNotificacion]
  );

  const notificacionPrestamista = await query(`SELECT * FROM notificaciones WHERE id_notificacion = ${idNotificacion}`);

  const solicitudPrestamo = await query(`SELECT * FROM solicitud_prestamos WHERE id_solicitud_prestamo = ${notificacionPrestamista[0].id_solicitud}`);

  const publicacionPrestamo = await query(`SELECT * FROM publicacion_prestamos WHERE id_publicacion_prestamo = ${solicitudPrestamo[0].id_publicacion} `)



  const CLIENT = clientUser[0].client_id;
  const SECRET = clientUser[0].client_secret;
  const { token } = req.query
  const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders/${token}/capture`, {}, {
    auth: {
      username: CLIENT,
      password: SECRET
    }
  })

  // captura de variables para insertar en la tabla prestamos
  const id_prestamista = notificacionPrestamista[0].id_destinatario,
    id_cliente = clientUser[0].id_usuario,
    fecha_aprovacion = clientControllers.obtenerFecha(),
    fecha_proximo_pago = new Date(fecha_aprovacion),
    monto_solicitado = solicitudPrestamo[0].monto_solicitado,
    tasa_interesData = publicacionPrestamo[0].tasa_interes,
    tasa_interes = publicacionPrestamo[0].tasa_interes / 100,
    cantidad_cuotas = solicitudPrestamo[0].plazo_deseado,
    tasa_interes_mensual = tasa_interes / 12,
    cantidad_pago_mensual = (tasa_interes_mensual * monto_solicitado) / (1 - Math.pow(1 + tasa_interes_mensual, -cantidad_cuotas)),
    monto_pagar = cantidad_pago_mensual * cantidad_cuotas,
    cuotas_pendientes = cantidad_cuotas,
    estado = 1;
  
  fecha_proximo_pago.setMonth(fecha_proximo_pago.getMonth() + 1);

  // agregando el prestamo a la BD
  await query(
    `INSERT INTO prestamos (id_prestamista, id_cliente, fecha_aprovacion, fecha_proximo_pago, monto_solicitado, tasa_interes, cantidad_pago_mensual, monto_pagar, cantidad_cuotas, cuotas_pendiente, estado) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [id_prestamista, id_cliente, fecha_aprovacion, fecha_proximo_pago, monto_solicitado, tasa_interesData, cantidad_pago_mensual, monto_pagar, cantidad_cuotas, cuotas_pendientes, estado]
  );

  const prestamistaData = await query(  `SELECT * FROM usuarios WHERE id_usuario = ${id_prestamista}`)

  const contenidoNotificacion = `${prestamistaData[0].nombre} ha aceptado tu solicitud de prestamo de RD$${monto_solicitado}.00`,
    tipoNotificacion = 1;
  
  // enviando notificacion al cliente
  userController.sendNotificacion(id_cliente, null, contenidoNotificacion, tipoNotificacion);

  // actualizando el estado de la solicitud
  const id_solicitud = solicitudPrestamo[0].id_solicitud,
    fecha_respuesta = clientControllers.obtenerFecha(),
    estado_solicitud = 2;
  await query(
    `UPDATE solicitud_prestamos SET fecha_respuesta = ? , estado_solicitud = ? WHERE id_solicitud_prestamo = ?`,
    [fecha_respuesta, estado_solicitud, id_solicitud]
  );

  // actualizando el estado de la notificacion
  const id = idNotificacion,
    nuevoEstado = 2;
  await query(
    `UPDATE notificaciones SET estado_notificacion = ? WHERE id_notificacion = ?`,
    [nuevoEstado, id]
  );

  res.redirect("/notificaciones");

  // console.log(response.data)
}
const cancelOrder = (req, res) => {
  res.redirect('/notificaciones')
}

export default {
  aceptaSolicitud,
  captureOrder,
  cancelOrder,
};
