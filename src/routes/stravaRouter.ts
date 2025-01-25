
import { Request, Response, Router } from "express";
import axios from "axios";
import { AxiosResponse, AxiosError } from "axios";
import { generateActivityMessage, createOrUpdateUser, subscribeToStravaHook, reAuthorize, processActivity, getUser } from "../services/stravaService";
import { IExchangeResponse } from "../types/ExchangeResponse";
import client from "../discordClient";
import { config } from "../config";
import ProcessedActivity from "../types/ProcessedActivity";

export function createStravaRouter() {
    const stravaRouter = Router();
    subscribeToStravaHook();


/**
 * The endpoint called when attempting to authorize user to the application
 **/ 
stravaRouter.get("/exchange_token", async (req: Request, res: Response) => {
    const state = req.query.state;

    if (!state) {
        res.status(400).send("Missing state");
        return
    }

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

    const discordId = decodeURIComponent(state.toString());

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

    createOrUpdateUser(discordId, exchangeResponse);
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
  
  /**
   * The endpoint strava will respond to when an activity is created
   * Sends a message in the specified discord channel.
   **/ 
  stravaRouter.post("/respond_strava", async (req: Request, res: Response) => {
    const activityId = req.body["object_id"];
    const stravaId = req.body["owner_id"]
  
    try {
        // Check if activity with given ID has already been processed.
        const existingActivity = await ProcessedActivity.findOne( {activityId: activityId})
        if (existingActivity) {
            console.log(`Activity ${activityId} has already been processed. Skipping.`);
            res.status(200).send('Activity already processed.');
        } else {
            const authToken = await reAuthorize(stravaId);
            if (req.body["aspect_type"] == "create") {
              const user = await getUser(stravaId);
              axios
                .get(
                  `https://www.strava.com/api/v3/activities/${activityId}?access_token=${authToken}`
                )
                .then((response: AxiosResponse) => {
                    const channelToSendMessageIn = client.channels.cache.get(config.DISCORD_CHANNEL_ID);
                    
                    if (response.data.type !== 'Run') {
                        console.log(`Recieved activity with another type than 'Run'`);
                        res.status(200).send('Only activity type run is accepted.')
                    } else {
                        if (channelToSendMessageIn && channelToSendMessageIn.type === 0) {
                            let messageContent = '';
                            if (user.discordId) {
                                messageContent = `<@${user.discordId}> just finished an activity!`;
                            } else {
                                messageContent = `${user.firstname} ${user.lastname} just finished an activity!`
                            }

                            const { embeds, components } = generateActivityMessage(response.data)
                            channelToSendMessageIn.send({
                                content: messageContent,
                                embeds: embeds,
                                components: components,
                            });
                        }
                    }
                }); 

                await processActivity(activityId);
            }
        }
    } catch (err) {
      console.error(err);
    }
  });

  /**
   * Redirect the user when they click an activity message in Discord.
   * Automatically redirects based on the users device (opens Strava app if on mobile)
   **/ 
  stravaRouter.get("/redirect", (req: Request, res: Response) => {
    const activityId = req.query.activity;

    if (!activityId) {
        res.status(400).send("Missing activity ID");
    } else {
        const userAgent = req.headers["user-agent"];
        const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent || "");

        if (isMobile) {
            res.redirect(`strava://activities/${activityId}`);
        } else {
            res.redirect(`https://www.strava.com/activities/${activityId}`)
        }
    }
  });

  return stravaRouter;
}