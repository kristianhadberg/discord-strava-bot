const express = require("express");
import { Request, Response } from "express";
const axios = require("axios");
import { AxiosResponse, AxiosError } from "axios";
var bodyParser = require("body-parser");
const { EmbedBuilder } = require("discord.js");

const {
  stravaClientId,
  stravaClientSecret,
  stravaVerifyToken,
  appUrl,
} = require("../config.json");
const client = require("./discordClient");

// TODO: Change this
let tempRefreshToken = "";
let tempAccessToken = "";

const app = express();
app.use(bodyParser.json());

// ENDPOINTS

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "tmp" });
});

app.get("/exchange_token", async (req: Request, res: Response) => {

  const tempCode = req.query.code;
  const tokenUrl = "https://www.strava.com/oauth/token?";
  const tokenResponse = await axios.post(
    tokenUrl,
    {
      client_id: stravaClientId,
      client_secret: stravaClientSecret,
      code: tempCode,
      grant_type: "authorization_code",
    },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  tempRefreshToken = tokenResponse.data.refresh_token;
  console.log(tempRefreshToken);
  subscribeToStravaHook();
  reAuthorize(); // temp, use this to get access token

  res.send("Authorized");
});

app.get("/respond_strava", (req: Request, res: Response) => {
  const hubChallenge = req.query["hub.challenge"];
  axios
    .get(
      `${appUrl}?hub.verify_token=${stravaVerifyToken}&hub.challenge=${hubChallenge}&hub.mode=subscribe`
    )
    .then((response: AxiosResponse) => {
      console.log(response.data);
      res.status(200).json({ "hub.challenge": hubChallenge });
    })
    .catch((error: AxiosError) => {
      console.error("Error making GET request:", error);
      res.sendStatus(500); // Send internal server error status
    });
});

app.post("/respond_strava", async (req: Request, res: Response) => {
  const activityId = req.body["object_id"];

  try {
    const authToken = await reAuthorize();
    if (req.body["aspect_type"] == "create") {
      axios
        .get(
          `https://www.strava.com/api/v3/activities/${activityId}?access_token=${authToken}`
        )
        .then((response: AxiosResponse) => {
          console.log(response.data);
          const generalChannel = client.channels.cache.find(
            (channel: { name: string; }) => channel.name === "general"
          );
          if (generalChannel) {
            const message = generateActivityMessage(response.data);
            generalChannel.send({ embeds: [message] });
          }
        });
    }
  } catch (err) {
    console.error(err);
  }
});

async function subscribeToStravaHook() {
  const hookSubscriptionUrl =
    "https://www.strava.com/api/v3/push_subscriptions?";
  const response = await axios.post(
    hookSubscriptionUrl,
    {
      client_id: stravaClientId,
      client_secret: stravaClientSecret,
      callback_url: `${appUrl}/respond_strava`, // TODO
      verify_token: stravaVerifyToken,
    },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
}

async function reAuthorize() {
  const auth_link = "https://www.strava.com/oauth/token";
  const response = await axios.post(
    auth_link,
    {
      client_id: stravaClientId,
      client_secret: stravaClientSecret,
      refresh_token: tempRefreshToken,
      grant_type: "refresh_token",
    },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  tempAccessToken = response.data.access_token;
  console.log(`Access token: `, tempAccessToken);
  return response.data.access_token;
}
// TODO create type for this
function generateActivityMessage(data: any) {
  const activityMessage = {
    name: data.name.toString(),
    type: data.type.toString(),
    distance: data.distance.toString(),
    elapsed_time: data.elapsed_time.toString(),
    average_speed: data.average_speed.toString(),
  };

  const embeddedMessage = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(activityMessage.name)
    .setAuthor({ name: "Hakket Sommer" })
    .addFields({
      name: "Type",
      value: activityMessage.type || " ",
      inline: true,
    })
    .addFields({
      name: "Distance",
      value: activityMessage.distance || " ",
      inline: true,
    })
    .addFields({
      name: "Elapsed Time",
      value: activityMessage.elapsed_time || " ",
      inline: true,
    })
    .addFields({
      name: "Average Speed",
      value: activityMessage.average_speed || " ",
      inline: true,
    });

  return embeddedMessage;
}

module.exports = app;
