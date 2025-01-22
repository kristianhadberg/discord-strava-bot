import {config} from "./config"
import discordClient from "./discordClient";
import expressApp from "./app";
import { createStravaRouter } from "./routes/stravaRouter";
//import stravaRouter from "./routes/stravaRouter";


// Start Discord client
discordClient.login(config.TOKEN);

discordClient.once('ready', () => {
    console.log('wasup')
    //startServer()

    const stravaRouter = createStravaRouter();
    const PORT = 8080;
    expressApp.use("/", stravaRouter);
    expressApp.listen(PORT, () => console.log(`Listening on port:`, PORT));
})


// Start Express API
const startServer = () => {

}

