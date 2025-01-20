import { IExchangeResponse } from "../types/ExchangeResponse.ts";
import { IStravaActivity } from "../types/StravaActivity.ts";
import User from "../types/User.ts";
import { config } from "../../config.ts";

import axios from "axios";
import { EmbedBuilder } from "discord.js";

// TODO: Change this
let tempRefreshToken = "";
let tempAccessToken = "";

export async function subscribeToStravaHook() {
    const hookSubscriptionUrl =
      "https://www.strava.com/api/v3/push_subscriptions?";
    const response = await axios.post(
      hookSubscriptionUrl,
      {
        client_id: config.STRAVA_CLIENT_ID,
        client_secret: config.STRAVA_CLIENT_SECRET,
        callback_url: `${config.APP_URL}/respond_strava`, // TODO
        verify_token: config.STRAVA_VERIFY_TOKEN,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
  }
  
export async function reAuthorize() {
    const auth_link = "https://www.strava.com/oauth/token";
    const response = await axios.post(
      auth_link,
      {
        client_id: config.STRAVA_CLIENT_ID,
        client_secret: config.STRAVA_CLIENT_SECRET,
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

export async function createOrUpdateUser(exchangeResponse: IExchangeResponse) {
    const existingUser = await User.findOne({ stravaId: exchangeResponse.athlete.id});

    if (existingUser) {
        // Update existing user
        existingUser.accessToken = exchangeResponse.access_token;
        existingUser.refreshToken = exchangeResponse.refresh_token;
        existingUser.accessTokenExpiresAt = exchangeResponse.expires_at;
        await existingUser.save();
      } else {
        const newUser = new User({
            stravaId: exchangeResponse.athlete.id, 
            username: exchangeResponse.athlete.username,
            firstname: exchangeResponse.athlete.firstname,
            lastname: exchangeResponse.athlete.lastname,
            accessToken: exchangeResponse.access_token,
            refreshToken: exchangeResponse.refresh_token,
            accessTokenExpiresAt: exchangeResponse.expires_at,
          });
          await newUser.save();
      }
  }

  function formatElapsedTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function calculatePacePerKm(distanceMeters: number, elapsedSeconds: number): string {
    const distanceKm = distanceMeters / 1000; // Convert meters to kilometers
    const paceSeconds = distanceKm > 0 ? elapsedSeconds / distanceKm : 0; // Avoid division by zero
    const mins = Math.floor(paceSeconds / 60);
    const secs = Math.round(paceSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`; // Format as mm:ss
  }

export function generateActivityMessage(data: IStravaActivity) {
    const activityMessage = {
      name: data.name,
      type: data.type,
      distance: data.distance.toString(),
      elapsed_time: data.elapsed_time.toString(),
      average_speed: data.average_speed.toString(),
    };

    const distanceKm = (data.distance / 1000).toFixed(2); // Convert meters to kilometers, round to 2 decimals
    const elapsedTimeFormatted = formatElapsedTime(data.elapsed_time); // Convert seconds to hh:mm:ss
    const pacePerKm = calculatePacePerKm(data.distance, data.elapsed_time); // Calculate pace per km  

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
        value: `${distanceKm} km` || " ",
        inline: true,
      })
      .addFields({
        name: "Time",
        value: elapsedTimeFormatted || " ",
        inline: true,
      })
      .addFields({
        name: "Pace",
        value: `${pacePerKm}/km` || " ",
        inline: true,
      });
  
    return embeddedMessage;
  }

/* 
  Remove this once access tokens are setup properly per user
*/
export let setTempAccessToken = (value: string) => {
tempAccessToken = value;
};
export let getTempAccessToken = () => tempAccessToken;
export let setTempRefreshToken = (value: string) => {
tempRefreshToken = value;
};
export let getTempRefreshToken = () => tempRefreshToken;