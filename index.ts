import express from "express";
import router from "./src/routes";
const multer  = require('multer')

import bodyParser from "body-parser";
const cors = require("cors");

const app = express();

const multiPartDataParser = multer({ limits: { fieldSize: 10000 * 1024 * 1024 } })
app.use(multiPartDataParser.any())

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use(router);

app.listen(process.env.PORT || 8080, () => {
  console.log(
    `typer-server listening at http://localhost:${process.env.PORT || 8080}`
  );
});
