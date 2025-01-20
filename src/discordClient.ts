import fs from "node:fs";
import path from "node:path";
import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import { Command } from "./types/Command.ts";
import { fileURLToPath } from "url"; // Import fileURLToPath
import { dirname } from "path"; // Import dirname

// Correct the __dirname for ES modules
const __filename = fileURLToPath(import.meta.url); // Convert filename to file URL
const __dirname = dirname(__filename); // Get directory name

interface ExtendedClient extends Client {
  commands?: Collection<string, Command>;
}

const client: ExtendedClient = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

// Searching the commands folder and subsequent subfolders for available commands
for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
  
    console.log(folder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file: string) => file.endsWith(".ts"));
  
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
  
      // Dynamically import the command using top-level await
      const command = (await import(`file://${filePath}`)).default; // Use file:// URL for dynamic import and access the default export
  
      // Ensure the command has 'data' and 'execute' properties
      if (command && "data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(`Command missing required properties: ${filePath}`);
      }
    }
  }

client.once(Events.ClientReady, (readyClient: any) => {
  console.log("Ready!");
});

client.on(Events.InteractionCreate, async (interaction: any) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

export default client;
