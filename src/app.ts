const express = require("express");
import { Request, Response } from "express";
const stravaRouter = require("../src/routes/stravaRouter")
var bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use("/", stravaRouter)

// ENDPOINTS

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "tmp" });
});


module.exports = app;
