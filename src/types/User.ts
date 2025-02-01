import mongoose from "mongoose";

// Define the interface for the User document
export interface IUser extends Document {
    stravaId: string;
    firstname: string;
    lastname: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;
}

// Define the User schema
const userSchema = new mongoose.Schema(
    {
        stravaId: {
            type: String,
            required: true,
            unique: true,
        },
        username: {
            type: String,
        },
        firstname: {
            type: String,
        },
        lastname: {
            type: String,
        },
        accessToken: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,
            required: true,
        },
        accessTokenExpiresAt: {
            type: Number,
            required: true,
        },
        discordId: {
            type: String,
        },
    },
    { timestamps: true }
); // Automatically create createdAt and updatedAt fields

// Create and export the User model
export default mongoose.model("User", userSchema);
