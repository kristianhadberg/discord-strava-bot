import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("authstrava")
        .setDescription("Sends authorization link, to give application access to Strava."),
    async execute(interaction: CommandInteraction) {
        const authButton = new ButtonBuilder()
            .setLabel("Connect")
            .setCustomId("authstrava_button")
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(authButton);

        await interaction.reply({
            content: "Please click to connect to Strava.",
            components: [row],
        });
    },
};
