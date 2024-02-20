const { SlashCommandBuilder } = require("discord.js");
const { stravaClientId, appUrl } = require("../../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("authstrava")
    .setDescription(
      "Sends authorization link, to give application access to Strava."
    ),
  async execute(interaction) {
    const auth_link = "https://www.strava.com/oauth/token";
    const stravaAuthLink = `https://www.strava.com/oauth/authorize?client_id=${stravaClientId}&response_type=code&redirect_uri=${appUrl}/exchange_token&approval_prompt=force&scope=activity:read_all,activity:write`;

    await interaction.reply(`Please click: ${stravaAuthLink}`);
  },
};
