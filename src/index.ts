import { config } from "./config";
import discordClient from "./discordClient";
import expressApp from "./app";
import { createStravaRouter } from "./routes/stravaRouter";

// Start Discord client
discordClient.login(config.TOKEN);
discordClient.once("ready", () => {
    startServer();
});

// Start Express API
const startServer = () => {
    const stravaRouter = createStravaRouter();
    const PORT = 8080;
    expressApp.use("/", stravaRouter);
    expressApp.listen(PORT, () => console.log(`Listening on port:`, PORT));
};
