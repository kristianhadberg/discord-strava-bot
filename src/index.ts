import {config} from "./config.ts"
import discordClient from "./discordClient.ts";
import expressApp from "./app.ts";

// Start Discord client
discordClient.login(config.TOKEN);

// Start Express API
const PORT = 8080;
expressApp.listen(PORT, () => console.log(`Listening on port:`, PORT));
