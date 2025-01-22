import fs from "node:fs";
import path from "node:path";
import { ChannelType, Client, Collection, Events, GatewayIntentBits, NewsChannel, TextChannel } from "discord.js";
import { Command } from "./types/Command";

interface ExtendedClient extends Client {
  commands?: Collection<string, Command>;
}

const client: ExtendedClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

// Searching the commands folder and subsequent subfolders for available commands
    (async () => {
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);

        const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file: string) => {
            if (process.env.NODE_ENV === "production") {
            // Only process .js files in production
            return file.endsWith(".js");
            } else {
            // Process .ts files in development
            return file.endsWith(".ts");
            }
        });
    
        for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
    
        try {
            let command;
            if (process.env.NODE_ENV === "production") {
            // Use require for .js files in production
            command = require(filePath).default;
            } else {
            // Use dynamic import for .ts files in development
            command = (await import(`file://${filePath}`)).default;
            }
    
            // Ensure the command has 'data' and 'execute' properties
            if (command && "data" in command && "execute" in command) {
            client.commands?.set(command.data.name, command);
            console.log(`Loaded command: ${command.data.name}`);
            } else {
            console.log(`Command missing required properties: ${filePath}`);
            }
        } catch (error) {
            console.error(`Error loading command from file: ${filePath}`, error);
        }
        }
    }
    })();
      
      

client.once(Events.ClientReady, async (readyClient: any) => {
  console.log("Ready!");
  
  console.log(`Bot is authenticated and ready! Logged in as ${client.user?.tag}`);
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
