import { SlashCommandBuilder } from "discord.js";
import { CommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("hello")
    .setDescription("Replies with Hello {username}!"),
  async execute(interaction: CommandInteraction) {
    await interaction.reply(`Hello ${interaction.user.username}!`);
  },
};
