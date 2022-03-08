import express from "express";
import router from "./src/routes";

import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const port = 8080;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use(router);

app.listen(process.env.port || port, () => {
	console.log(`anki-server listening at http://localhost:${process.env.port || port}`);
});
