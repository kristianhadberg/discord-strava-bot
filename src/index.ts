const discordClient = require("./discordClient");
const expressApp = require("./app");

const { token } = require("../config.json");

// Start Discord client
discordClient.login(token);

// Start Express API
const PORT = 8080;
expressApp.listen(PORT, () => console.log(`Listening on port:`, PORT));
