// importar BD conection

// controllers
const home = (req, res) => {
    res.render('home', { titulo: "LoanLink" });
}
const userRegisterform = (req, res) => {
    res.render('user-register', {titulo: "LoanLink-register"})
}
const userLoginForm = (req, res) => {
    res.render('user-login', {titulo: "LoanLink-login"})
}

const userHome = (req, res) => {
  res.render("user-home", { titulo: "LoanLink-home", tipoUsuario: "prestamista" });
};

export default {
    home,
    userLoginForm,
    userRegisterform,
    userHome,
}