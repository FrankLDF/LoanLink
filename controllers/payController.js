import { query } from "../model/db-conection.js";


const aceptaSolicitud = (req, res) => { 
    const idNotificacion = req.params.idN
    const CLIENT =
      "AX3_84srcfam64NkthR-XfJpcAbAxsaSl0Evgp9v1VVXqUAEj4iVKuh6mZM5I4GZl9O9YcZQL8idO_GG";
    const SECRET =
      "ECvyuk20kjDYNLXOU0CftWyzNONNGxbuNOVWOCm14XlxuEmBynX-SiKw9BOkuadT1NrxT__rdYfOEHh5";
    const PAYPAL_API = "https://api-m.sandbox.paypal.com"; // Live https://api-m.paypal.com

    const auth = { user: CLIENT, pass: SECRET };
    
}



export default {
    aceptaSolicitud
}