import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { config } from "../../config.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("authstrava")
    .setDescription(
      "Sends authorization link, to give application access to Strava."
    ),
  async execute(interaction: CommandInteraction) {
    const auth_link = "https://www.strava.com/oauth/token";
    const stravaAuthLink = `https://www.strava.com/oauth/authorize?client_id=${config.STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${config.APP_URL}/exchange_token&approval_prompt=force&scope=activity:read_all,activity:write&state=1234`;

    const authButton = new ButtonBuilder()
      .setLabel("Connect")
      .setURL(stravaAuthLink)
      .setStyle(ButtonStyle.Link);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(authButton);

    await interaction.reply({
      content: "Please click to connect to Strava.",
      components: [row],
    });
  },
};
