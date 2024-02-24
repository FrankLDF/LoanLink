// import modules and dependences
import  express  from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { fileURLToPath } from "url";
import path from "path";

import router from "./roters/userRutes.js";

// init variables
const app = express(),
    __dirname = fileURLToPath(new URL(".", import.meta.url));

// para obtener el puerto
app.set("port", process.env.PORT || 3000);

// middlewheres
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// statict route
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//routes
app.use( router)
// server listen
app.listen(app.get("port"), () => {
  console.log(
    `La aplicación está funcionando en http://localhost:${app.get("port")}`
  );
});