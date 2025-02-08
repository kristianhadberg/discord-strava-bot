import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import ProcessedActivity from "../types/ProcessedActivity";
import { IStravaActivity } from "../types/StravaActivity";
import { config } from "../config";

/**
 * Saves the activityId in the database,
 * to avoid handling the same activity multiple times
 **/
export async function processActivity(activityId: String) {
    const newActivity = new ProcessedActivity({
        activityId: activityId,
    });
    console.log("activity saved");

    await newActivity.save();
}

function formatMovingTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
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
        moving_time: data.moving_time.toString(),
        average_speed: data.average_speed.toString(),
    };

    const distanceKm = (data.distance / 1000).toFixed(2); // Convert meters to kilometers, round to 2 decimals
    const movingTimeFormatted = formatMovingTime(data.moving_time); // Convert seconds to hh:mm:ss
    const pacePerKm = calculatePacePerKm(data.distance, data.moving_time); // Calculate pace per km

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
            value: movingTimeFormatted || " ",
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
        components: [row],
    };
}
