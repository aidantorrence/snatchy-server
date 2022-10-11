import express from "express";
import router from "./src/routes";
import fileUpload from "express-fileupload";

import bodyParser from "body-parser";
const cors = require("cors");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());

// Routes
app.use(router);

app.listen(process.env.PORT || 8080, () => {
  console.log(
    `instaheat-server listening at http://localhost:${process.env.PORT || 8080}`
  );
});
