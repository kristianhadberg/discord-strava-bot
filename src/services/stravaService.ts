import { IExchangeResponse } from "../types/ExchangeResponse";
import { IStravaActivity } from "../types/StravaActivity";
import User from "../types/User";
import { config } from "../config";

import axios from "axios";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Component, EmbedBuilder } from "discord.js";
import ProcessedActivity from "../types/ProcessedActivity";

/**
 * Subscribe to stravas webhook services.
 **/ 
export async function subscribeToStravaHook() {
    const hookSubscriptionUrl =
      "https://www.strava.com/api/v3/push_subscriptions?";

      try {
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
      } catch (error) {
        console.error('Subscription already exists');
      }

  }

/**
 * Returns the access token for the user.
 * Uses refresh token to retrieve a new access token in case it is expired.
 * Saves the new access/refresh token & expiration time in the db.
 **/ 
export async function reAuthorize(stravaId: String) {
    const auth_link = "https://www.strava.com/oauth/token";

    const user = await getUser(stravaId);

    if (Date.now() / 1000 < user.accessTokenExpiresAt) {
        // Token is still valid
        return user.accessToken;
    }

    // Token has expired, refresh access token
    const response = await axios.post(
      auth_link,
      {
        client_id: config.STRAVA_CLIENT_ID,
        client_secret: config.STRAVA_CLIENT_SECRET,
        refresh_token: user.refreshToken,
        grant_type: "refresh_token",
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const accessToken = response.data.access_token;
    const refreshToken = response.data.refresh_token;
    const expiresAt = response.data.expires_at;
    await updateUserTokens(user.stravaId, accessToken, refreshToken, expiresAt);

    return accessToken;
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

async function updateUserTokens(stravaUserId: String, accessToken: String, refreshToken: String, expiresAt: number) {
    try {
        // Find and update the user by stravaUserId
        const updatedUser = await User.findOneAndUpdate(
          {stravaId: stravaUserId},
          {
            accessToken,
            refreshToken,
            expiresAt
          }
        );
    
        if (!updatedUser) {
          throw new Error(`User with id ${stravaUserId} not found`);
        }
    
        console.log(`Successfully updated user tokens: ${updatedUser}`);
        return updatedUser;
      } catch (error) {
        console.error('Error updating user tokens:', error);
        throw error;
      }
  }

  /**
    * Saves the activityId in the database,
    * to avoid handling the same activity multiple times
    **/ 
  export async function processActivity(activityId: String) {
        const newActivity = new ProcessedActivity({
            activityId: activityId
        })

        console.log('activity saved')
        
        await newActivity.save();
  }

  export async function getUser(stravaUserId: String) {
    const user = await User.findOne({ stravaId: stravaUserId});

    if (!user) {
        throw new Error(`User with ID: ${stravaUserId} not found.`)
    }

    return user;
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


/**
 * Generate a message to be send on Discord
 **/  
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

      const viewInStravaButton = new ButtonBuilder()
        .setLabel("View in Strava")
        .setURL(`${config.APP_URL}/redirect?activity=${data.id}`)
        .setStyle(ButtonStyle.Link);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(viewInStravaButton);
  
    return {
        embeds: [embeddedMessage],
        components: [row]
    };
  }
