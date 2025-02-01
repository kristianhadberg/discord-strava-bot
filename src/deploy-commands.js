import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";

const clientId = process.env.clientId;
const guildId = process.env.guildId;
const token = process.env.token;

// Initialize an empty array for commands
const commands = [];

// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, "src", "commands");
const commandFolders = fs.readdirSync(foldersPath);

// Loop through all the folders
for (const folder of commandFolders) {
    // Grab all the command files from each folder
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));

    // Process each command file
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = await import(filePath); // Dynamically import each command
        if ("data" in command && "execute" in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(
                `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
            );
        }
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// Deploy commands to the guild
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
            body: commands,
        });

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        // Log any errors
        console.error(error);
    }
})();
