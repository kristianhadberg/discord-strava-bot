import { IExchangeResponse } from "../types/ExchangeResponse";
import User from "../types/User";
import { config } from "../config";
import axios from "axios";

/**
 * Subscribe to stravas webhook services.
 **/
export async function subscribeToStravaHook() {
    const hookSubscriptionUrl = "https://www.strava.com/api/v3/push_subscriptions?";

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
        console.error("Subscription already exists");
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

export async function createOrUpdateUser(discordId: string, exchangeResponse: IExchangeResponse) {
    const existingUser = await User.findOne({ stravaId: exchangeResponse.athlete.id });

    if (existingUser) {
        // Update existing user
        existingUser.accessToken = exchangeResponse.access_token;
        existingUser.refreshToken = exchangeResponse.refresh_token;
        existingUser.accessTokenExpiresAt = exchangeResponse.expires_at;
        existingUser.discordId = discordId;
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
            discordId: discordId,
        });
        await newUser.save();
    }
}

async function updateUserTokens(
    stravaUserId: String,
    accessToken: String,
    refreshToken: String,
    expiresAt: number
) {
    try {
        // Find and update the user by stravaUserId
        const updatedUser = await User.findOneAndUpdate(
            { stravaId: stravaUserId },
            {
                accessToken,
                refreshToken,
                expiresAt,
            }
        );

        if (!updatedUser) {
            throw new Error(`User with id ${stravaUserId} not found`);
        }

        console.log(`Successfully updated user tokens: ${updatedUser}`);
        return updatedUser;
    } catch (error) {
        console.error("Error updating user tokens:", error);
        throw error;
    }
}

export async function getUser(stravaUserId: String) {
    const user = await User.findOne({ stravaId: stravaUserId });

    if (!user) {
        throw new Error(`User with ID: ${stravaUserId} not found.`);
    }

    return user;
}
