import { ButtonInteraction } from "discord.js";
import { config } from "../config";

export async function handleButtonInteraction(interaction: ButtonInteraction) {
    if (!interaction.isButton()) return;

    if (interaction.customId === "authstrava_button") {
        const discordId = interaction.user.id;
        const state = encodeURIComponent(discordId);

        const stravaAuthLink = `https://www.strava.com/oauth/authorize?client_id=${config.STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${config.APP_URL}/exchange_token&approval_prompt=force&scope=activity:read_all,activity:write&state=${state}`;

        // Send the link as a private message to the user
        await interaction.reply({
            content: `Click [here](${stravaAuthLink}) to connect your Strava account.`,
            ephemeral: true, // Only visible to the user who clicked the button
        });
    }
}
