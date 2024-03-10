// import modules and dependences
import  express  from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { fileURLToPath } from "url";
import path from "path";
import session from "express-session";
import cookieParser from "cookie-parser";
import { Strategy as LocalStrategy } from "passport-local";

import router from "./roters/userRutes.js";
import passport from "passport";
import { query } from "./model/db-conection.js";

// init variables
const app = express(),
    __dirname = fileURLToPath(new URL(".", import.meta.url));

// para obtener el puerto
app.set("port", process.env.PORT || 3000);

// middlewheres
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser('mySecret'));
app.use(
  session({
    secret: "mySecret",
    resave: true,
    saveUninitialized: true,
  })
);
passport.use(
  new LocalStrategy({
    usernameField: 'correo_electronico',
    passwordField: 'contrasena'
  },async function (correo_electronico, contrasena, done) {
    try {
      // Buscamos al usuario en la base de datos por su nombre de usuario
      const user = await query(
        "SELECT * FROM usuarios WHERE correo_electronico = ?",
        [correo_electronico]
      );

      // Si el usuario no existe
      if (!user || user.length === 0) {
        return done(null, false, {
          message: "Correo electronico incorrecto",
        });
      }

      // Verifica si la contraseña es correcta usando una función de comparación de contraseñas
      if (user[0].contrasena !== contrasena) {
        return done(null, false, { message: "Contraseña incorrecta" });
      }
      // Si el usuario existe y la contraseña coincide, lo pasamos a done
      return done(null, user[0]);
    } catch (error) {
      // Si hay algún error, lo pasamos a done
      return done(error);
    }
  })
);

passport.serializeUser(function (user, done) {
  done(null, user.id_usuario);
});

passport.deserializeUser(async (id_usuario, done)=> {
  try {
    // Buscamos al usuario en la base de datos por su ID
    const user = await query("SELECT * FROM usuarios WHERE id_usuario = ?", [id_usuario]);
    done(null, user); // Deserializa el usuario recuperando su información de la base de datos
  } catch (error) {
    // Si hay algún error, lo pasamos a done
    done(error);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// statict route
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes
app.use( router)
// server listen
app.listen(app.get("port"), () => {
  console.log(
    `La aplicación está funcionando en http://localhost:${app.get("port")}`
  );
});