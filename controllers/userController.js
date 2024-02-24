// importar BD conection

// controllers
const userHome = (req, res) => {
    res.render('user-home', { titulo: "LoanLink-home" });
}
const userRegisterform = (req, res) => {
    res.render('user-hom', {titulo: "LoanLink-home"})
}
const userLoginForm = (req, res) => {
    res.render('user-login', {titulo: "LoanLink-login"})
}

export default {
    userHome,
    userLoginForm,
    userRegisterform,
}