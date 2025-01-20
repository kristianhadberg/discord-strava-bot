
import { Request, Response, Router } from "express";
import axios from "axios";
import { AxiosResponse, AxiosError } from "axios";
import { generateActivityMessage, createOrUpdateUser, subscribeToStravaHook, reAuthorize, setTempAccessToken, getTempAccessToken, setTempRefreshToken, getTempRefreshToken, processActivity } from "../services/stravaService.ts";
import { IExchangeResponse } from "../types/ExchangeResponse.js";
import client from "../discordClient.ts";
import { config } from "../../config.ts";
import ProcessedActivity from "../types/ProcessedActivity.ts";

const stravaRouter = Router();
subscribeToStravaHook()

/**
 * The endpoint called when attempting to authorize user to the application
 **/ 
stravaRouter.get("/exchange_token", async (req: Request, res: Response) => {

    const tempCode = req.query.code;
    const tokenUrl = "https://www.strava.com/oauth/token?";
    const tokenResponse = await axios.post(
      tokenUrl,
      {
        client_id: config.STRAVA_CLIENT_ID,
        client_secret: config.STRAVA_CLIENT_SECRET,
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

    const exchangeResponse: IExchangeResponse = {
            expires_at: tokenResponse.data.expires_at,
            expires_in: tokenResponse.data.expires_in,
            refresh_token: tokenResponse.data.refresh_token,
            access_token: tokenResponse.data.access_token,
            athlete: {
                id: tokenResponse.data.athlete.id,
                username: tokenResponse.data.athlete.username,
                firstname: tokenResponse.data.athlete.firstname,
                lastname: tokenResponse.data.athlete.lastname,
            },
    }

    createOrUpdateUser(exchangeResponse);
    res.send("Authorized");
  });
  
  stravaRouter.get("/respond_strava", (req: Request, res: Response) => {
    const hubChallenge = req.query["hub.challenge"];
    axios
      .get(
        `${config.APP_URL}?hub.verify_token=${config.STRAVA_VERIFY_TOKEN}&hub.challenge=${hubChallenge}&hub.mode=subscribe`
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
  
  stravaRouter.post("/respond_strava", async (req: Request, res: Response) => {
    const activityId = req.body["object_id"];
    const stravaId = req.body["owner_id"]
  
    try {
        // Check if activity with given ID has already been processed.
        const existingActivity = await ProcessedActivity.findOne( {activityId: activityId})
        if (existingActivity) {
            console.log(`Activity ${activityId} has already been processed. Skipping.`);
            return res.status(200).send('Activity already processed.');
        }

      const authToken = await reAuthorize(stravaId);
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

          await processActivity(activityId);
      }
    } catch (err) {
      console.error(err);
    }
  });



export default stravaRouter;