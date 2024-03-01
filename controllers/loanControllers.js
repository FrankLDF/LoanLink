// exportar conexion a la BD

const newPublication = (req, res) => {
    res.render('new-publication', {titulo: "new-publication"} )
}

export default {
    newPublication
}