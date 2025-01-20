import express from "express";
import { Request, Response } from "express";
import dbConnect from "./startup/dbConnect.ts";
import stravaRouter from "../src/routes/stravaRouter.ts";
import bodyParser from "body-parser";

dbConnect()

const app = express();
app.use(bodyParser.json());
app.use("/", stravaRouter)

// ENDPOINTS

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "tmp" });
});

export default app;