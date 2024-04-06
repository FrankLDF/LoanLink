import axios from "axios";
import { query } from "../model/db-conection.js";

import clientControllers from "./clientControllers.js";
import userController from "./userController.js";

const PAYPAL_API = "https://api-m.sandbox.paypal.com"; // Live https://api-m.paypal.com

const pagoPrestamo = async (req, res) => {
    const idPrestamo = req.params.idP;
    const DATOS = await query(`
    SELECT prestamos.*, usuarios.*
    FROM prestamos
    INNER JOIN usuarios 
    ON usuarios.id_usuario = prestamos.id_prestamista
    WHERE prestamos.id_prestamo = ${idPrestamo}
    `);
    const CLIENT = DATOS[0].client_id,
        SECRET = DATOS[0].client_secret,
        RDmonto = DATOS[0].cantidad_pago_mensual / 58.92,
        USDmonto = RDmonto.toFixed(2);
    
    const order = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: USDmonto,
          },
        },
      ],
      application_context: {
        brand_name: `Loan Link`,
        landing_page: "NO_PREFERENCE", // Default, para mas informacion https://developer.paypal.com/docs/api/orders/v2/#definition-order_application_context
        user_action: "PAY_NOW", // Accion para que en paypal muestre el monto del pago
        return_url: `http://localhost:3000/capture-pago/${idPrestamo}`, // Url despues de realizar el pago
        cancel_url: `http://localhost:3000/cancel-pago/${idPrestamo}`, // Url despues de realizar el pago
      },
    };
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");

    const {
      data: { access_token },
    } = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, params, {
      auth: {
        username: CLIENT,
        password: SECRET,
      },
    });

    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      order,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    res.redirect(`${response.data.links[1].href}`);
    
 };
const capturePago = async (req, res) => {
    const idPrestamo = req.params.idP;
    const DATOS = await query(`
    SELECT prestamos.*, usuarios.*
    FROM prestamos
    INNER JOIN usuarios 
    ON usuarios.id_usuario = prestamos.id_prestamista
    WHERE prestamos.id_prestamo = ${idPrestamo}
    `);
    const nombreCliente = await query(`
    SELECT usuarios.nombre, usuarios.apellido
    FROM prestamos
    INNER JOIN usuarios
    ON usuarios.id_usuario = prestamos.id_cliente
    WHERE prestamos.id_prestamo = ${idPrestamo}
     `);
    const CLIENT = DATOS[0].client_id;
    const SECRET = DATOS[0].client_secret;
    const { token } = req.query;
    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders/${token}/capture`,
      {},
      {
        auth: {
          username: CLIENT,
          password: SECRET,
        },
      }
    );

    const fechaUltimoPago = clientControllers.obtenerFecha(),
        fechaProximoPago = new Date(DATOS[0].fecha_proximo_pago),
        pagosPendientes = DATOS[0].cuotas_pendiente - 1;
    fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1);

    userController.sendNotificacion(
      DATOS[0].id_prestamista,
      null,
      `El cliente ${nombreCliente[0].nombre} ${nombreCliente[0].apellido} ha realizado un pago de: $RD${DATOS[0].cantidad_pago_mensual} pesos`,
      1
    );
    userController.sendNotificacion(DATOS[0].id_cliente, null, `Has realizado un pago de $RD${DATOS[0].cantidad_pago_mensual} pesos al prestamista ${DATOS[0].nombre} ${DATOS[0].apellido} `,1);
    if (pagosPendientes === 0) {
        const newEstado = 2,
            fechaSaldo = clientControllers.obtenerFecha();
        await query(
          `UPDATE prestamos SET fecha_ultimo_pago = ?, fecha_proximo_pago = ?, cuotas_pendiente = ?, fecha_saldo = ?, estado = ? WHERE id_prestamo = ?`,
          [fechaUltimoPago, fechaProximoPago, pagosPendientes, fechaSaldo, newEstado, idPrestamo]
        );

        res.redirect(`/prestamos-activos`);


    } else {
        
        await query(`UPDATE prestamos SET fecha_ultimo_pago = ?, fecha_proximo_pago = ?, cuotas_pendiente = ? WHERE id_prestamo = ?`, [fechaUltimoPago, fechaProximoPago, pagosPendientes, idPrestamo]);
    
        res.redirect(`/detalles-prestamo/${idPrestamo}`);
    }

 };


const cancelPago = async (req, res) => {
    const idPrestamo = req.params.idP;
    res.redirect(`/detalles-prestamo/${idPrestamo}`);
 };

export default {
    pagoPrestamo,
    capturePago,
    cancelPago
}