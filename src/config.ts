import dotenv from "dotenv";
dotenv.config();

// Export environment variables for easy access
export const config = {
    TOKEN: process.env.TOKEN!,
    CLIENT_ID: process.env.CLIENT_ID!,
    GUILD_ID: process.env.GUILD_ID!,
    STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID!,
    STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET!,
    STRAVA_VERIFY_TOKEN: process.env.STRAVA_VERIFY_TOKEN!,
    APP_URL: process.env.APP_URL!,
    MONGODB_URI: process.env.MONGODB_URI!,
    NODE_ENV: process.env.NODE_ENV!,
    DISCORD_CHANNEL_ID: process.env.DISCORD_CHANNEL_ID!
  };
