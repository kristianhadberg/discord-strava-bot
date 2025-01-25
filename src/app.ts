import express from "express";
import { Request, Response } from "express";
import dbConnect from "./startup/dbConnect";
import bodyParser from "body-parser";

dbConnect()

const app = express();
app.use(bodyParser.json());

// ENDPOINTS
app.get("/", (req: Request, res: Response) => {
  res.send({ message: "discord-strava-bot online" });
});

export default app;