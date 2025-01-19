const { SlashCommandBuilder } = require("discord.js");
import { CommandInteraction } from "discord.js";


module.exports = {
  data: new SlashCommandBuilder()
    .setName("hello")
    .setDescription("Replies with Hello {username}!"),
  async execute(interaction: CommandInteraction) {
    await interaction.reply(`Hello ${interaction.user.username}!`);
  },
};
