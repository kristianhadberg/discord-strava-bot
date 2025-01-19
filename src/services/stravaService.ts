import { IStravaActivity } from "../types/stravaActivity";

const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

// TODO: Change this
let tempRefreshToken = "";
let tempAccessToken = "";

const {
    stravaClientId,
    stravaClientSecret,
    stravaVerifyToken,
    appUrl,
  } = require("../../config.json");

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

 function generateActivityMessage(data: IStravaActivity) {
    const activityMessage = {
      name: data.name,
      type: data.type,
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

  module.exports = {
    subscribeToStravaHook,
    reAuthorize,
    generateActivityMessage,
    tempAccessToken,
    tempRefreshToken,
    setTempAccessToken: (value: string) => {
        tempAccessToken = value;
    },
    getTempAccessToken: () => tempAccessToken,
    setTempRefreshToken: (value: string) => {
        tempRefreshToken = value;
    },
    getTempRefreshToken: () => tempRefreshToken
  }